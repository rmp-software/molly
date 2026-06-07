"use client";

import React from "react";

export type MedStatus = "ok" | "reorder" | "urgent";

export interface MedStatusCardProps {
  name: string;
  dose?: string;
  daysRemaining?: number;
  capacityDays?: number;
  status?: MedStatus;
  icon?: React.ReactNode;
  chipIcon?: React.ReactNode;
  pillLabel?: string;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

function deriveStatus(days: number): MedStatus {
  if (days <= 4) return "urgent";
  if (days <= 14) return "reorder";
  return "ok";
}

const PILL_LABELS: Record<MedStatus, string> = {
  ok: "Estoque OK",
  reorder: "Reabastecer em breve",
  urgent: "Acabando",
};

const chipToneStyle: Record<MedStatus, React.CSSProperties> = {
  ok: { background: "var(--success-soft)", color: "var(--success)" },
  reorder: { background: "var(--warning-soft)", color: "var(--warning)" },
  urgent: { background: "var(--danger-soft)", color: "var(--danger)" },
};

const daysNumColor: Record<MedStatus, string> = {
  ok: "var(--success)",
  reorder: "var(--warning)",
  urgent: "var(--danger)",
};

const fillColor: Record<MedStatus, string> = {
  ok: "var(--success)",
  reorder: "var(--warning-accent)",
  urgent: "var(--danger)",
};

const pillStyle: Record<MedStatus, React.CSSProperties> = {
  ok: {
    background: "var(--success-soft)",
    color: "var(--success)",
    borderColor: "var(--green-200)",
  },
  reorder: {
    background: "var(--warning-soft)",
    color: "var(--warning)",
    borderColor: "var(--amber-300)",
  },
  urgent: {
    background: "var(--danger-soft)",
    color: "var(--danger)",
    borderColor: "var(--red-200)",
  },
};

export function MedStatusCard({
  name,
  dose,
  daysRemaining = 0,
  capacityDays = 30,
  status,
  icon,
  chipIcon,
  pillLabel,
  onClick,
  className = "",
  style,
}: MedStatusCardProps) {
  const st = status ?? deriveStatus(daysRemaining);
  const pct = Math.max(4, Math.min(100, (daysRemaining / capacityDays) * 100));
  const label = pillLabel ?? PILL_LABELS[st];

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        fontFamily: "var(--font-body)",
        background: "var(--surface)",
        border: `1px solid ${st === "urgent" ? "var(--red-200)" : "var(--border)"}`,
        borderRadius: "var(--radius-lg)",
        padding: "16px 18px",
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {chipIcon && (
          <span
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              flex: "none",
              display: "grid",
              placeItems: "center",
              ...chipToneStyle[st],
            }}
          >
            {chipIcon}
          </span>
        )}
        <div>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: "18px",
              color: "var(--fg)",
              margin: 0,
            }}
          >
            {name}
          </p>
          {dose && (
            <p
              style={{
                fontSize: "13px",
                color: "var(--fg-muted)",
                margin: "1px 0 0",
              }}
            >
              {dose}
            </p>
          )}
        </div>
        <div
          style={{ marginLeft: "auto", textAlign: "right", flex: "none" }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontFeatureSettings: '"tnum" 1, "zero" 1',
              fontWeight: 600,
              fontSize: "24px",
              lineHeight: 1,
              color: daysNumColor[st],
            }}
          >
            {daysRemaining}
          </div>
          <div
            style={{ fontSize: "11px", color: "var(--fg-muted)", marginTop: "2px" }}
          >
            {daysRemaining === 1 ? "dia restante" : "dias restantes"}
          </div>
        </div>
      </div>

      {/* Stock track */}
      <div
        style={{
          height: "7px",
          borderRadius: "999px",
          background: "var(--chart-track)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: "999px",
            width: `${pct}%`,
            background: fillColor[st],
            transition: `width var(--dur-slow) var(--ease-out)`,
          }}
        />
      </div>

      {/* Footer: status pill only (reorder action omitted per spec) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <span
          style={{
            fontWeight: "var(--fw-semibold)" as unknown as number,
            fontSize: "12.5px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 10px",
            borderRadius: "var(--radius-pill)",
            border: "1px solid transparent",
            ...pillStyle[st],
          }}
        >
          {icon}
          {label}
        </span>
      </div>
    </div>
  );
}
