import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getActiveDogId } from "@/lib/scope";
import { prisma } from "@/lib/db";

/** Validate and normalize "HH:MM" time string */
function normalizeTime(t: unknown): string | null {
  if (typeof t !== "string") return null;
  const trimmed = t.trim();
  const m = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export async function POST(
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

  // Scope check
  const med = await prisma.medication.findFirst({
    where: { id, dogId, isActive: true },
    include: {
      schedules: { where: { effectiveTo: null }, orderBy: { effectiveFrom: "desc" } },
    },
  });
  if (!med) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const {
    doseTimes,
    unitsPerDose: unitsPerDoseRaw,
    effectiveFrom: effectiveFromRaw,
  } = body as Record<string, unknown>;

  // Validate doseTimes
  if (!Array.isArray(doseTimes) || doseTimes.length === 0) {
    return NextResponse.json(
      { error: "doseTimes must be a non-empty array" },
      { status: 400 }
    );
  }
  const normalizedTimes: string[] = [];
  for (const t of doseTimes) {
    const norm = normalizeTime(t);
    if (!norm) {
      return NextResponse.json(
        { error: `Invalid time format: ${t}. Use HH:MM` },
        { status: 400 }
      );
    }
    normalizedTimes.push(norm);
  }

  // Validate unitsPerDose
  const unitsPerDoseNum = Number(unitsPerDoseRaw);
  if (!Number.isFinite(unitsPerDoseNum) || unitsPerDoseNum <= 0) {
    return NextResponse.json(
      { error: "unitsPerDose must be > 0" },
      { status: 400 }
    );
  }

  // effectiveFrom (default today)
  let effectiveFromStr: string;
  if (typeof effectiveFromRaw === "string" && effectiveFromRaw.trim()) {
    effectiveFromStr = effectiveFromRaw.trim();
  } else {
    effectiveFromStr = new Date().toISOString().slice(0, 10);
  }
  const effectiveFromDate = new Date(effectiveFromStr + "T00:00:00Z");
  if (isNaN(effectiveFromDate.getTime())) {
    return NextResponse.json(
      { error: "effectiveFrom must be YYYY-MM-DD" },
      { status: 400 }
    );
  }

  try {
    const schedule = await prisma.$transaction(async (tx) => {
      // Close the current open schedule
      const openSchedule = med.schedules[0]; // the latest one with effectiveTo = null
      if (openSchedule) {
        await tx.medicationSchedule.update({
          where: { id: openSchedule.id },
          data: { effectiveTo: effectiveFromDate },
        });
      }

      // Create new schedule
      return tx.medicationSchedule.create({
        data: {
          medicationId: id,
          doseTimes: normalizedTimes,
          unitsPerDose: unitsPerDoseNum,
          effectiveFrom: effectiveFromDate,
          effectiveTo: null,
        },
      });
    });

    return NextResponse.json({
      id: schedule.id,
      doseTimes: schedule.doseTimes,
      unitsPerDose: schedule.unitsPerDose.toNumber(),
      effectiveFrom: (schedule.effectiveFrom instanceof Date
        ? schedule.effectiveFrom
        : new Date(schedule.effectiveFrom)
      ).toISOString().slice(0, 10),
      effectiveTo: null,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
