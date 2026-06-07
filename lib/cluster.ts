/**
 * Cluster recompute helper.
 *
 * After any write (create, update, delete) we recompute isCluster for every
 * episode belonging to the dog so that bilateral cluster relationships stay
 * consistent regardless of insertion / edit / deletion order.
 */

import { prisma } from "@/lib/db";
import { markCluster } from "@/lib/stats";

/**
 * Reload all episodes for `dogId`, recompute each episode's isCluster flag,
 * and persist only the rows whose value changed.
 *
 * Returns a map of { [episodeId]: isCluster } so callers can read back the
 * freshly-computed value for the episode they just wrote.
 */
export async function recomputeClusters(
  dogId: string
): Promise<Map<string, boolean>> {
  const episodes = await prisma.seizureEpisode.findMany({
    where: { dogId },
    select: { id: true, occurredAt: true, isCluster: true },
  });

  // For each episode, compute the correct isCluster value.
  const computed = new Map<string, boolean>();
  for (const ep of episodes) {
    const others = episodes
      .filter((o) => o.id !== ep.id)
      .map((o) => o.occurredAt);
    computed.set(ep.id, markCluster(ep.occurredAt, others));
  }

  // Collect ids whose stored value differs from the freshly-computed value.
  const setTrue: string[] = [];
  const setFalse: string[] = [];
  for (const ep of episodes) {
    const want = computed.get(ep.id)!;
    if (want !== ep.isCluster) {
      (want ? setTrue : setFalse).push(ep.id);
    }
  }

  // Write back only what changed (two bulk updates at most).
  if (setTrue.length > 0) {
    await prisma.seizureEpisode.updateMany({
      where: { id: { in: setTrue } },
      data: { isCluster: true },
    });
  }
  if (setFalse.length > 0) {
    await prisma.seizureEpisode.updateMany({
      where: { id: { in: setFalse } },
      data: { isCluster: false },
    });
  }

  return computed;
}
