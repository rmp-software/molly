"use client";

import React from "react";
import { cn } from "@/lib/cn";

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

const statusClass: Record<PillStatus, string> = {
  ok: "bg-success-soft text-success border-[var(--green-200)]",
  reorder: "bg-warning-soft text-warning border-[var(--amber-300)]",
  urgent: "bg-danger-soft text-danger border-[var(--red-200)]",
  info: "bg-info-soft text-info border-[var(--blue-200)]",
  neutral: "bg-bg-2 text-fg-2 border-border",
};

const dotClass: Record<PillStatus, string> = {
  ok: "bg-success",
  reorder: "bg-[var(--warning-accent)]",
  urgent: "bg-danger",
  info: "bg-info",
  neutral: "bg-fg-muted",
};

const base =
  "inline-flex items-center font-body font-semibold leading-none rounded-pill border border-transparent whitespace-nowrap";

const sizeClass: Record<PillSize, string> = {
  md: "text-[13px] gap-1.5 py-1.5 pr-[11px] pl-[9px]",
  sm: "text-[11.5px] gap-[5px] py-1 pr-[9px] pl-[7px]",
};

export function StatusPill({
  status = "ok",
  size = "md",
  solid = false,
  icon,
  children,
  className,
  ...rest
}: StatusPillProps) {
  const solidUrgent = solid && status === "urgent";

  return (
    <span
      className={cn(
        base,
        sizeClass[size],
        solidUrgent
          ? "bg-danger text-[var(--neutral-0)] border-transparent"
          : statusClass[status],
        className
      )}
      {...rest}
    >
      {icon ? (
        <span className="inline-flex flex-none">{icon}</span>
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            "w-[7px] h-[7px] rounded-full flex-none",
            solidUrgent ? "bg-[var(--neutral-0)]" : dotClass[status]
          )}
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
