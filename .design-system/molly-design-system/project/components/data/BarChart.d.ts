import * as React from 'react';

export interface BarDatum {
  /** x-axis label, e.g. a month or week. */
  label: string;
  /** Count of seizures in that period. */
  value: number;
  /** Render in the strong brand color (e.g. the current period). */
  highlight?: boolean;
}

export interface ChartAnnotation {
  /** Bar index the dashed marker sits before. */
  index: number;
  /** Short label, e.g. "Dose ajustada". */
  label: string;
}

/**
 * Bar chart for seizure frequency over time. Calm gold bars, one highlighted
 * "current" bar, optional dashed annotation markers for medication changes.
 * Responsive SVG, tabular value labels, no chart library.
 *
 * @startingPoint section="Data" subtitle="Seizure-frequency bar chart" viewport="360x200"
 */
export interface BarChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: BarDatum[];
  /** Pixel height of the plot. @default 160 */
  height?: number;
  /** Draw the value above each bar. @default true */
  showValues?: boolean;
  /** Number of horizontal guide lines. @default 2 */
  gridLines?: number;
  /** Dashed vertical markers for events like dose changes. */
  annotations?: ChartAnnotation[];
  ariaLabel?: string;
}

export function BarChart(props: BarChartProps): JSX.Element;
