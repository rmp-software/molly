import * as React from 'react';

/**
 * Status pill for medication stock and other states. Carries meaning with
 * color + icon/dot + label together (WCAG AA, color-blind safe) — never hue
 * alone. Tones: ok (green), reorder-soon (amber), urgent (red), info, neutral.
 *
 * @startingPoint section="Core" subtitle="OK / reorder / urgent status pill" viewport="320x60"
 */
export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Semantic state. @default "ok" */
  status?: 'ok' | 'reorder' | 'urgent' | 'info' | 'neutral';
  /** @default "md" */
  size?: 'md' | 'sm';
  /** Solid high-emphasis fill (currently for `urgent`). */
  solid?: boolean;
  /** Lucide icon; when set it replaces the default status dot. */
  icon?: React.ReactNode;
  /** The pt-BR label, e.g. "Reabastecer em breve". */
  children?: React.ReactNode;
}

export function StatusPill(props: StatusPillProps): JSX.Element;
