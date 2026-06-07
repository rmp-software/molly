import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getActiveDogId } from "@/lib/scope";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

function serializeEntry(e: {
  id: string;
  measuredOn: Date;
  weightKg: Prisma.Decimal;
}) {
  return {
    id: e.id,
    measuredOn: e.measuredOn.toISOString().slice(0, 10),
    weightKg: e.weightKg.toNumber(),
  };
}

export async function GET() {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const dogId = await getActiveDogId();
  const entries = await prisma.weightEntry.findMany({
    where: { dogId },
    orderBy: { measuredOn: "desc" },
  });

  return NextResponse.json(entries.map(serializeEntry));
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

  const { measuredOn, weightKg } = body as Record<string, unknown>;

  if (
    typeof measuredOn !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(measuredOn)
  ) {
    return NextResponse.json(
      { error: "measuredOn must be YYYY-MM-DD" },
      { status: 400 }
    );
  }
  const dateVal = new Date(measuredOn + "T00:00:00Z");
  if (isNaN(dateVal.getTime()) || dateVal.toISOString().slice(0, 10) !== measuredOn) {
    return NextResponse.json(
      { error: "invalid date" },
      { status: 400 }
    );
  }

  const kgNum = Number(weightKg);
  if (!Number.isFinite(kgNum) || kgNum <= 0 || kgNum >= 1000) {
    return NextResponse.json(
      { error: "weightKg must be between 0 and 999.99" },
      { status: 400 }
    );
  }

  try {
    const entry = await prisma.weightEntry.create({
      data: {
        dogId,
        measuredOn: dateVal,
        weightKg: kgNum,
      },
    });
    return NextResponse.json(serializeEntry(entry), { status: 201 });
  } catch {
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
