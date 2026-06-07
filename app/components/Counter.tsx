"use client";

import React from "react";

export interface CounterProps {
  since: Date | string;
  eyebrow?: string;
  icon?: React.ReactNode;
  sub?: string;
  size?: "md" | "sm";
  live?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

function diffParts(since: number, now: number) {
  let ms = Math.max(0, now - since);
  const day = 86400000,
    hour = 3600000,
    min = 60000;
  const days = Math.floor(ms / day);
  ms -= days * day;
  const hours = Math.floor(ms / hour);
  ms -= hours * hour;
  const mins = Math.floor(ms / min);
  return { days, hours, mins };
}

function pad(x: number) {
  return String(x).padStart(2, "0");
}

export function Counter({
  since,
  eyebrow = "Desde a última crise",
  icon,
  sub,
  size = "md",
  live = true,
  className = "",
  style,
}: CounterProps) {
  const start = React.useMemo(
    () => (since instanceof Date ? since : new Date(since)),
    [since]
  );
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, [live]);

  const { days, hours, mins } = diffParts(start.getTime(), now);
  const numSize = size === "sm" ? "34px" : "56px";

  return (
    <div
      className={className}
      style={{
        fontFamily: "var(--font-body)",
        textAlign: "center",
        ...style,
      }}
    >
      {eyebrow && (
        <p
          style={{
            fontSize: "13px",
            fontWeight: "var(--fw-semibold)" as unknown as number,
            color: "var(--fg-2)",
            letterSpacing: "0.01em",
            margin: "0 0 6px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {icon}
          {eyebrow}
        </p>
      )}
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontFeatureSettings: '"tnum" 1, "zero" 1',
          fontWeight: 600,
          color: "var(--fg)",
          lineHeight: 1,
          letterSpacing: "-0.03em",
          display: "flex",
          alignItems: "baseline",
          justifyContent: "center",
          gap: "4px",
          flexWrap: "wrap",
        }}
      >
        {days > 0 && (
          <span>
            <span style={{ fontSize: numSize }}>{days}</span>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.34em",
                fontWeight: 500,
                color: "var(--fg-muted)",
                letterSpacing: 0,
                marginRight: "8px",
              }}
            >
              {days === 1 ? "dia" : "dias"}
            </span>
          </span>
        )}
        <span>
          <span style={{ fontSize: numSize }}>{pad(hours)}</span>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.34em",
              fontWeight: 500,
              color: "var(--fg-muted)",
              letterSpacing: 0,
              marginRight: "8px",
            }}
          >
            h
          </span>
        </span>
        <span>
          <span style={{ fontSize: numSize }}>{pad(mins)}</span>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.34em",
              fontWeight: 500,
              color: "var(--fg-muted)",
              letterSpacing: 0,
              marginRight: "8px",
            }}
          >
            min
          </span>
        </span>
      </div>
      {sub && (
        <p
          style={{
            fontSize: "13px",
            color: "var(--fg-muted)",
            margin: "8px 0 0",
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
