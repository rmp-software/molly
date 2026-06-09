import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getActiveDogId } from "@/lib/scope";
import { prisma } from "@/lib/db";
import { enrichMed } from "./enrich";

// Category → default reorder lead time
const CATEGORY_LEAD_DAYS: Record<string, number> = {
  compounded: 7,
  continuous: 3,
  otc: 3,
};

const VALID_CATEGORIES = ["continuous", "otc", "compounded"] as const;
const VALID_FORMS = ["pill", "capsule", "tablet"] as const;

/** Validate and normalize "HH:MM" time string */
function normalizeTime(t: unknown): string | null {
  if (typeof t !== "string") return null;
  const trimmed = t.trim();
  // Accept H:MM or HH:MM
  const m = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

async function getMedWithRelations(dogId: string, isActiveFilter: boolean) {
  return prisma.medication.findMany({
    where: { dogId, isActive: isActiveFilter },
    include: {
      schedules: { orderBy: { effectiveFrom: "asc" } },
      stockTransactions: { orderBy: { occurredAt: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });
}

async function getLatestWeightKg(dogId: string): Promise<number | null> {
  const entry = await prisma.weightEntry.findFirst({
    where: { dogId },
    orderBy: { measuredOn: "desc" },
    select: { weightKg: true },
  });
  return entry ? entry.weightKg.toNumber() : null;
}

export async function GET(request: Request) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const dogId = await getActiveDogId();
  const now = new Date();

  const archived = new URL(request.url).searchParams.get("archived") === "1";

  const [meds, latestWeightKg] = await Promise.all([
    getMedWithRelations(dogId, !archived),
    getLatestWeightKg(dogId),
  ]);

  return NextResponse.json(meds.map((med) => enrichMed(med, now, latestWeightKg)));
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
    name,
    category,
    form,
    strengthMg: strengthMgRaw,
    reorderLeadTimeDays: leadRaw,
    schedule: scheduleBody,
    startingStock: startingStockRaw,
    notes: notesRaw,
  } = body as Record<string, unknown>;

  // Validate name
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  // Validate category
  if (!VALID_CATEGORIES.includes(category as never)) {
    return NextResponse.json(
      { error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` },
      { status: 400 }
    );
  }

  // Validate form
  if (!VALID_FORMS.includes(form as never)) {
    return NextResponse.json(
      { error: `form must be one of: ${VALID_FORMS.join(", ")}` },
      { status: 400 }
    );
  }

  // Validate strengthMg (optional)
  let strengthMgNum: number | null = null;
  if (strengthMgRaw !== undefined && strengthMgRaw !== null && strengthMgRaw !== "") {
    const n = Number(strengthMgRaw);
    if (!Number.isFinite(n) || n <= 0 || n >= 100000) {
      return NextResponse.json(
        { error: "strengthMg must be > 0 and < 100000" },
        { status: 400 }
      );
    }
    strengthMgNum = n;
  }

  // Validate reorderLeadTimeDays (optional, defaults from category)
  let leadTimeDays: number = CATEGORY_LEAD_DAYS[category as string] ?? 3;
  if (leadRaw !== undefined && leadRaw !== null && leadRaw !== "") {
    const n = Number(leadRaw);
    if (!Number.isInteger(n) || n < 0 || n > 365) {
      return NextResponse.json(
        { error: "reorderLeadTimeDays must be an integer 0–365" },
        { status: 400 }
      );
    }
    leadTimeDays = n;
  }

  // Validate schedule
  if (!scheduleBody || typeof scheduleBody !== "object") {
    return NextResponse.json({ error: "schedule is required" }, { status: 400 });
  }
  const sched = scheduleBody as Record<string, unknown>;

  // Validate doseTimes
  if (!Array.isArray(sched.doseTimes) || sched.doseTimes.length === 0) {
    return NextResponse.json(
      { error: "schedule.doseTimes must be a non-empty array" },
      { status: 400 }
    );
  }
  const normalizedTimes: string[] = [];
  for (const t of sched.doseTimes) {
    const norm = normalizeTime(t);
    if (!norm) {
      return NextResponse.json(
        { error: `Invalid time format: ${t}. Use HH:MM` },
        { status: 400 }
      );
    }
    normalizedTimes.push(norm);
  }
  // Reject duplicate dose times
  const uniqueTimes = [...new Set(normalizedTimes)];
  if (uniqueTimes.length !== normalizedTimes.length) {
    return NextResponse.json(
      { error: "doseTimes must be unique" },
      { status: 400 }
    );
  }

  // Validate unitsPerDose
  const unitsPerDoseNum = Number(sched.unitsPerDose);
  if (!Number.isFinite(unitsPerDoseNum) || unitsPerDoseNum <= 0) {
    return NextResponse.json(
      { error: "schedule.unitsPerDose must be > 0" },
      { status: 400 }
    );
  }
  if (unitsPerDoseNum >= 1_000_000) {
    return NextResponse.json(
      { error: "schedule.unitsPerDose must be < 1000000" },
      { status: 400 }
    );
  }

  // effectiveFrom
  let effectiveFrom: string;
  if (typeof sched.effectiveFrom === "string" && sched.effectiveFrom.trim()) {
    effectiveFrom = sched.effectiveFrom.trim();
  } else {
    // Default to today
    effectiveFrom = new Date().toISOString().slice(0, 10);
  }
  const effectiveFromDate = new Date(effectiveFrom + "T00:00:00Z");
  if (isNaN(effectiveFromDate.getTime())) {
    return NextResponse.json(
      { error: "schedule.effectiveFrom must be YYYY-MM-DD" },
      { status: 400 }
    );
  }

  // Validate startingStock (optional)
  let startingStockNum = 0;
  if (startingStockRaw !== undefined && startingStockRaw !== null && startingStockRaw !== "") {
    const n = Number(startingStockRaw);
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json(
        { error: "startingStock must be >= 0" },
        { status: 400 }
      );
    }
    if (n >= 1_000_000) {
      return NextResponse.json(
        { error: "startingStock must be < 1000000" },
        { status: 400 }
      );
    }
    startingStockNum = n;
  }

  const now = new Date();

  try {
    const med = await prisma.$transaction(async (tx) => {
      const created = await tx.medication.create({
        data: {
          dogId,
          name: name.trim(),
          category: category as "continuous" | "otc" | "compounded",
          form: form as "pill" | "capsule" | "tablet",
          strengthMg: strengthMgNum,
          reorderLeadTimeDays: leadTimeDays,
          isActive: true,
          notes:
            typeof notesRaw === "string" && notesRaw.trim()
              ? notesRaw.trim()
              : null,
        },
        include: {
          schedules: { orderBy: { effectiveFrom: "asc" } },
          stockTransactions: { orderBy: { occurredAt: "asc" } },
        },
      });

      // Create initial schedule (use deduplicated uniqueTimes)
      await tx.medicationSchedule.create({
        data: {
          medicationId: created.id,
          doseTimes: uniqueTimes,
          unitsPerDose: unitsPerDoseNum,
          effectiveFrom: effectiveFromDate,
          effectiveTo: null,
        },
      });

      // Create starting stock transaction if > 0
      if (startingStockNum > 0) {
        await tx.stockTransaction.create({
          data: {
            medicationId: created.id,
            type: "restock",
            quantity: startingStockNum,
            occurredAt: now,
          },
        });
      }

      // Reload with relations
      return tx.medication.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          schedules: { orderBy: { effectiveFrom: "asc" } },
          stockTransactions: { orderBy: { occurredAt: "asc" } },
        },
      });
    });

    const latestWeightKg = await getLatestWeightKg(dogId);
    return NextResponse.json(enrichMed(med, now, latestWeightKg), { status: 201 });
  } catch {
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
