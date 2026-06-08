import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getActiveDog } from "@/lib/scope";
import { prisma } from "@/lib/db";
import { serializeEpisode } from "@/lib/seizure-types";
import { monthlyAverage, longestGapDays, breakdown, durationStats } from "@/lib/stats";
import { activeScheduleOn } from "@/lib/schedule";
import { dbDateToLocalMidnight } from "@/lib/dates";

function defaultRange(): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date(to);
  from.setMonth(from.getMonth() - 6);
  return { from, to };
}

export async function GET(request: Request) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const dog = await getActiveDog();
  const url = new URL(request.url);
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");

  let from: Date;
  let to: Date;

  if (fromStr || toStr) {
    // Both provided (or at least one): validate them
    const defaults = defaultRange();
    if (fromStr) {
      const d = new Date(fromStr);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "invalid from date" }, { status: 400 });
      }
      from = d;
    } else {
      from = defaults.from;
    }
    if (toStr) {
      const d = new Date(toStr);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "invalid to date" }, { status: 400 });
      }
      to = d;
    } else {
      to = defaults.to;
    }
  } else {
    const defaults = defaultRange();
    from = defaults.from;
    to = defaults.to;
  }

  // Fetch episodes in range
  const episodeRows = await prisma.seizureEpisode.findMany({
    where: {
      dogId: dog.id,
      occurredAt: { gte: from, lte: to },
    },
    orderBy: { occurredAt: "desc" },
  });

  // Stats
  const episodeObjs = episodeRows.map((e) => ({
    occurredAt: e.occurredAt,
    type: e.type,
    severity: e.severity ?? null,
    durationSeconds: e.durationSeconds ?? null,
  }));

  const total = episodeRows.length;
  const avgPerMonth = monthlyAverage(episodeObjs, { from, to });
  const gapDays = longestGapDays(episodeObjs);
  const { byType, bySeverity } = breakdown(episodeObjs);

  // durationStats only matters when there's ≥1 tonic-clonic episode in range;
  // otherwise skip the full-history fetch + computation and use the empty sentinel.
  // durationStats needs ALL episodes (it filters the previous-window internally),
  // so fetch the dog's full history rather than only the in-range rows.
  // bucket = "month": the report is a static document, so month buckets are the
  // sensible slope granularity (not week/day, which would be noisy here).
  let tonicClonicDuration: ReturnType<typeof durationStats>;
  if (episodeObjs.some((e) => e.type === "tonic_clonic")) {
    const allEpisodeRows = await prisma.seizureEpisode.findMany({
      where: { dogId: dog.id },
      orderBy: { occurredAt: "asc" },
    });
    const allEpisodeObjs = allEpisodeRows.map((e) => ({
      occurredAt: e.occurredAt,
      type: e.type,
      severity: e.severity ?? null,
      durationSeconds: e.durationSeconds ?? null,
    }));
    tonicClonicDuration = durationStats(
      allEpisodeObjs,
      { from, to },
      "tonic_clonic",
      "month"
    );
  } else {
    tonicClonicDuration = {
      currentAvg: null,
      previousAvg: null,
      deltaSeconds: null,
      direction: "flat",
      emergencyCount: 0,
      maxSeconds: null,
    };
  }

  // Fetch active medications with latest schedule
  const medications = await prisma.medication.findMany({
    where: { dogId: dog.id, isActive: true },
    include: {
      schedules: { orderBy: { effectiveFrom: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });

  const now = new Date();
  const serializedMeds = medications.map((med) => {
    const scheduleShapes = med.schedules.map((s) => ({
      doseTimes: s.doseTimes,
      unitsPerDose: s.unitsPerDose.toNumber(),
      effectiveFrom: dbDateToLocalMidnight(s.effectiveFrom),
      effectiveTo: s.effectiveTo ? dbDateToLocalMidnight(s.effectiveTo) : null,
    }));
    const active = activeScheduleOn(scheduleShapes, now);

    return {
      name: med.name,
      category: med.category as string,
      form: med.form as string,
      strengthMg: med.strengthMg ? med.strengthMg.toNumber() : null,
      activeSchedule: active
        ? {
            doseTimes: active.doseTimes,
            unitsPerDose: active.unitsPerDose,
            effectiveFrom: active.effectiveFrom.toISOString().slice(0, 10),
          }
        : null,
    };
  });

  // Fetch schedule changes (MedicationSchedule rows) within range for active meds
  const allScheduleChanges = await prisma.medicationSchedule.findMany({
    where: {
      medicationId: { in: medications.map((m) => m.id) },
      effectiveFrom: { gte: from, lte: to },
    },
    include: { medication: { select: { name: true } } },
    orderBy: { effectiveFrom: "asc" },
  });

  const serializedScheduleChanges = allScheduleChanges.map((sc) => ({
    medName: sc.medication.name,
    effectiveFrom: dbDateToLocalMidnight(sc.effectiveFrom).toISOString().slice(0, 10),
    doseTimes: sc.doseTimes,
    unitsPerDose: sc.unitsPerDose.toNumber(),
  }));

  // Fetch latest weight
  const latestWeightEntry = await prisma.weightEntry.findFirst({
    where: { dogId: dog.id },
    orderBy: { measuredOn: "desc" },
    select: { weightKg: true },
  });
  const latestWeightKg = latestWeightEntry ? latestWeightEntry.weightKg.toNumber() : null;

  return NextResponse.json({
    dog: {
      name: dog.name,
      breed: dog.breed ?? null,
      birthdate: dog.birthdate ? dog.birthdate.toISOString().slice(0, 10) : null,
      diagnosis: dog.diagnosis ?? null,
      vetName: dog.vetName ?? null,
      emergencyContact: dog.emergencyContact ?? null,
    },
    latestWeightKg,
    range: {
      from: from.toISOString(),
      to: to.toISOString(),
    },
    episodes: episodeRows.map(serializeEpisode),
    summary: {
      total,
      monthlyAverage: avgPerMonth,
      longestGapDays: gapDays,
      byType,
      bySeverity,
      durationStats: {
        currentAvg: tonicClonicDuration.currentAvg,
        previousAvg: tonicClonicDuration.previousAvg,
        deltaSeconds: tonicClonicDuration.deltaSeconds,
        direction: tonicClonicDuration.direction,
        emergencyCount: tonicClonicDuration.emergencyCount,
        maxSeconds: tonicClonicDuration.maxSeconds,
      },
    },
    medications: serializedMeds,
    scheduleChanges: serializedScheduleChanges,
  });
}
