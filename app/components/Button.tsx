"use client";

import React from "react";
import { cn } from "@/lib/cn";

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

const base =
  "inline-flex items-center justify-center font-body font-bold leading-none " +
  "tracking-[-0.005em] rounded-pill border-[1.5px] border-transparent cursor-pointer " +
  "select-none whitespace-nowrap no-underline " +
  "transition-[background,border-color,color,transform,box-shadow] duration-[140ms] ease-standard " +
  "[-webkit-tap-highlight-color:transparent]";

const sizeMap: Record<ButtonSize, string> = {
  sm: "min-h-10 px-3.5 py-[9px] text-sm gap-1.5",
  md: "min-h-12 px-[18px] py-3 text-base gap-2",
  lg: "min-h-14 px-6 py-4 text-lg gap-2.5",
};

const variantMap: Record<ButtonVariant, string> = {
  primary: "bg-brand text-brand-on shadow-sm",
  secondary: "bg-surface text-brand border-border-strong",
  ghost: "bg-transparent text-fg",
  destructive: "bg-danger text-[var(--neutral-0)] shadow-sm",
};

const iconOnlyMap: Record<ButtonSize, string> = {
  sm: "w-10 p-0 aspect-square",
  md: "w-12 p-0 aspect-square",
  lg: "w-14 p-0 aspect-square",
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
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        base,
        sizeMap[size],
        variantMap[variant],
        fullWidth && "w-full",
        iconOnly && iconOnlyMap[size],
        (disabled || loading) && "cursor-not-allowed opacity-45",
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner />}
      {!loading && icon && (
        <span className="inline-flex flex-none">{icon}</span>
      )}
      {!iconOnly && children}
      {!loading && trailingIcon && (
        <span className="inline-flex flex-none">{trailingIcon}</span>
      )}
    </button>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block w-[1.15em] h-[1.15em] rounded-full border-[2.5px] border-current border-t-transparent opacity-90"
      style={{ animation: "molly-spin 0.7s linear infinite" }}
    />
  );
}
