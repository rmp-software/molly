import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getActiveDogId } from "@/lib/scope";
import { prisma } from "@/lib/db";
import {
  perPeriod,
  timeSinceLast,
  longestGapDays,
  breakdown,
  monthlyAverage,
  type Episode,
} from "@/lib/stats";
import { serializeEpisode } from "@/lib/seizure-types";

export async function GET(request: Request) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const dogId = await getActiveDogId();
  const url = new URL(request.url);

  // Parse bucket param
  const bucketParam = url.searchParams.get("bucket");
  const bucket: "week" | "month" =
    bucketParam === "week" ? "week" : "month";

  // Parse or default range to last 6 months
  const now = new Date();

  let to: Date;
  const toStr = url.searchParams.get("to");
  if (toStr) {
    const parsed = new Date(toStr);
    to = isNaN(parsed.getTime()) ? now : parsed;
  } else {
    to = now;
  }

  let from: Date;
  const fromStr = url.searchParams.get("from");
  if (fromStr) {
    const parsed = new Date(fromStr);
    from = isNaN(parsed.getTime()) ? new Date(to.getFullYear(), to.getMonth() - 6, to.getDate()) : parsed;
  } else {
    // Default: 6 months back
    from = new Date(to.getFullYear(), to.getMonth() - 6, to.getDate());
  }

  // Fetch all episodes for this dog (needed for longestGapDays / timeSinceLast / totalInYear)
  const allRows = await prisma.seizureEpisode.findMany({
    where: { dogId },
    orderBy: { occurredAt: "asc" },
  });

  const allEpisodes: Episode[] = allRows.map((e) => ({
    occurredAt: e.occurredAt,
    type: e.type as Episode["type"],
    severity: e.severity as Episode["severity"],
    durationSeconds: e.durationSeconds,
  }));

  // Episodes within the requested range
  const rangeEpisodes = allEpisodes.filter(
    (e) => e.occurredAt >= from && e.occurredAt < to
  );

  // Build series
  const series = perPeriod(rangeEpisodes, bucket, { from, to }).map((s) => ({
    label: s.label,
    start: s.start.toISOString(),
    count: s.count,
  }));

  // Stats
  const mAvg = monthlyAverage(rangeEpisodes, { from, to });
  const gapDays = longestGapDays(allEpisodes);
  const tsl = timeSinceLast(allEpisodes, now);

  // Total in current calendar year
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
  const totalInYear = allEpisodes.filter(
    (e) => e.occurredAt >= yearStart && e.occurredAt < yearEnd
  ).length;

  const stats = {
    monthlyAverage: mAvg,
    longestGapDays: gapDays,
    totalInRange: rangeEpisodes.length,
    totalInYear,
    timeSinceLast: tsl ? { days: tsl.days } : null,
  };

  // Breakdown for the range
  const bdResult = breakdown(rangeEpisodes);

  // Med changes: MedicationSchedule rows for this dog within the range
  // Will be empty until Task 10 creates medications
  const medSchedules = await prisma.medicationSchedule.findMany({
    where: {
      medication: { dogId },
      effectiveFrom: {
        gte: from,
        lte: to,
      },
    },
    include: { medication: true },
  });

  // Build series lookup for annotation bucket indices
  // series[i].start is the ISO string of the bucket start; we need the Date
  const seriesRaw = perPeriod(rangeEpisodes, bucket, { from, to });

  const medChanges = medSchedules.map((sched) => {
    const changeDate = sched.effectiveFrom instanceof Date
      ? sched.effectiveFrom
      : new Date(sched.effectiveFrom);

    // Find which bucket this date falls into
    let bucketIndex = -1;
    for (let i = 0; i < seriesRaw.length; i++) {
      const bucketStart = seriesRaw[i].start;
      const bucketEnd =
        i + 1 < seriesRaw.length
          ? seriesRaw[i + 1].start
          : to;
      if (changeDate >= bucketStart && changeDate < bucketEnd) {
        bucketIndex = i;
        break;
      }
    }

    const unitsStr = sched.unitsPerDose ? ` ${sched.unitsPerDose}×` : "";
    return {
      date: changeDate.toISOString(),
      label: `${sched.medication.name}${unitsStr}`,
      bucketIndex,
    };
  });

  // Recent episodes: last 8, newest first
  const recentRows = await prisma.seizureEpisode.findMany({
    where: { dogId },
    orderBy: { occurredAt: "desc" },
    take: 8,
  });

  const recent = recentRows.map((e) =>
    serializeEpisode({
      id: e.id,
      occurredAt: e.occurredAt,
      type: e.type as "tonic_clonic" | "focal" | "absence" | "other",
      durationSeconds: e.durationSeconds,
      severity: e.severity as "mild" | "moderate" | "severe" | null,
      isCluster: e.isCluster,
      rescueGiven: e.rescueGiven,
      notes: e.notes,
    })
  );

  return NextResponse.json({
    range: { from: from.toISOString(), to: to.toISOString() },
    bucket,
    series,
    stats,
    breakdown: bdResult,
    medChanges,
    recent,
  });
}
