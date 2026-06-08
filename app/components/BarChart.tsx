"use client";

import React from "react";
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

export function BarChart({
  data = [],
  height = 160,
  showValues = true,
  gridLines = 2,
  annotations = [],
  ariaLabel = "Frequência de crises ao longo do tempo",
  className = "",
  style,
}: BarChartProps) {
  const W = 320;
  const H = height;
  const padT = 16,
    padB = 26,
    padL = 4,
    padR = 4;
  const plotH = H - padT - padB;
  const plotW = W - padL - padR;
  const n = Math.max(data.length, 1);
  const max = Math.max(1, ...data.map((d) => d.value));
  const slot = plotW / n;
  const barW = Math.min(slot * 0.56, 34);

  const y = (v: number) => padT + plotH - (v / max) * plotH;
  const cx = (i: number) => padL + slot * i + slot / 2;

  const grid = Array.from({ length: gridLines }, (_, g) => {
    const gv = Math.round((max / gridLines) * (g + 1));
    return { gy: y(gv), gv };
  });

  return (
    <div className={cn("font-body w-full", className)} style={style}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={ariaLabel}
        className="block w-full h-auto overflow-visible"
      >
        {grid.map((g, i) => (
          <g key={i}>
            <line
              x1={padL}
              x2={W - padR}
              y1={g.gy}
              y2={g.gy}
              stroke="var(--chart-grid)"
              strokeWidth={1}
            />
            <text
              x={W - padR}
              y={g.gy - 3}
              textAnchor="end"
              fontSize={10}
              fill="var(--fg-muted)"
              fontFamily="var(--font-mono)"
            >
              {g.gv}
            </text>
          </g>
        ))}
        {annotations.map((a, i) => {
          const ax = padL + slot * a.index;
          return (
            <g key={`ann-${i}`}>
              <line
                x1={ax}
                x2={ax}
                y1={padT - 8}
                y2={padT + plotH}
                stroke="var(--info)"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                opacity={0.7}
              />
              <text
                x={ax + 4}
                y={padT - 2}
                fontSize={10}
                fill="var(--info)"
                fontWeight={600}
              >
                {a.label}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const bx = cx(i) - barW / 2;
          const by = y(d.value);
          const bh = padT + plotH - by;
          return (
            <g key={i}>
              <rect
                x={bx}
                y={by}
                width={barW}
                height={Math.max(bh, d.value > 0 ? 3 : 0)}
                rx={5}
                fill={d.highlight ? "var(--chart-bar-strong)" : "var(--chart-bar)"}
                style={{
                  transition: `height var(--dur-slow) var(--ease-out), y var(--dur-slow) var(--ease-out)`,
                }}
              />
              {showValues && d.value > 0 && (
                <text
                  x={cx(i)}
                  y={by - 6}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill="var(--fg-2)"
                  fontFamily="var(--font-mono)"
                  style={{ fontFeatureSettings: '"tnum" 1' }}
                >
                  {d.value}
                </text>
              )}
              <text
                x={cx(i)}
                y={H - 8}
                textAnchor="middle"
                fontSize={11}
                fill="var(--fg-muted)"
                fontFamily="var(--font-body)"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
