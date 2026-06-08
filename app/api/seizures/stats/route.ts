import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getActiveDogId } from "@/lib/scope";
import { prisma } from "@/lib/db";
import { type Episode } from "@/lib/stats";
import { buildTrendsPayload } from "@/lib/trends";
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

  const payload = buildTrendsPayload(allEpisodes, {
    from,
    to,
    bucket,
    now,
    medSchedules,
    recent,
  });

  return NextResponse.json(payload);
}
