import { requireSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveDogId } from "@/lib/scope";
import { prisma } from "@/lib/db";
import { timeSinceLast, perPeriod } from "@/lib/stats";
import { nextDose as computeNextDose } from "@/lib/schedule";
import { dbDateToLocalMidnight, dbDateToLocalMidnightNullable } from "@/lib/dates";
import { HomeClient, type HomeProps } from "./HomeClient";

export default async function HomePage() {
  try {
    await requireSession();
  } catch {
    redirect("/login");
  }

  const dogId = await getActiveDogId();
  const now = new Date();

  // --- Episodes ---
  const rawEpisodes = await prisma.seizureEpisode.findMany({
    where: { dogId },
    select: { occurredAt: true, type: true, durationSeconds: true, severity: true },
    orderBy: { occurredAt: "asc" },
  });

  const episodes = rawEpisodes.map((e) => ({
    occurredAt: e.occurredAt instanceof Date ? e.occurredAt : new Date(e.occurredAt),
    type: e.type as "tonic_clonic" | "focal" | "absence" | "other",
    durationSeconds: e.durationSeconds,
    severity: e.severity as "mild" | "moderate" | "severe" | null | undefined,
  }));

  // Last seizure
  const sinceResult = timeSinceLast(episodes, now);
  const lastSeizureAt = sinceResult !== null
    ? episodes.reduce((best, e) =>
        e.occurredAt.getTime() > best.occurredAt.getTime() ? e : best
      ).occurredAt.toISOString()
    : null;

  // --- Next dose: find earliest next dose across all active meds ---
  const activeMeds = await prisma.medication.findMany({
    where: { dogId, isActive: true },
    select: {
      id: true,
      name: true,
      schedules: {
        select: {
          doseTimes: true,
          unitsPerDose: true,
          effectiveFrom: true,
          effectiveTo: true,
        },
      },
    },
  });

  let earliestDose: { medName: string; at: string } | null = null;

  for (const med of activeMeds) {
    const schedules = med.schedules.map((s) => ({
      doseTimes: s.doseTimes,
      unitsPerDose: s.unitsPerDose.toNumber(),
      effectiveFrom: dbDateToLocalMidnight(s.effectiveFrom),
      effectiveTo: dbDateToLocalMidnightNullable(s.effectiveTo),
    }));

    const dose = computeNextDose(schedules, now);
    if (dose) {
      if (
        earliestDose === null ||
        dose.at.getTime() < new Date(earliestDose.at).getTime()
      ) {
        earliestDose = { medName: med.name, at: dose.at.toISOString() };
      }
    }
  }

  // --- Mini chart: 6-month series ---
  const sixMonthsAgo = new Date(
    now.getFullYear(),
    now.getMonth() - 6,
    now.getDate()
  );
  const rawSeries = perPeriod(episodes, "month", { from: sixMonthsAgo, to: now });

  // Trend: compare last bucket vs previous
  let trend: HomeProps["trend"] = "stable";
  if (rawSeries.length >= 2) {
    const last = rawSeries[rawSeries.length - 1].count;
    const prev = rawSeries[rawSeries.length - 2].count;
    if (last < prev) trend = "less";
    else if (last > prev) trend = "more";
  }

  const series = rawSeries.map((s) => ({
    label: s.label,
    start: s.start.toISOString(),
    count: s.count,
  }));

  return (
    <HomeClient
      lastSeizureAt={lastSeizureAt}
      nextDose={earliestDose}
      series={series}
      trend={trend}
    />
  );
}
