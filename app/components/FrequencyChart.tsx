"use client";

import React from "react";
import { BarChart, type BarChartAnnotation } from "@/app/components/BarChart";

export interface FrequencyChartSeries {
  label: string;
  start: string; // ISO
  count: number;
}

export interface FrequencyChartMedChange {
  date: string; // ISO
  label: string;
  bucketIndex: number;
}

interface Props {
  series: FrequencyChartSeries[];
  medChanges?: FrequencyChartMedChange[];
  height?: number;
}

export function FrequencyChart({ series, medChanges = [], height = 180 }: Props) {
  const lastIdx = series.length - 1;

  const data = series.map((s, i) => ({
    label: s.label,
    value: s.count,
    highlight: i === lastIdx,
  }));

  // Build annotations from med changes that have a valid bucket index
  const annotations: BarChartAnnotation[] = medChanges
    .filter((m) => m.bucketIndex >= 0 && m.bucketIndex < series.length)
    .map((m) => ({
      index: m.bucketIndex,
      label: "Dose ajustada",
    }));

  return (
    <BarChart
      data={data}
      height={height}
      gridLines={3}
      annotations={annotations}
      ariaLabel="Frequência de crises ao longo do tempo"
    />
  );
}
