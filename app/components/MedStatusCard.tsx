"use client";

import React from "react";
import { MoreHorizontal } from "lucide-react";
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
  onMenuClick?: () => void;
  menuLabel?: string;
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
  onMenuClick,
  menuLabel,
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
      {/* Header block: top row + full-width subtitle, grouped tightly together */}
      <div className="flex flex-col gap-1.5">
        {/* Top row: chip · name · ⋯ */}
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
          <p className="font-display font-semibold text-lg text-fg m-0 min-w-0 flex-1">
            {name}
          </p>
          {onMenuClick && (
            <button
              type="button"
              aria-label={menuLabel ?? `Ações para ${name}`}
              onClick={(e) => {
                e.stopPropagation();
                onMenuClick();
              }}
              className="flex-none w-11 h-11 -mr-2 grid place-items-center text-fg-muted rounded-md transition-colors duration-[140ms] ease-standard active:bg-bg [-webkit-tap-highlight-color:transparent]"
            >
              <MoreHorizontal size={20} />
            </button>
          )}
        </div>

        {/* Full-width subtitle: dose · times · mg/kg. Fits on one line at phone
            width; if ever too narrow it wraps only at the " · " separators (each
            fact uses non-breaking spaces) — never mid-phrase, never truncated. */}
        {dose && (
          <p className="text-[13px] text-fg-muted m-0 leading-snug">{dose}</p>
        )}
      </div>

      {/* Stock track */}
      <div className="h-[7px] rounded-pill bg-chart-track overflow-hidden">
        <div
          className={cn("h-full rounded-pill transition-[width] duration-[360ms] ease-out", fillClass[st])}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Footer: status pill + days-remaining, grouped with the bar's hierarchy.
          Days sits below the bar (not the header) at a small size; the number
          keeps the status color as the urgency cue. */}
      <div className="flex items-center justify-between gap-2.5">
        <span
          className={cn(
            "font-semibold text-[12.5px] inline-flex items-center gap-1.5 py-[5px] px-2.5 rounded-pill border border-transparent min-w-0",
            pillClass[st]
          )}
        >
          {icon}
          {label}
        </span>
        <span className="flex-none text-[13px] text-fg-muted whitespace-nowrap">
          <span
            className={cn(
              "font-mono font-semibold [font-feature-settings:'tnum'_1,'zero'_1]",
              daysNumClass[st]
            )}
          >
            {daysRemaining}
          </span>{" "}
          {daysRemaining === 1 ? "dia restante" : "dias restantes"}
        </span>
      </div>
    </div>
  );
}
