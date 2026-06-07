"use client";

import React from "react";
import type { EnrichedMed } from "@/app/api/medications/enrich";

interface Props {
  meds: EnrichedMed[];
}

interface StatChipProps {
  count: number;
  label: string;
  style: React.CSSProperties;
}

function StatChip({ count, label, style }: StatChipProps) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2px",
        padding: "10px 8px",
        borderRadius: "var(--radius-md)",
        ...style,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontWeight: 700,
          fontSize: "22px",
          lineHeight: 1,
        }}
      >
        {count}
      </span>
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "11px",
          fontWeight: 600,
          textAlign: "center",
          lineHeight: 1.3,
        }}
      >
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
    <div
      style={{
        display: "flex",
        gap: "8px",
        margin: "0 18px 14px",
      }}
    >
      <StatChip
        count={ok}
        label="em dia"
        style={{
          background: "var(--success-soft)",
          color: "var(--success)",
        }}
      />
      <StatChip
        count={reorder}
        label="reabastecer"
        style={{
          background: "var(--warning-soft)",
          color: "var(--warning)",
        }}
      />
      <StatChip
        count={urgent}
        label="acabando"
        style={{
          background: "var(--danger-soft)",
          color: "var(--danger)",
        }}
      />
    </div>
  );
}
