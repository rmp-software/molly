import { requireSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveDogId } from "@/lib/scope";
import { prisma } from "@/lib/db";
import { type Episode } from "@/lib/stats";
import { buildTrendsPayload } from "@/lib/trends";
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

  // Med changes (empty until Task 10)
  const medSchedules = await prisma.medicationSchedule.findMany({
    where: {
      medication: { dogId },
      effectiveFrom: { gte: from, lte: to },
    },
    include: { medication: true },
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

  const initial = buildTrendsPayload(allEpisodes, {
    from,
    to,
    bucket: "month",
    now,
    medSchedules,
    recent,
  });

  return <TrendsClient initial={initial} now={now.toISOString()} />;
}
