"use client";

import React from "react";
import { PawPrint } from "lucide-react";

export interface LogoProps {
  size?: "sm" | "md" | "lg";
  badge?: boolean;
  markOnly?: boolean;
  word?: string;
  className?: string;
  style?: React.CSSProperties;
}

const fontSizeMap = { sm: "18px", md: "24px", lg: "32px" };

export function Logo({
  size = "md",
  badge = false,
  markOnly = false,
  word = "Molly",
  className = "",
  style,
}: LogoProps) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "9px",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        letterSpacing: "-0.02em",
        color: "var(--fg)",
        lineHeight: 1,
        fontSize: fontSizeMap[size],
        ...style,
      }}
    >
      <span
        style={{
          display: "grid",
          placeItems: "center",
          color: badge ? "var(--brand-on)" : "var(--brand)",
          ...(badge
            ? {
                background: "var(--brand)",
                borderRadius: "28%",
                padding: "0.26em",
              }
            : {}),
        }}
      >
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
