"use client";

import React from "react";
import { cn } from "@/lib/cn";
import type { EnrichedMed } from "@/app/api/medications/enrich";

interface Props {
  meds: EnrichedMed[];
}

interface StatChipProps {
  count: number;
  label: string;
  tone: string;
}

function StatChip({ count, label, tone }: StatChipProps) {
  return (
    <div
      className={cn(
        "flex-1 flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-md",
        tone
      )}
    >
      <span className="font-mono font-bold text-xl leading-none">{count}</span>
      <span className="font-body text-2xs font-semibold text-center leading-[1.3]">
        {label}
      </span>
    </div>
  );
}

export function MedOverviewStrip({ meds }: Props) {
  const ok = meds.filter((m) => m.status === "ok").length;
  const reorder = meds.filter((m) => m.status === "reorder").length;
  const urgent = meds.filter((m) => m.status === "urgent").length;

  return (
    <div className="flex gap-2 mx-[18px] mb-3.5">
      <StatChip count={ok} label="em dia" tone="bg-success-soft text-success" />
      <StatChip
        count={reorder}
        label="reabastecer"
        tone="bg-warning-soft text-warning"
      />
      <StatChip
        count={urgent}
        label="acabando"
        tone="bg-danger-soft text-danger"
      />
    </div>
  );
}
