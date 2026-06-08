"use client";

import React from "react";
import { PawPrint } from "lucide-react";
import { cn } from "@/lib/cn";

export interface LogoProps {
  size?: "sm" | "md" | "lg";
  badge?: boolean;
  markOnly?: boolean;
  word?: string;
  className?: string;
  style?: React.CSSProperties;
}

const sizeClass: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "text-lg",
  md: "text-[24px]",
  lg: "text-[32px]",
};

export function Logo({
  size = "md",
  badge = false,
  markOnly = false,
  word = "Molly",
  className,
  style,
}: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[9px] font-display font-bold tracking-tight text-fg leading-none",
        sizeClass[size],
        className
      )}
      style={style}
    >
      <span
        className={cn(
          "grid place-items-center",
          badge ? "text-brand-on bg-brand rounded-[28%] p-[0.26em]" : "text-brand"
        )}
      >
        {/* em-based sizing + stroke width stay inline (relative/programmatic) */}
        <PawPrint
          style={{
            width: "1.05em",
            height: "1.05em",
            strokeWidth: badge ? 2.5 : 2.25,
          }}
        />
      </span>
      {!markOnly && <span>{word}</span>}
    </span>
  );
}
