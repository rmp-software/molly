"use client";

import React from "react";

export type PillStatus = "ok" | "reorder" | "urgent" | "info" | "neutral";
export type PillSize = "md" | "sm";

export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: PillStatus;
  size?: PillSize;
  solid?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const PT_BR_LABELS: Record<"ok" | "reorder" | "urgent", string> = {
  ok: "Estoque OK",
  reorder: "Reabastecer em breve",
  urgent: "Acabando",
};

const statusStyles: Record<PillStatus, React.CSSProperties> = {
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
  info: {
    background: "var(--info-soft)",
    color: "var(--info)",
    borderColor: "var(--blue-200)",
  },
  neutral: {
    background: "var(--bg-2)",
    color: "var(--fg-2)",
    borderColor: "var(--border)",
  },
};

const dotColors: Record<PillStatus, string> = {
  ok: "var(--success)",
  reorder: "var(--warning-accent)",
  urgent: "var(--danger)",
  info: "var(--info)",
  neutral: "var(--fg-muted)",
};

export function StatusPill({
  status = "ok",
  size = "md",
  solid = false,
  icon,
  children,
  className = "",
  style,
  ...rest
}: StatusPillProps) {
  const isSmall = size === "sm";

  const pillStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontWeight: "var(--fw-semibold)" as unknown as number,
    fontSize: isSmall ? "11.5px" : "13px",
    lineHeight: 1,
    display: "inline-flex",
    alignItems: "center",
    gap: isSmall ? "5px" : "6px",
    padding: isSmall ? "4px 9px 4px 7px" : "6px 11px 6px 9px",
    borderRadius: "var(--radius-pill)",
    border: "1px solid transparent",
    whiteSpace: "nowrap",
    ...(solid && status === "urgent"
      ? { background: "var(--danger)", color: "var(--neutral-0)", borderColor: "transparent" }
      : statusStyles[status]),
    ...style,
  };

  return (
    <span className={className} style={pillStyle} {...rest}>
      {icon ? (
        <span style={{ display: "inline-flex", flex: "none" }}>{icon}</span>
      ) : (
        <span
          aria-hidden="true"
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            flex: "none",
            background: solid && status === "urgent" ? "var(--neutral-0)" : dotColors[status],
          }}
        />
      )}
      {children}
    </span>
  );
}

/** Convenience: pre-labeled stock status pill */
export function StockPill({
  status,
  size,
  ...rest
}: Omit<StatusPillProps, "children"> & { status: "ok" | "reorder" | "urgent" }) {
  return (
    <StatusPill status={status} size={size} {...rest}>
      {PT_BR_LABELS[status]}
    </StatusPill>
  );
}
