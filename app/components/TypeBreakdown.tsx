"use client";

import React from "react";
import {
  type SeizureType,
  typeLabelPt,
  TYPE_SWATCH_CLASS,
} from "@/lib/seizure-types";
import { cn } from "@/lib/cn";

interface Props {
  /** Per-type counts for the current range (from `breakdown.byType`). */
  byType: Record<string, number>;
  /** Types present in range (canonical order). Used to scope + validate. */
  typesPresent: SeizureType[];
}

export function TypeBreakdown({ byType, typesPresent }: Props) {
  // Build rows for present types with a positive count, sorted desc by count.
  const rows = typesPresent
    .map((type) => ({ type, count: byType[type] ?? 0 }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);

  if (rows.length === 0) {
    return (
      <div className="text-sm text-fg-muted font-body" aria-hidden="true">
        —
      </div>
    );
  }

  const maxCount = rows[0].count;

  return (
    <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
      {rows.map(({ type, count }) => (
        <li key={type} className="flex items-center gap-2.5">
          <span className="text-[13px] text-fg-2 font-body w-[88px] shrink-0 truncate">
            {typeLabelPt(type)}
          </span>
          <span
            className="flex-1 h-2.5 rounded-pill bg-bg-2 overflow-hidden"
            role="presentation"
          >
            <span
              className={cn("block h-full rounded-pill", TYPE_SWATCH_CLASS[type])}
              style={{ width: `${(count / maxCount) * 100}%` }}
            />
          </span>
          <span className="font-mono font-semibold text-[13px] text-fg tabular-nums w-6 text-right shrink-0">
            {count}
          </span>
        </li>
      ))}
    </ul>
  );
}
