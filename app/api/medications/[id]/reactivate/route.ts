import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getActiveDogId } from "@/lib/scope";
import { prisma } from "@/lib/db";
import { enrichMed } from "../../enrich";

async function getLatestWeightKg(dogId: string): Promise<number | null> {
  const entry = await prisma.weightEntry.findFirst({
    where: { dogId },
    orderBy: { measuredOn: "desc" },
    select: { weightKg: true },
  });
  return entry ? entry.weightKg.toNumber() : null;
}

export async function POST(
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

  // Scope check WITHOUT isActive filter (the med is archived), but still
  // enforce dog ownership. 404 if not found OR already active.
  const med = await prisma.medication.findFirst({
    where: { id, dogId },
  });
  if (!med || med.isActive) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  try {
    const updated = await prisma.medication.update({
      where: { id },
      data: { isActive: true, archivedAt: null },
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
