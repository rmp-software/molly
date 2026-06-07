import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getActiveDog } from "@/lib/scope";
import { prisma } from "@/lib/db";

function serializeDog(dog: {
  id: string;
  name: string;
  breed: string | null;
  birthdate: Date | null;
  diagnosis: string | null;
  vetName: string | null;
  emergencyContact: string | null;
}) {
  return {
    id: dog.id,
    name: dog.name,
    breed: dog.breed ?? null,
    birthdate: dog.birthdate ? dog.birthdate.toISOString().slice(0, 10) : null,
    diagnosis: dog.diagnosis ?? null,
    vetName: dog.vetName ?? null,
    emergencyContact: dog.emergencyContact ?? null,
  };
}

export async function GET() {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const dog = await getActiveDog();
  return NextResponse.json(serializeDog(dog));
}

export async function PUT(request: Request) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const dog = await getActiveDog();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const {
    name,
    breed,
    birthdate,
    diagnosis,
    vetName,
    emergencyContact,
  } = body as Record<string, unknown>;

  if (name !== undefined && (typeof name !== "string" || name.trim() === "")) {
    return NextResponse.json(
      { error: "name must be a non-empty string" },
      { status: 400 }
    );
  }

  // Validate birthdate if provided
  let parsedBirthdate: Date | null | undefined = undefined;
  if (birthdate !== undefined) {
    if (birthdate === null) {
      parsedBirthdate = null;
    } else if (
      typeof birthdate === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(birthdate)
    ) {
      const d = new Date(birthdate + "T00:00:00Z");
      if (isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== birthdate) {
        return NextResponse.json({ error: "invalid date" }, { status: 400 });
      }
      parsedBirthdate = d;
    } else {
      return NextResponse.json(
        { error: "birthdate must be YYYY-MM-DD or null" },
        { status: 400 }
      );
    }
  }

  try {
    const updated = await prisma.dog.update({
      where: { id: dog.id },
      data: {
        ...(name !== undefined ? { name: (name as string).trim() } : {}),
        ...(breed !== undefined
          ? { breed: breed === null ? null : String(breed).trim() || null }
          : {}),
        ...(parsedBirthdate !== undefined ? { birthdate: parsedBirthdate } : {}),
        ...(diagnosis !== undefined
          ? {
              diagnosis:
                diagnosis === null ? null : String(diagnosis).trim() || null,
            }
          : {}),
        ...(vetName !== undefined
          ? {
              vetName:
                vetName === null ? null : String(vetName).trim() || null,
            }
          : {}),
        ...(emergencyContact !== undefined
          ? {
              emergencyContact:
                emergencyContact === null
                  ? null
                  : String(emergencyContact).trim() || null,
            }
          : {}),
      },
    });
    return NextResponse.json(serializeDog(updated));
  } catch {
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
