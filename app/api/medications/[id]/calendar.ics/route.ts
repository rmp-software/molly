import { requireSession } from "@/lib/auth";
import { getActiveDogId } from "@/lib/scope";
import { prisma } from "@/lib/db";
import { activeScheduleOn } from "@/lib/schedule";
import { dbDateToLocalMidnight, dbDateToLocalMidnightNullable } from "@/lib/dates";
import { buildDoseIcs } from "@/lib/ics";

/** Slug a med name for use as a filename: lowercase, replace non-alphanum with hyphens. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth
  try {
    await requireSession();
  } catch {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = await params;
  const dogId = await getActiveDogId();

  // Fetch med scoped to active dog
  const med = await prisma.medication.findFirst({
    where: { id, dogId, isActive: true },
    include: {
      schedules: { orderBy: { effectiveFrom: "asc" } },
    },
  });

  if (!med) {
    return new Response(JSON.stringify({ error: "not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Build schedule shapes for the engine
  const scheduleShapes = med.schedules.map((s) => ({
    doseTimes: s.doseTimes,
    unitsPerDose: s.unitsPerDose.toNumber(),
    effectiveFrom: dbDateToLocalMidnight(s.effectiveFrom),
    effectiveTo: dbDateToLocalMidnightNullable(s.effectiveTo),
  }));

  const now = new Date();
  const active = activeScheduleOn(scheduleShapes, now);

  if (!active) {
    return new Response(
      JSON.stringify({ error: "Nenhum agendamento ativo encontrado para este medicamento." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const ics = buildDoseIcs({
    medName: med.name,
    doseTimes: active.doseTimes,
    from: active.effectiveFrom,
    uidSeed: med.id,
  });

  const slug = slugify(med.name);

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="molly-${slug}.ics"`,
    },
  });
}
