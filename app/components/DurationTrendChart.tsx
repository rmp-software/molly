"use client";

import React from "react";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/app/components/ui/chart";
import { TYPE_COLOR_VAR } from "@/lib/seizure-types";
import { fmtDuration } from "@/lib/format";
import { cn } from "@/lib/cn";

export interface DurationTrendPoint {
  label: string;
  start: string; // ISO
  avgSeconds: number | null;
  n: number;
}

interface Props {
  data: DurationTrendPoint[];
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** Seconds at/above which a tonic-clonic seizure is treated as an emergency. */
const EMERGENCY_SECONDS = 60;

const config: ChartConfig = {
  avgSeconds: {
    label: "Duração média",
    color: "var(--chart-type-tonic-clonic)",
  },
};

// Custom dot: emergency (≥60s) points painted danger; below-threshold points
// painted the tonic-clonic brand color. Null buckets get NO dot (connectNulls is
// off, so they render as gaps in the line).
type DotProps = {
  cx?: number;
  cy?: number;
  payload?: DurationTrendPoint;
};

function DurationDot({ cx, cy, payload }: DotProps) {
  if (
    cx == null ||
    cy == null ||
    !payload ||
    payload.avgSeconds == null
  ) {
    // Returning an empty group keeps Recharts' SVGProps typing happy while
    // drawing nothing for empty buckets.
    return <g />;
  }
  const isEmergency = payload.avgSeconds >= EMERGENCY_SECONDS;
  const fill = isEmergency
    ? "var(--danger)"
    : TYPE_COLOR_VAR.tonic_clonic;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={isEmergency ? 4.5 : 3.5}
      fill={fill}
      stroke="var(--surface)"
      strokeWidth={1.5}
    />
  );
}

interface DurationTooltipPayloadItem {
  payload?: DurationTrendPoint;
}

function DurationTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: DurationTooltipPayloadItem[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point || point.avgSeconds == null) return null;
  const isEmergency = point.avgSeconds >= EMERGENCY_SECONDS;
  return (
    <div className="grid min-w-[8rem] items-start gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">{point.label}</div>
      <div className="flex items-center justify-between gap-3 leading-none">
        <span className="text-fg-muted">Duração média</span>
        <span
          className={cn(
            "font-mono font-medium tabular-nums",
            isEmergency ? "text-danger" : "text-fg"
          )}
        >
          {fmtDuration(Math.round(point.avgSeconds))}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 leading-none">
        <span className="text-fg-muted">Crises</span>
        <span className="font-mono font-medium text-fg tabular-nums">
          {point.n}
        </span>
      </div>
    </div>
  );
}

export function DurationTrendChart({
  data,
  height = 180,
  className,
  style,
}: Props) {
  // Y domain: comfortably above both the 60s reference line and the tallest
  // point so neither the line nor its label clips at the top.
  const maxVal = data.reduce(
    (m, d) => (d.avgSeconds != null && d.avgSeconds > m ? d.avgSeconds : m),
    0
  );
  const yMax = Math.max(maxVal, EMERGENCY_SECONDS) * 1.2 + 10;

  return (
    <ChartContainer
      config={config}
      className={cn("aspect-auto w-full", className)}
      style={{ height, ...style }}
      aria-label="Duração média das crises tônico-clônicas ao longo do tempo"
    >
      <LineChart data={data} margin={{ top: 16, right: 12, bottom: 4, left: 6 }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fill: "var(--fg-muted)", fontSize: 11 }}
        />
        <YAxis
          width={48}
          domain={[0, yMax]}
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          tick={{ fill: "var(--fg-muted)", fontSize: 10 }}
          tickFormatter={(v: number) => (v > 0 ? fmtDuration(v) : "0s")}
        />
        <ReferenceLine
          y={EMERGENCY_SECONDS}
          stroke="var(--danger)"
          strokeDasharray="4 3"
          strokeWidth={1.5}
          label={{
            value: "1 min — emergência",
            fill: "var(--danger)",
            fontSize: 10,
            position: "insideTopLeft",
          }}
        />
        <ChartTooltip cursor={false} content={<DurationTooltip />} />
        <Line
          type="monotone"
          dataKey="avgSeconds"
          stroke={TYPE_COLOR_VAR.tonic_clonic}
          strokeWidth={2}
          connectNulls={false}
          isAnimationActive={false}
          dot={<DurationDot />}
          activeDot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
