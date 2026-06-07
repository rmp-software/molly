import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getActiveDogId } from "@/lib/scope";
import { prisma } from "@/lib/db";
import { recomputeClusters } from "@/lib/cluster";
import {
  VALID_TYPES,
  VALID_SEVERITIES,
  serializeEpisode,
  type SeizureType,
  type Severity,
} from "@/lib/seizure-types";

export async function GET(request: Request) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const dogId = await getActiveDogId();

  const url = new URL(request.url);
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");

  const where: Record<string, unknown> = { dogId };

  if (fromStr || toStr) {
    const occurredAt: Record<string, Date> = {};
    if (fromStr) {
      const from = new Date(fromStr);
      if (!isNaN(from.getTime())) occurredAt.gte = from;
    }
    if (toStr) {
      const to = new Date(toStr);
      if (!isNaN(to.getTime())) occurredAt.lte = to;
    }
    if (Object.keys(occurredAt).length > 0) where.occurredAt = occurredAt;
  }

  const episodes = await prisma.seizureEpisode.findMany({
    where,
    orderBy: { occurredAt: "desc" },
  });

  return NextResponse.json(episodes.map(serializeEpisode));
}

export async function POST(request: Request) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const dogId = await getActiveDogId();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const {
    occurredAt: occurredAtRaw,
    type,
    durationSeconds,
    severity,
    rescueGiven,
    notes,
  } = body as Record<string, unknown>;

  // Validate occurredAt
  if (typeof occurredAtRaw !== "string" || !occurredAtRaw) {
    return NextResponse.json(
      { error: "occurredAt is required and must be a string" },
      { status: 400 }
    );
  }
  const occurredAtDate = new Date(occurredAtRaw);
  const year = occurredAtDate.getUTCFullYear();
  if (isNaN(occurredAtDate.getTime()) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "invalid date" }, { status: 400 });
  }
  if (occurredAtDate.getTime() > Date.now() + 60_000) {
    return NextResponse.json({ error: "occurredAt cannot be in the future" }, { status: 400 });
  }

  // Validate type
  if (!VALID_TYPES.includes(type as SeizureType)) {
    return NextResponse.json(
      { error: `type must be one of: ${VALID_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  // Validate durationSeconds (optional)
  let durationSecondsVal: number | null = null;
  if (durationSeconds !== undefined && durationSeconds !== null) {
    const dur = Number(durationSeconds);
    if (!Number.isInteger(dur) || dur < 0 || dur > 86400) {
      return NextResponse.json(
        { error: "invalid duration" },
        { status: 400 }
      );
    }
    durationSecondsVal = dur;
  }

  // Validate severity (optional)
  let severityVal: Severity | null = null;
  if (severity !== undefined && severity !== null) {
    if (!VALID_SEVERITIES.includes(severity as Severity)) {
      return NextResponse.json(
        { error: `severity must be one of: ${VALID_SEVERITIES.join(", ")}` },
        { status: 400 }
      );
    }
    severityVal = severity as Severity;
  }

  try {
    const episode = await prisma.seizureEpisode.create({
      data: {
        dogId,
        occurredAt: occurredAtDate,
        type: type as SeizureType,
        durationSeconds: durationSecondsVal,
        severity: severityVal,
        isCluster: false, // placeholder; authoritative value set by recompute below
        rescueGiven: rescueGiven === true,
        notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
      },
    });

    // Recompute cluster flags for ALL episodes of this dog (bilateral correctness).
    const clusterMap = await recomputeClusters(dogId);

    // Return the episode with the freshly-computed isCluster value.
    return NextResponse.json(
      serializeEpisode({ ...episode, isCluster: clusterMap.get(episode.id) ?? false }),
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
