import { prisma } from "@/lib/db";

/** v1: the sole Dog. Later: the dog selected in the session. */
export async function getActiveDogId(): Promise<string> {
  const dog = await prisma.dog.findFirstOrThrow({ orderBy: { createdAt: "asc" } });
  return dog.id;
}

export async function getActiveDog() {
  return prisma.dog.findFirstOrThrow({ orderBy: { createdAt: "asc" } });
}
