// Shared seizure constants — imported by API routes and client components.
// This is a plain module (no "use client" / no React); safe for both contexts.

export const VALID_TYPES = ["tonic_clonic", "focal", "absence", "other"] as const;
export const VALID_SEVERITIES = ["mild", "moderate", "severe"] as const;

// Episode-history anchor (NOT a birthdate): the floor for the "Tudo" (All) range
// when no episodes exist yet — there is no earlier data to chart before this.
// Date string in America/Sao_Paulo terms; consumers build the Date (e.g.
// `new Date(`${EPISODE_HISTORY_START}T00:00:00-03:00`)` or local-time semantics
// consistent with the rest of the codebase).
export const EPISODE_HISTORY_START = "2024-01-01";

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

// ─── Per-type chart colors (single source of truth) ───────────────────────────
// Both maps are keyed by SeizureType and MUST stay in lockstep so the chart
// (`fill`) and the HTML swatches (legend/breakdown/tooltip) match exactly.
//
// `TYPE_SWATCH_CLASS` values are STATIC literal Tailwind classes — they must
// remain literal strings present in source so Turbopack's JIT scans and
// generates them. Never build these dynamically.
export const TYPE_SWATCH_CLASS: Record<SeizureType, string> = {
  tonic_clonic: "bg-[var(--chart-type-tonic-clonic)]",
  focal: "bg-[var(--chart-type-focal)]",
  absence: "bg-[var(--chart-type-absence)]",
  other: "bg-[var(--chart-type-other)]",
};

// Matching `var(--…)` strings feed the Recharts SVG `fill`.
export const TYPE_COLOR_VAR: Record<SeizureType, string> = {
  tonic_clonic: "var(--chart-type-tonic-clonic)",
  focal: "var(--chart-type-focal)",
  absence: "var(--chart-type-absence)",
  other: "var(--chart-type-other)",
};

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
