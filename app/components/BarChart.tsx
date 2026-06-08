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
  Rectangle,
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
  value?: number;
  highlight?: boolean;
  // In stacked mode each row also carries numeric values under each stack key.
  [key: string]: string | number | boolean | undefined;
}

export interface BarChartAnnotation {
  index: number;
  label: string;
}

export interface BarChartStack {
  key: string;
  label: string;
  /** SVG `fill` value (e.g. `var(--chart-type-*)`) for the Recharts <Bar>. */
  color: string;
  /**
   * STATIC literal Tailwind class for the HTML swatch (tooltip + legend), e.g.
   * `"bg-[var(--chart-type-tonic-clonic)]"`. Must be a literal string present
   * in source so Turbopack's JIT scans it — never build it dynamically.
   */
  swatchClass: string;
}

export interface BarChartProps {
  data?: BarChartDataPoint[];
  height?: number;
  showValues?: boolean;
  annotations?: BarChartAnnotation[];
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
  /**
   * Optional stacked mode. When provided, renders one stacked <Bar> per entry
   * (in array order) keyed by `key`, filled with `color`, instead of the single
   * `value` Bar. Each data row must carry a numeric value under each `key`.
   */
  stacks?: BarChartStack[];
}

const baseConfig: ChartConfig = {
  value: { label: "Crises", color: "var(--chart-bar)" },
};

interface StackedTooltipPayloadItem {
  name?: string | number;
  value?: number;
  color?: string;
  dataKey?: string;
}

function StackedTooltip({
  active,
  payload,
  label,
  stacks,
}: {
  active?: boolean;
  payload?: StackedTooltipPayloadItem[];
  label?: string;
  stacks: BarChartStack[];
}) {
  if (!active || !payload?.length) return null;

  const present = stacks
    .map((s) => {
      const item = payload.find((p) => p.dataKey === s.key);
      const value = typeof item?.value === "number" ? item.value : 0;
      return { ...s, value };
    })
    .filter((s) => s.value > 0);

  if (!present.length) return null;

  const total = present.reduce((acc, s) => acc + s.value, 0);

  return (
    <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      {label != null && <div className="font-medium">{label}</div>}
      <div className="grid gap-1.5">
        {present.map((s) => (
          <div
            key={s.key}
            className="flex w-full items-center gap-2"
          >
            <div
              className={cn(
                "h-2.5 w-2.5 shrink-0 rounded-[2px]",
                s.swatchClass,
              )}
            />
            <div className="flex flex-1 items-center justify-between leading-none">
              <span className="text-muted-foreground">{s.label}</span>
              <span className="font-mono font-medium text-foreground tabular-nums">
                {s.value.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
        <div className="mt-0.5 flex items-center justify-between border-t border-border/50 pt-1 leading-none">
          <span className="font-medium text-foreground">Total</span>
          <span className="font-mono font-medium text-foreground tabular-nums">
            {total.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// Stacked bars: only the topmost NON-ZERO segment of each column should carry
// the rounded top. We can't rely on array position (the last stack may be 0 for
// a given column), so we compute the topmost present key per data row and apply
// the radius via a custom shape that rounds only that segment.
type StackedBarShapeProps = {
  payload?: Record<string, unknown>;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
};

function makeStackedBarShape(stackKey: string, stackKeys: string[]) {
  // Recharts passes a superset of these props; we read only what we need.
  return function StackedBarShape(props: StackedBarShapeProps) {
    const payload = props.payload;
    const topKey = payload
      ? [...stackKeys]
          .reverse()
          .find((k) => typeof payload[k] === "number" && (payload[k] as number) > 0)
      : undefined;
    const isTop = topKey === stackKey;
    return (
      <Rectangle
        {...props}
        radius={isTop ? [5, 5, 0, 0] : [0, 0, 0, 0]}
      />
    );
  };
}

export function BarChart({
  data = [],
  height = 160,
  showValues = true,
  annotations = [],
  ariaLabel = "Frequência de crises ao longo do tempo",
  className,
  style,
  stacks,
}: BarChartProps) {
  const isStacked = Array.isArray(stacks) && stacks.length > 0;
  const stackKeys = isStacked ? stacks!.map((s) => s.key) : [];

  const config: ChartConfig = isStacked
    ? Object.fromEntries(
        stacks!.map((s) => [s.key, { label: s.label, color: s.color }]),
      )
    : baseConfig;

  // Annotations sharing a bucket would overprint into an illegible smear, and
  // long labels collide/clip at phone width. Merge per-bucket (showing the first
  // label + `+N` when several land together) and truncate to a compact width so
  // each reference line carries one short, readable tag.
  const mergedAnnotations = (() => {
    const byIndex = new Map<number, string[]>();
    for (const a of annotations) {
      const list = byIndex.get(a.index);
      if (list) list.push(a.label);
      else byIndex.set(a.index, [a.label]);
    }
    const truncate = (s: string, n = 14) =>
      s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
    return [...byIndex.entries()].map(([index, labels]) => {
      const extra = labels.length - 1;
      const label =
        truncate(labels[0]) + (extra > 0 ? ` +${extra}` : "");
      return { index, label };
    });
  })();

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
        {mergedAnnotations.map((a) => {
          // Anchor labels in the right third to the inside-right edge so they
          // grow leftward and never clip off the chart at phone width.
          const denom = data.length > 1 ? data.length - 1 : 1;
          const isRightEdge = data.length > 0 && a.index / denom > 0.5;
          return (
            <ReferenceLine
              key={`ann-${a.index}`}
              x={data[a.index]?.label}
              stroke="var(--info)"
              strokeDasharray="3 3"
              strokeWidth={1.5}
              label={{
                value: a.label,
                fill: "var(--info)",
                fontSize: 10,
                position: isRightEdge ? "insideTopRight" : "insideTopLeft",
              }}
            />
          );
        })}
        {isStacked ? (
          <>
            <ChartTooltip
              cursor={false}
              content={<StackedTooltip stacks={stacks!} />}
            />
            {stacks!.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                stackId="t"
                fill={s.color}
                isAnimationActive={false}
                shape={makeStackedBarShape(s.key, stackKeys)}
              />
            ))}
          </>
        ) : (
          <>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey="value" radius={[5, 5, 0, 0]} isAnimationActive={false}>
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
          </>
        )}
      </RBarChart>
    </ChartContainer>
  );
}
