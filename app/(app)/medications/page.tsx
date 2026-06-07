import { requireSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveDogId } from "@/lib/scope";
import { prisma } from "@/lib/db";
import { enrichMed } from "@/app/api/medications/enrich";
import { MedicationsClient } from "./MedicationsClient";

export default async function MedicationsPage() {
  try {
    await requireSession();
  } catch {
    redirect("/login");
  }

  const dogId = await getActiveDogId();
  const now = new Date();

  const [meds, weightEntry] = await Promise.all([
    prisma.medication.findMany({
      where: { dogId, isActive: true },
      include: {
        schedules: { orderBy: { effectiveFrom: "asc" } },
        stockTransactions: { orderBy: { occurredAt: "asc" } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.weightEntry.findFirst({
      where: { dogId },
      orderBy: { measuredOn: "desc" },
      select: { weightKg: true },
    }),
  ]);

  const latestWeightKg = weightEntry ? weightEntry.weightKg.toNumber() : null;
  const enrichedMeds = meds.map((med) => enrichMed(med, now, latestWeightKg));

  return <MedicationsClient initialMeds={enrichedMeds} />;
}
