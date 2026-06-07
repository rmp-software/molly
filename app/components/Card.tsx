"use client";

import React from "react";

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

const paddingMap: Record<CardPadding, string> = {
  sm: "14px",
  md: "20px",
  lg: "24px",
};

const variantStyles: Record<CardVariant, React.CSSProperties> = {
  default: {
    boxShadow: "var(--shadow-sm)",
    borderColor: "var(--border)",
    background: "var(--surface)",
  },
  flat: {
    boxShadow: "none",
    borderColor: "var(--border)",
    background: "var(--surface)",
  },
  raised: {
    boxShadow: "var(--shadow-md)",
    borderColor: "transparent",
    background: "var(--surface)",
  },
  highlighted: {
    boxShadow: "none",
    borderColor: "var(--gold-300)",
    background: "var(--brand-soft)",
  },
};

const chipToneStyles: Record<CardTone, React.CSSProperties> = {
  brand: { background: "var(--brand-soft)", color: "var(--brand)" },
  ok: { background: "var(--success-soft)", color: "var(--success)" },
  reorder: { background: "var(--warning-soft)", color: "var(--warning)" },
  urgent: { background: "var(--danger-soft)", color: "var(--danger)" },
  info: { background: "var(--info-soft)", color: "var(--info)" },
};

export function Card({
  variant = "default",
  padding = "md",
  interactive = false,
  as: Tag = "div",
  className = "",
  children,
  style,
  onClick,
  onKeyDown,
  ...rest
}: CardProps) {
  const cardStyle: React.CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: paddingMap[padding],
    color: "var(--fg)",
    fontFamily: "var(--font-body)",
    transition: `box-shadow var(--dur-base) var(--ease-standard),
      transform var(--dur-fast) var(--ease-standard),
      border-color var(--dur-base) var(--ease-standard)`,
    ...(interactive
      ? { cursor: "pointer", WebkitTapHighlightColor: "transparent" }
      : {}),
    ...variantStyles[variant],
    ...style,
  };

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
      className={className}
      data-card=""
      style={cardStyle}
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
  className = "",
  style,
  ...rest
}: CardChipProps) {
  const chipStyle: React.CSSProperties = {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    flex: "none",
    display: "grid",
    placeItems: "center",
    ...chipToneStyles[tone],
    ...style,
  };

  return (
    <span className={className} style={chipStyle} {...rest}>
      {icon}
    </span>
  );
}
