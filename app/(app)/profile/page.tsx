import React from "react";
import { getActiveDog } from "@/lib/scope";
import { prisma } from "@/lib/db";
import { ProfileClient } from "./ProfileClient";

export default async function ProfilePage() {
  const dog = await getActiveDog();

  // Serialize dog for client (no raw Prisma objects or Decimals)
  const dogData = {
    id: dog.id,
    name: dog.name,
    breed: dog.breed ?? null,
    birthdate: dog.birthdate
      ? dog.birthdate.toISOString().slice(0, 10)
      : null,
    diagnosis: dog.diagnosis ?? null,
    vetName: dog.vetName ?? null,
    emergencyContact: dog.emergencyContact ?? null,
  };

  // Fetch weight entries for initial render
  const weightEntries = await prisma.weightEntry.findMany({
    where: { dogId: dog.id },
    orderBy: { measuredOn: "desc" },
  });

  const serializedWeights = weightEntries.map((e) => ({
    id: e.id,
    measuredOn: e.measuredOn.toISOString().slice(0, 10),
    weightKg: e.weightKg.toNumber(),
  }));

  return (
    <ProfileClient dog={dogData} initialWeights={serializedWeights} />
  );
}
