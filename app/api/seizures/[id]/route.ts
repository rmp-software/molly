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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const dogId = await getActiveDogId();

  const episode = await prisma.seizureEpisode.findFirst({
    where: { id, dogId },
  });

  if (!episode) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json(serializeEpisode(episode));
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const dogId = await getActiveDogId();

  const existing = await prisma.seizureEpisode.findFirst({
    where: { id, dogId },
  });

  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const updates = body as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  // occurredAt
  if ("occurredAt" in updates) {
    if (typeof updates.occurredAt !== "string" || !updates.occurredAt) {
      return NextResponse.json({ error: "occurredAt must be a string" }, { status: 400 });
    }
    const d = new Date(updates.occurredAt as string);
    const year = d.getUTCFullYear();
    if (isNaN(d.getTime()) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: "invalid date" }, { status: 400 });
    }
    if (d.getTime() > Date.now() + 60_000) {
      return NextResponse.json({ error: "occurredAt cannot be in the future" }, { status: 400 });
    }
    data.occurredAt = d;
  }

  // type
  if ("type" in updates) {
    if (!VALID_TYPES.includes(updates.type as SeizureType)) {
      return NextResponse.json(
        { error: `type must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }
    data.type = updates.type;
  }

  // durationSeconds
  if ("durationSeconds" in updates) {
    if (updates.durationSeconds === null || updates.durationSeconds === undefined) {
      data.durationSeconds = null;
    } else {
      const dur = Number(updates.durationSeconds);
      if (!Number.isInteger(dur) || dur < 0 || dur > 86400) {
        return NextResponse.json(
          { error: "invalid duration" },
          { status: 400 }
        );
      }
      data.durationSeconds = dur;
    }
  }

  // severity
  if ("severity" in updates) {
    if (updates.severity === null || updates.severity === undefined) {
      data.severity = null;
    } else if (!VALID_SEVERITIES.includes(updates.severity as Severity)) {
      return NextResponse.json(
        { error: `severity must be one of: ${VALID_SEVERITIES.join(", ")}` },
        { status: 400 }
      );
    } else {
      data.severity = updates.severity;
    }
  }

  // rescueGiven
  if ("rescueGiven" in updates) {
    data.rescueGiven = updates.rescueGiven === true;
  }

  // notes
  if ("notes" in updates) {
    if (updates.notes === null || updates.notes === undefined) {
      data.notes = null;
    } else {
      data.notes =
        typeof updates.notes === "string" && (updates.notes as string).trim()
          ? (updates.notes as string).trim()
          : null;
    }
  }

  try {
    const updated = await prisma.seizureEpisode.update({
      where: { id },
      data,
    });

    // Recompute cluster flags for ALL episodes of this dog (bilateral correctness).
    const clusterMap = await recomputeClusters(dogId);

    // Return the episode with the freshly-computed isCluster value.
    return NextResponse.json(
      serializeEpisode({ ...updated, isCluster: clusterMap.get(updated.id) ?? updated.isCluster })
    );
  } catch {
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const dogId = await getActiveDogId();

  const existing = await prisma.seizureEpisode.findFirst({
    where: { id, dogId },
  });

  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  try {
    await prisma.seizureEpisode.delete({ where: { id } });

    // Recompute cluster flags for remaining episodes of this dog.
    await recomputeClusters(dogId);

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
