import { requireSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveDogId } from "@/lib/scope";
import { prisma } from "@/lib/db";
import { perPeriod, timeSinceLast, longestGapDays, breakdown, monthlyAverage, type Episode } from "@/lib/stats";
import { serializeEpisode } from "@/lib/seizure-types";
import { TrendsClient } from "./TrendsClient";

export default async function TrendsPage() {
  // Auth guard
  try {
    await requireSession();
  } catch {
    redirect("/login");
  }

  const now = new Date();
  const to = now;
  // Default: last 6 months
  const from = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());

  const dogId = await getActiveDogId();

  // Fetch all episodes for this dog
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

  // Range episodes
  const rangeEpisodes = allEpisodes.filter(
    (e) => e.occurredAt >= from && e.occurredAt < to
  );

  // Series
  const seriesRaw = perPeriod(rangeEpisodes, "month", { from, to });
  const series = seriesRaw.map((s) => ({
    label: s.label,
    start: s.start.toISOString(),
    count: s.count,
  }));

  // Stats
  const mAvg = monthlyAverage(rangeEpisodes, { from, to });
  const gapDays = longestGapDays(allEpisodes);
  const tsl = timeSinceLast(allEpisodes, now);

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

  const bdResult = breakdown(rangeEpisodes);

  // Med changes (empty until Task 10)
  const medSchedules = await prisma.medicationSchedule.findMany({
    where: {
      medication: { dogId },
      effectiveFrom: { gte: from, lte: to },
    },
    include: { medication: true },
  });

  const medChanges = medSchedules.map((sched) => {
    const changeDate = sched.effectiveFrom instanceof Date
      ? sched.effectiveFrom
      : new Date(sched.effectiveFrom as string);

    let bucketIndex = -1;
    for (let i = 0; i < seriesRaw.length; i++) {
      const bucketStart = seriesRaw[i].start;
      const bucketEnd =
        i + 1 < seriesRaw.length ? seriesRaw[i + 1].start : to;
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

  // Recent: newest 8
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

  const initial = {
    range: { from: from.toISOString(), to: to.toISOString() },
    bucket: "month" as const,
    series,
    stats,
    breakdown: bdResult,
    medChanges,
    recent,
  };

  return <TrendsClient initial={initial} now={now.toISOString()} />;
}
