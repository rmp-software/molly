import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getActiveDogId } from "@/lib/scope";
import { prisma } from "@/lib/db";
import { currentStock } from "@/lib/stock";
import type { Prisma } from "@prisma/client";
import { dbDateToLocalMidnight, dbDateToLocalMidnightNullable } from "@/lib/dates";

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

  // Scope check + load relations
  const med = await prisma.medication.findFirst({
    where: { id, dogId, isActive: true },
    include: {
      schedules: { orderBy: { effectiveFrom: "asc" } },
      stockTransactions: { orderBy: { occurredAt: "asc" } },
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

  const { countedQuantity: countedRaw, occurredAt: occurredAtRaw } = body as Record<string, unknown>;

  // Validate countedQuantity
  const countedNum = Number(countedRaw);
  if (!Number.isFinite(countedNum) || countedNum < 0) {
    return NextResponse.json(
      { error: "countedQuantity must be >= 0" },
      { status: 400 }
    );
  }
  if (countedNum >= 1_000_000) {
    return NextResponse.json(
      { error: "countedQuantity must be < 1000000" },
      { status: 400 }
    );
  }

  // Parse occurredAt
  let occurredAt = new Date();
  if (typeof occurredAtRaw === "string" && occurredAtRaw.trim()) {
    const parsed = new Date(occurredAtRaw);
    if (!isNaN(parsed.getTime())) {
      occurredAt = parsed;
    }
  }

  // Map to engine shapes.
  // effectiveFrom / effectiveTo are @db.Date columns (UTC-midnight); convert to
  // local-midnight so the stock engine's local-getter comparisons are correct.
  const scheduleShapes = med.schedules.map((s) => ({
    doseTimes: s.doseTimes,
    unitsPerDose: (s.unitsPerDose as Prisma.Decimal).toNumber(),
    effectiveFrom: dbDateToLocalMidnight(s.effectiveFrom),
    effectiveTo: dbDateToLocalMidnightNullable(s.effectiveTo),
  }));

  const txShapes = med.stockTransactions.map((t) => ({
    type: t.type as "restock" | "adjustment" | "consumption",
    quantity: (t.quantity as Prisma.Decimal).toNumber(),
    occurredAt: t.occurredAt instanceof Date ? t.occurredAt : new Date(t.occurredAt),
  }));

  // Compute current stock at occurredAt
  const stockAtTime = currentStock(txShapes, scheduleShapes, occurredAt);

  // Delta = counted - current
  const delta = countedNum - stockAtTime;

  try {
    const txn = await prisma.stockTransaction.create({
      data: {
        medicationId: id,
        type: "adjustment",
        quantity: delta,
        occurredAt,
        note: `Recontagem: ${countedNum} (ajuste ${delta >= 0 ? "+" : ""}${delta.toFixed(2)})`,
      },
    });

    return NextResponse.json({
      id: txn.id,
      type: txn.type,
      quantity: txn.quantity.toNumber(),
      occurredAt: txn.occurredAt.toISOString(),
      note: txn.note,
      stockBefore: stockAtTime,
      countedQuantity: countedNum,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
