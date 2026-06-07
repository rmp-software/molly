import { notFound } from "next/navigation";
import { getActiveDogId } from "@/lib/scope";
import { prisma } from "@/lib/db";
import { SeizureDetailClient } from "./SeizureDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SeizureDetailPage({ params }: Props) {
  const { id } = await params;
  const dogId = await getActiveDogId();

  const episode = await prisma.seizureEpisode.findFirst({
    where: { id, dogId },
  });

  if (!episode) {
    notFound();
  }

  // Serialize for client
  const data = {
    id: episode.id,
    occurredAt: episode.occurredAt.toISOString(),
    type: episode.type as "tonic_clonic" | "focal" | "absence" | "other",
    durationSeconds: episode.durationSeconds,
    severity: episode.severity as "mild" | "moderate" | "severe" | null,
    isCluster: episode.isCluster,
    rescueGiven: episode.rescueGiven,
    notes: episode.notes,
  };

  const typeLabel: Record<string, string> = {
    tonic_clonic: "Tônico-clônica",
    focal: "Focal",
    absence: "Ausência",
    other: "Outra",
  };

  return (
    <div>
      <div
        style={{
          padding: "0 20px 16px",
          fontFamily: "var(--font-display)",
        }}
      >
        <h2
          style={{
            margin: "0 0 4px",
            fontSize: "var(--text-xl)",
            fontWeight: 700,
            color: "var(--fg)",
          }}
        >
          {typeLabel[episode.type] ?? episode.type}
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-sm)",
            color: "var(--fg-muted)",
            fontFamily: "var(--font-body)",
          }}
        >
          Detalhes do episódio
        </p>
      </div>
      <SeizureDetailClient episode={data} />
    </div>
  );
}
