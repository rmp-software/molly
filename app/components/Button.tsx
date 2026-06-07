"use client";

import React from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  iconOnly?: boolean;
}

const baseStyles: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontWeight: "var(--fw-bold)" as unknown as number,
  lineHeight: 1,
  letterSpacing: "-0.005em",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "var(--radius-pill)",
  border: "1.5px solid transparent",
  cursor: "pointer",
  userSelect: "none",
  whiteSpace: "nowrap",
  transition: `background var(--dur-fast) var(--ease-standard),
    border-color var(--dur-fast) var(--ease-standard),
    color var(--dur-fast) var(--ease-standard),
    transform var(--dur-fast) var(--ease-standard),
    box-shadow var(--dur-fast) var(--ease-standard)`,
  WebkitTapHighlightColor: "transparent",
  textDecoration: "none",
};

const sizeMap: Record<ButtonSize, React.CSSProperties> = {
  sm: { minHeight: "38px", padding: "9px 14px", fontSize: "14px", gap: "6px" },
  md: { minHeight: "48px", padding: "12px 18px", fontSize: "16px", gap: "8px" },
  lg: { minHeight: "56px", padding: "16px 24px", fontSize: "18px", gap: "10px" },
};

const variantMap: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "var(--brand)",
    color: "var(--brand-on)",
    boxShadow: "var(--shadow-sm)",
  },
  secondary: {
    background: "var(--surface)",
    color: "var(--brand)",
    borderColor: "var(--border-strong)",
  },
  ghost: {
    background: "transparent",
    color: "var(--fg)",
  },
  destructive: {
    background: "var(--danger)",
    color: "#fff",
    boxShadow: "var(--shadow-sm)",
  },
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  trailingIcon,
  iconOnly = false,
  className = "",
  children,
  style,
  ...rest
}: ButtonProps) {
  const combinedStyle: React.CSSProperties = {
    ...baseStyles,
    ...sizeMap[size],
    ...variantMap[variant],
    ...(fullWidth ? { width: "100%" } : {}),
    ...(iconOnly
      ? {
          padding: 0,
          width: sizeMap[size].minHeight,
          aspectRatio: "1",
        }
      : {}),
    ...(disabled || loading ? { cursor: "not-allowed", opacity: 0.45 } : {}),
    ...style,
  };

  return (
    <button
      className={className}
      style={combinedStyle}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner />}
      {!loading && icon && (
        <span style={{ display: "inline-flex", flex: "none" }}>{icon}</span>
      )}
      {!iconOnly && children}
      {!loading && trailingIcon && (
        <span style={{ display: "inline-flex", flex: "none" }}>
          {trailingIcon}
        </span>
      )}
    </button>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      style={{
        width: "1.15em",
        height: "1.15em",
        borderRadius: "50%",
        border: "2.5px solid currentColor",
        borderTopColor: "transparent",
        display: "inline-block",
        animation: "molly-spin 0.7s linear infinite",
        opacity: 0.9,
      }}
    />
  );
}
