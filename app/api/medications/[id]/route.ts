import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getActiveDogId } from "@/lib/scope";
import { prisma } from "@/lib/db";
import { enrichMed } from "../enrich";

const VALID_CATEGORIES = ["continuous", "otc", "compounded"] as const;
const VALID_FORMS = ["pill", "capsule", "tablet"] as const;

async function getLatestWeightKg(dogId: string): Promise<number | null> {
  const entry = await prisma.weightEntry.findFirst({
    where: { dogId },
    orderBy: { measuredOn: "desc" },
    select: { weightKg: true },
  });
  return entry ? entry.weightKg.toNumber() : null;
}

async function getMedForDog(id: string, dogId: string) {
  return prisma.medication.findFirst({
    where: { id, dogId, isActive: true },
    include: {
      schedules: { orderBy: { effectiveFrom: "asc" } },
      stockTransactions: { orderBy: { occurredAt: "asc" } },
    },
  });
}

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
  const now = new Date();

  const med = await getMedForDog(id, dogId);
  if (!med) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const latestWeightKg = await getLatestWeightKg(dogId);
  return NextResponse.json(enrichMed(med, now, latestWeightKg));
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

  const med = await getMedForDog(id, dogId);
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
    name,
    category,
    form,
    strengthMg: strengthMgRaw,
    reorderLeadTimeDays: leadRaw,
    notes: notesRaw,
  } = body as Record<string, unknown>;

  const updateData: Record<string, unknown> = {};

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "name must be a non-empty string" }, { status: 400 });
    }
    updateData.name = name.trim();
  }

  if (category !== undefined) {
    if (!VALID_CATEGORIES.includes(category as never)) {
      return NextResponse.json(
        { error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }
    updateData.category = category;
  }

  if (form !== undefined) {
    if (!VALID_FORMS.includes(form as never)) {
      return NextResponse.json(
        { error: `form must be one of: ${VALID_FORMS.join(", ")}` },
        { status: 400 }
      );
    }
    updateData.form = form;
  }

  if (strengthMgRaw !== undefined) {
    if (strengthMgRaw === null || strengthMgRaw === "") {
      updateData.strengthMg = null;
    } else {
      const n = Number(strengthMgRaw);
      if (!Number.isFinite(n) || n <= 0 || n >= 100000) {
        return NextResponse.json(
          { error: "strengthMg must be > 0 and < 100000" },
          { status: 400 }
        );
      }
      updateData.strengthMg = n;
    }
  }

  if (leadRaw !== undefined) {
    const n = Number(leadRaw);
    if (!Number.isInteger(n) || n < 0 || n > 365) {
      return NextResponse.json(
        { error: "reorderLeadTimeDays must be an integer 0–365" },
        { status: 400 }
      );
    }
    updateData.reorderLeadTimeDays = n;
  }

  if (notesRaw !== undefined) {
    updateData.notes =
      typeof notesRaw === "string" && notesRaw.trim() ? notesRaw.trim() : null;
  }

  try {
    const updated = await prisma.medication.update({
      where: { id },
      data: updateData,
      include: {
        schedules: { orderBy: { effectiveFrom: "asc" } },
        stockTransactions: { orderBy: { occurredAt: "asc" } },
      },
    });

    const now = new Date();
    const latestWeightKg = await getLatestWeightKg(dogId);
    return NextResponse.json(enrichMed(updated, now, latestWeightKg));
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

  const med = await getMedForDog(id, dogId);
  if (!med) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayDate = new Date(todayStr + "T00:00:00Z");

  try {
    await prisma.$transaction(async (tx) => {
      await tx.medication.update({
        where: { id },
        data: { isActive: false, archivedAt: new Date() },
      });

      // Close any open schedule (effectiveTo = null) as of today. updateMany is
      // atomic and defensive: under the normal one-open-schedule invariant it
      // closes that row, and if a stray second open row ever existed it closes
      // it too rather than leaving it dangling.
      await tx.medicationSchedule.updateMany({
        where: { medicationId: id, effectiveTo: null },
        data: { effectiveTo: todayDate },
      });
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
