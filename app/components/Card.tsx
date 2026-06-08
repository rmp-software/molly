"use client";

import React from "react";
import { cn } from "@/lib/cn";

export type CardVariant = "default" | "flat" | "raised" | "highlighted";
export type CardPadding = "sm" | "md" | "lg";
export type CardTone = "brand" | "ok" | "reorder" | "urgent" | "info";

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
  as?: React.ElementType;
  children?: React.ReactNode;
}

export interface CardChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: CardTone;
  icon?: React.ReactNode;
}

const base =
  "block border rounded-lg text-fg font-body " +
  "transition-[box-shadow,transform,border-color] duration-[220ms] ease-standard";

const paddingMap: Record<CardPadding, string> = {
  sm: "p-3.5",
  md: "p-5",
  lg: "p-6",
};

const variantMap: Record<CardVariant, string> = {
  default: "bg-surface border-border shadow-sm",
  flat: "bg-surface border-border shadow-none",
  raised: "bg-surface border-transparent shadow-md",
  highlighted: "bg-brand-soft border-[var(--gold-300)] shadow-none",
};

const chipToneMap: Record<CardTone, string> = {
  brand: "bg-brand-soft text-brand",
  ok: "bg-success-soft text-success",
  reorder: "bg-warning-soft text-warning",
  urgent: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

export function Card({
  variant = "default",
  padding = "md",
  interactive = false,
  as: Tag = "div",
  className,
  children,
  onClick,
  onKeyDown,
  ...rest
}: CardProps) {
  // Only add keyboard a11y props when the element is a non-native-button div
  const isNativeButton = Tag === "button" || Tag === "a";
  const a11yProps =
    interactive && !isNativeButton
      ? {
          role: "button" as const,
          tabIndex: 0,
          onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
            if (e.key === "Enter" || e.key === " ") {
              if (e.key === " ") e.preventDefault();
              (e.currentTarget as HTMLElement).click();
            }
            onKeyDown?.(e as React.KeyboardEvent<never>);
          },
        }
      : { tabIndex: interactive ? 0 : undefined, onKeyDown };

  return (
    <Tag
      className={cn(
        base,
        paddingMap[padding],
        variantMap[variant],
        interactive && "cursor-pointer [-webkit-tap-highlight-color:transparent]",
        className
      )}
      data-card=""
      onClick={onClick}
      {...a11yProps}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardChip({
  tone = "brand",
  icon,
  className,
  ...rest
}: CardChipProps) {
  return (
    <span
      className={cn(
        "w-10 h-10 rounded-[12px] flex-none grid place-items-center",
        chipToneMap[tone],
        className
      )}
      {...rest}
    >
      {icon}
    </span>
  );
}
