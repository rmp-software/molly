"use client";

import React from "react";
import { cn } from "@/lib/cn";

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

const unitClass =
  "font-body text-[0.34em] font-medium text-fg-muted tracking-normal mr-2";

export function Counter({
  since,
  eyebrow = "Desde a última crise",
  icon,
  sub,
  size = "md",
  live = true,
  className,
  style,
}: CounterProps) {
  const start = React.useMemo(
    () => (since instanceof Date ? since : new Date(since)),
    [since]
  );
  const [now, setNow] = React.useState<number | null>(null);

  React.useEffect(() => {
    setNow(Date.now());
  }, []);

  React.useEffect(() => {
    if (!live || now === null) return;
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, [live, now]);

  const parts = now !== null ? diffParts(start.getTime(), now) : null;
  const { days, hours, mins } = parts ?? { days: 0, hours: 0, mins: 0 };
  const numSize = size === "sm" ? "34px" : "56px";

  const valueText =
    parts !== null
      ? days > 0
        ? `${days} ${days === 1 ? "dia" : "dias"} ${pad(hours)}h ${pad(mins)}min`
        : `${pad(hours)}h ${pad(mins)}min`
      : "—";

  return (
    <div className={cn("font-body text-center", className)} style={style}>
      {eyebrow && (
        <p className="text-[13px] font-semibold text-fg-2 tracking-[0.01em] mt-0 mb-1.5 inline-flex items-center gap-1.5">
          {icon}
          {eyebrow}
        </p>
      )}
      <div
        role="timer"
        aria-label={eyebrow ? `${eyebrow}: ${valueText}` : valueText}
        className="font-mono font-semibold text-fg leading-none tracking-[-0.03em] flex items-baseline justify-center gap-1 flex-wrap [font-feature-settings:'tnum'_1,'zero'_1]"
      >
        {now === null ? (
          <span className="text-fg-muted" style={{ fontSize: numSize }}>
            —
          </span>
        ) : (
          <>
            {days > 0 && (
              <span>
                <span style={{ fontSize: numSize }}>{days}</span>
                <span className={unitClass}>{days === 1 ? "dia" : "dias"}</span>
              </span>
            )}
            <span>
              <span style={{ fontSize: numSize }}>{pad(hours)}</span>
              <span className={unitClass}>h</span>
            </span>
            <span>
              <span style={{ fontSize: numSize }}>{pad(mins)}</span>
              <span className={unitClass}>min</span>
            </span>
          </>
        )}
      </div>
      {sub && <p className="text-[13px] text-fg-muted mt-2 mb-0">{sub}</p>}
    </div>
  );
}
