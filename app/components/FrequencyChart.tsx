"use client";

import React from "react";
import {
  BarChart,
  type BarChartAnnotation,
  type BarChartDataPoint,
  type BarChartStack,
} from "@/app/components/BarChart";
import {
  type SeizureType,
  typeLabelPt,
  TYPE_COLOR_VAR,
  TYPE_SWATCH_CLASS,
} from "@/lib/seizure-types";
import { cn } from "@/lib/cn";

export interface FrequencyChartSeries {
  label: string;
  start: string; // ISO
  count: number;
}

export interface FrequencyChartTypeSeries {
  label: string;
  start: string; // ISO
  byType: Partial<Record<SeizureType, number>>;
  total: number;
}

export interface FrequencyChartMedChange {
  date: string; // ISO
  label: string;
  bucketIndex: number;
}

interface Props {
  /** Legacy single-value mode (e.g. the Home mini chart). */
  series?: FrequencyChartSeries[];
  /** Stacked-by-type mode (Trends). Takes precedence when provided. */
  typeSeries?: FrequencyChartTypeSeries[];
  /** Types present in range (canonical order) — drives the stacks + legend. */
  typesPresent?: SeizureType[];
  medChanges?: FrequencyChartMedChange[];
  height?: number;
}

export function FrequencyChart({
  series,
  typeSeries,
  typesPresent,
  medChanges = [],
  height = 180,
}: Props) {
  const isStacked = Array.isArray(typeSeries) && Array.isArray(typesPresent);

  // ── Stacked-by-type mode ──────────────────────────────────────────────────
  if (isStacked) {
    const present = typesPresent!;
    const stacks: BarChartStack[] = present.map((type) => ({
      key: type,
      label: typeLabelPt(type),
      color: TYPE_COLOR_VAR[type],
      swatchClass: TYPE_SWATCH_CLASS[type],
    }));

    // Each row carries the per-type count under its key (absent types → 0).
    const data: BarChartDataPoint[] = typeSeries!.map((s) => {
      const row: BarChartDataPoint = { label: s.label };
      for (const type of present) {
        row[type] = s.byType[type] ?? 0;
      }
      return row;
    });

    const annotations: BarChartAnnotation[] = medChanges
      .filter((m) => m.bucketIndex >= 0 && m.bucketIndex < typeSeries!.length)
      .map((m) => ({ index: m.bucketIndex, label: m.label || "Dose ajustada" }));

    return (
      <div>
        <BarChart
          data={data}
          stacks={stacks}
          height={height}
          annotations={annotations}
          ariaLabel="Frequência de crises por tipo ao longo do tempo"
        />
        {stacks.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 list-none p-0 m-0">
            {stacks.map((s) => (
              <li key={s.key} className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "h-2.5 w-2.5 shrink-0 rounded-[3px]",
                    s.swatchClass
                  )}
                  aria-hidden="true"
                />
                <span className="text-2xs text-fg-muted font-body">{s.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // ── Legacy single-value mode ──────────────────────────────────────────────
  const rows = series ?? [];
  const lastIdx = rows.length - 1;

  const data = rows.map((s, i) => ({
    label: s.label,
    value: s.count,
    highlight: i === lastIdx,
  }));

  const annotations: BarChartAnnotation[] = medChanges
    .filter((m) => m.bucketIndex >= 0 && m.bucketIndex < rows.length)
    .map((m) => ({ index: m.bucketIndex, label: m.label || "Dose ajustada" }));

  return (
    <BarChart
      data={data}
      height={height}
      annotations={annotations}
      ariaLabel="Frequência de crises ao longo do tempo"
    />
  );
}
