import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getActiveDogId } from "@/lib/scope";
import { prisma } from "@/lib/db";

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

  const entry = await prisma.weightEntry.findFirst({
    where: { id, dogId },
  });

  if (!entry) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await prisma.weightEntry.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
