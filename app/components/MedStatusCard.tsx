"use client";

import React from "react";
import { cn } from "@/lib/cn";

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

const chipToneClass: Record<MedStatus, string> = {
  ok: "bg-success-soft text-success",
  reorder: "bg-warning-soft text-warning",
  urgent: "bg-danger-soft text-danger",
};

const daysNumClass: Record<MedStatus, string> = {
  ok: "text-success",
  reorder: "text-warning",
  urgent: "text-danger",
};

const fillClass: Record<MedStatus, string> = {
  ok: "bg-success",
  reorder: "bg-[var(--warning-accent)]",
  urgent: "bg-danger",
};

const pillClass: Record<MedStatus, string> = {
  ok: "bg-success-soft text-success border-[var(--green-200)]",
  reorder: "bg-warning-soft text-warning border-[var(--amber-300)]",
  urgent: "bg-danger-soft text-danger border-[var(--red-200)]",
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
  className,
  style,
}: MedStatusCardProps) {
  const st = status ?? deriveStatus(daysRemaining);
  const pct = Math.max(4, Math.min(100, (daysRemaining / capacityDays) * 100));
  const label = pillLabel ?? PILL_LABELS[st];

  const interactiveProps = onClick
    ? {
        role: "button" as const,
        tabIndex: 0,
        onClick,
        onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.key === "Enter" || e.key === " ") {
            if (e.key === " ") e.preventDefault();
            onClick();
          }
        },
      }
    : {};

  return (
    <div
      className={cn(
        "font-body bg-surface rounded-lg py-4 px-[18px] shadow-sm flex flex-col gap-3 border",
        st === "urgent" ? "border-[var(--red-200)]" : "border-border",
        onClick && "cursor-pointer",
        className
      )}
      style={style}
      {...interactiveProps}
    >
      {/* Top row */}
      <div className="flex items-center gap-3">
        {chipIcon && (
          <span
            className={cn(
              "w-[42px] h-[42px] rounded-[12px] flex-none grid place-items-center",
              chipToneClass[st]
            )}
          >
            {chipIcon}
          </span>
        )}
        <div>
          <p className="font-display font-semibold text-lg text-fg m-0">{name}</p>
          {dose && <p className="text-[13px] text-fg-muted mt-px mb-0">{dose}</p>}
        </div>
        <div className="ml-auto text-right flex-none">
          <div
            className={cn(
              "font-mono font-semibold text-[24px] leading-none [font-feature-settings:'tnum'_1,'zero'_1]",
              daysNumClass[st]
            )}
          >
            {daysRemaining}
          </div>
          <div className="text-2xs text-fg-muted mt-0.5">
            {daysRemaining === 1 ? "dia restante" : "dias restantes"}
          </div>
        </div>
      </div>

      {/* Stock track */}
      <div className="h-[7px] rounded-pill bg-chart-track overflow-hidden">
        <div
          className={cn("h-full rounded-pill transition-[width] duration-[360ms] ease-out", fillClass[st])}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Footer: status pill only (reorder action omitted per spec) */}
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "font-semibold text-[12.5px] inline-flex items-center gap-1.5 py-[5px] px-2.5 rounded-pill border border-transparent",
            pillClass[st]
          )}
        >
          {icon}
          {label}
        </span>
      </div>
    </div>
  );
}
