// Shared seizure constants — imported by API routes and client components.
// This is a plain module (no "use client" / no React); safe for both contexts.

export const VALID_TYPES = ["tonic_clonic", "focal", "absence", "other"] as const;
export const VALID_SEVERITIES = ["mild", "moderate", "severe"] as const;

export type SeizureType = (typeof VALID_TYPES)[number];
export type Severity = (typeof VALID_SEVERITIES)[number];

export const TYPE_OPTIONS: { id: SeizureType; label: string }[] = [
  { id: "tonic_clonic", label: "Tônico-clônica" },
  { id: "focal", label: "Focal" },
  { id: "absence", label: "Ausência" },
  { id: "other", label: "Outra" },
];

export const SEVERITY_OPTIONS: { id: Severity; label: string }[] = [
  { id: "mild", label: "Leve" },
  { id: "moderate", label: "Moderada" },
  { id: "severe", label: "Grave" },
];

export function typeLabelPt(type: SeizureType): string {
  return TYPE_OPTIONS.find((t) => t.id === type)?.label ?? type;
}

export function serializeEpisode(e: {
  id: string;
  occurredAt: Date;
  type: SeizureType;
  durationSeconds: number | null;
  severity: Severity | null;
  isCluster: boolean;
  rescueGiven: boolean;
  notes: string | null;
}) {
  return {
    id: e.id,
    occurredAt: e.occurredAt.toISOString(),
    type: e.type,
    durationSeconds: e.durationSeconds,
    severity: e.severity,
    isCluster: e.isCluster,
    rescueGiven: e.rescueGiven,
    notes: e.notes,
  };
}
