import * as React from 'react';

/**
 * Medication stock card — the building block of the meds list. Med name, dose,
 * "days remaining" in tabular mono, a calm stock track, and a color+icon+label
 * status. Status auto-derives from `daysRemaining` (>14 ok, 5–14 reorder,
 * ≤4 urgent) unless you pass `status`.
 *
 * @startingPoint section="Patterns" subtitle="Medication stock status card" viewport="360x180"
 */
export interface MedStatusCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  /** e.g. "97,5 mg · 2× ao dia" (comma decimals, pt-BR). */
  dose?: string;
  daysRemaining?: number;
  /** Full-stock reference for the progress track. @default 30 */
  capacityDays?: number;
  /** Override the derived status. */
  status?: 'ok' | 'reorder' | 'urgent';
  /** Lucide icon shown in the status pill. */
  icon?: React.ReactNode;
  /** Lucide icon for the leading med chip. */
  chipIcon?: React.ReactNode;
  /** Lucide icon for the reorder button. */
  reorderIcon?: React.ReactNode;
  /** Override the pill label (else derives a pt-BR label). */
  pillLabel?: string;
  /** Show a "Pedir mais" action when provided. */
  onReorder?: (() => void) | null;
}

export function MedStatusCard(props: MedStatusCardProps): JSX.Element;
