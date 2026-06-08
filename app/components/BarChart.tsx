"use client";

import React from "react";
import {
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
  Cell,
  LabelList,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/app/components/ui/chart";
import { cn } from "@/lib/cn";

export interface BarChartDataPoint {
  label: string;
  value: number;
  highlight?: boolean;
}

export interface BarChartAnnotation {
  index: number;
  label: string;
}

export interface BarChartProps {
  data?: BarChartDataPoint[];
  height?: number;
  showValues?: boolean;
  gridLines?: number;
  annotations?: BarChartAnnotation[];
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

const config: ChartConfig = {
  value: { label: "Crises", color: "var(--chart-bar)" },
};

export function BarChart({
  data = [],
  height = 160,
  showValues = true,
  annotations = [],
  ariaLabel = "Frequência de crises ao longo do tempo",
  className,
  style,
}: BarChartProps) {
  return (
    <ChartContainer
      config={config}
      className={cn("aspect-auto w-full", className)}
      style={{ height, ...style }}
      aria-label={ariaLabel}
    >
      <RBarChart data={data} margin={{ top: 18, right: 6, bottom: 4, left: 6 }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fill: "var(--fg-muted)", fontSize: 11 }}
        />
        <YAxis hide domain={[0, "dataMax"]} />
        {annotations.map((a, i) => (
          <ReferenceLine
            key={`ann-${i}-${a.index}`}
            x={data[a.index]?.label}
            stroke="var(--info)"
            strokeDasharray="3 3"
            strokeWidth={1.5}
            label={{ value: a.label, fill: "var(--info)", fontSize: 10, position: "insideTopLeft" }}
          />
        ))}
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="value" radius={[5, 5, 0, 0]}>
          {showValues && (
            <LabelList
              dataKey="value"
              position="top"
              offset={6}
              fontSize={11}
              fontWeight={600}
              fill="var(--fg-2)"
              formatter={(v: unknown) => (typeof v === "number" && v > 0 ? String(v) : "")}
            />
          )}
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={d.highlight ? "var(--chart-bar-strong)" : "var(--chart-bar)"}
            />
          ))}
        </Bar>
      </RBarChart>
    </ChartContainer>
  );
}
