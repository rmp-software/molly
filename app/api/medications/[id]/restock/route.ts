import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getActiveDogId } from "@/lib/scope";
import { prisma } from "@/lib/db";

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

  const { quantity: quantityRaw, occurredAt: occurredAtRaw } = body as Record<string, unknown>;

  // Validate quantity
  const quantityNum = Number(quantityRaw);
  if (!Number.isFinite(quantityNum) || quantityNum <= 0) {
    return NextResponse.json(
      { error: "quantity must be > 0" },
      { status: 400 }
    );
  }
  if (quantityNum >= 1_000_000) {
    return NextResponse.json(
      { error: "quantity must be < 1000000" },
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

  try {
    const txn = await prisma.stockTransaction.create({
      data: {
        medicationId: id,
        type: "restock",
        quantity: quantityNum,
        occurredAt,
      },
    });

    return NextResponse.json({
      id: txn.id,
      type: txn.type,
      quantity: txn.quantity.toNumber(),
      occurredAt: txn.occurredAt.toISOString(),
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
