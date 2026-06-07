import * as React from 'react';

/**
 * The home hero: a calm "time since the last seizure" counter. Big tabular
 * mono numerals (days / hours / minutes) with soft units and a reassuring
 * caption. Ticks live every minute.
 *
 * @startingPoint section="Data" subtitle="Time-since-last-seizure counter" viewport="360x160"
 */
export interface CounterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Timestamp of the last seizure. */
  since: Date | string;
  /** Small label above the number. @default "Desde a última crise" */
  eyebrow?: string;
  /** Optional leading icon for the eyebrow. */
  icon?: React.ReactNode;
  /** Reassuring caption below. */
  sub?: React.ReactNode;
  /** @default "md" */
  size?: 'md' | 'sm';
  /** Tick every minute. @default true */
  live?: boolean;
}

export function Counter(props: CounterProps): JSX.Element;
