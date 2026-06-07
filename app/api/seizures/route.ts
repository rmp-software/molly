import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getActiveDogId } from "@/lib/scope";
import { prisma } from "@/lib/db";
import { markCluster } from "@/lib/stats";

const VALID_TYPES = ["tonic_clonic", "focal", "absence", "other"] as const;
const VALID_SEVERITIES = ["mild", "moderate", "severe"] as const;

type SeizureType = (typeof VALID_TYPES)[number];
type Severity = (typeof VALID_SEVERITIES)[number];

function serializeEpisode(e: {
  id: string;
  occurredAt: Date;
  type: SeizureType;
  durationSeconds: number | null;
  severity: Severity | null;
  isCluster: boolean;
  rescueGiven: boolean;
  notes: string | null;
}) {
  return {
    id: e.id,
    occurredAt: e.occurredAt.toISOString(),
    type: e.type,
    durationSeconds: e.durationSeconds,
    severity: e.severity,
    isCluster: e.isCluster,
    rescueGiven: e.rescueGiven,
    notes: e.notes,
  };
}

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
  if (isNaN(occurredAtDate.getTime())) {
    return NextResponse.json({ error: "occurredAt is not a valid date" }, { status: 400 });
  }
  // Round-trip check: re-stringify and parse to detect overflow dates
  const roundTripped = new Date(occurredAtDate.toISOString());
  if (Math.abs(roundTripped.getTime() - occurredAtDate.getTime()) > 1000) {
    return NextResponse.json({ error: "occurredAt failed round-trip check" }, { status: 400 });
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
    if (!Number.isInteger(dur) || dur < 0) {
      return NextResponse.json(
        { error: "durationSeconds must be a non-negative integer" },
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

  // Compute isCluster: query other episodes for this dog
  const otherEpisodes = await prisma.seizureEpisode.findMany({
    where: { dogId },
    select: { occurredAt: true },
  });
  const otherDates = otherEpisodes.map((e) => e.occurredAt);
  const isCluster = markCluster(occurredAtDate, otherDates);

  try {
    const episode = await prisma.seizureEpisode.create({
      data: {
        dogId,
        occurredAt: occurredAtDate,
        type: type as SeizureType,
        durationSeconds: durationSecondsVal,
        severity: severityVal,
        isCluster,
        rescueGiven: rescueGiven === true,
        notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
      },
    });
    return NextResponse.json(serializeEpisode(episode), { status: 201 });
  } catch {
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
