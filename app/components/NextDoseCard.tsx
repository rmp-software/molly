"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/app/components/Card";
import { Pill } from "lucide-react";

interface Props {
  medName: string;
  at: string; // ISO date string
}

function fmtDoseLabel(at: Date, now: Date): string {
  const isToday =
    at.getFullYear() === now.getFullYear() &&
    at.getMonth() === now.getMonth() &&
    at.getDate() === now.getDate();

  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const isTomorrow =
    at.getFullYear() === tomorrow.getFullYear() &&
    at.getMonth() === tomorrow.getMonth() &&
    at.getDate() === tomorrow.getDate();

  const dayLabel = isToday ? "hoje" : isTomorrow ? "amanhã" : null;

  const hh = String(at.getHours()).padStart(2, "0");
  const mm = String(at.getMinutes()).padStart(2, "0");
  const timeLabel = mm === "00" ? `${hh}h` : `${hh}h${mm}`;

  return dayLabel ? `${dayLabel}, ${timeLabel}` : timeLabel;
}

function fmtCountdown(at: Date, now: Date): string {
  const diffMs = at.getTime() - now.getTime();
  if (diffMs <= 0) return "agora";
  const totalMins = Math.round(diffMs / 60000);
  if (totalMins < 60) return `em ${totalMins}min`;
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (mins === 0) return `em ${hours}h`;
  return `em ${hours}h${mins}min`;
}

export function NextDoseCard({ medName, at }: Props) {
  const atDate = new Date(at);
  // Compute client-side to avoid SSR/hydration mismatch
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const doseLabel = now ? fmtDoseLabel(atDate, now) : "—";
  const countdown = now ? fmtCountdown(atDate, now) : "—";

  return (
    <Card
      variant="highlighted"
      padding="md"
      style={{ display: "flex", alignItems: "center", gap: "13px" }}
    >
      <span
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "12px",
          flex: "none",
          display: "grid",
          placeItems: "center",
          background: "var(--surface)",
          color: "var(--brand)",
        }}
      >
        <Pill size={21} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "12.5px",
            fontWeight: 600,
            color: "var(--brand)",
            fontFamily: "var(--font-body)",
          }}
        >
          Próxima dose
        </div>
        <div
          style={{
            font: "700 17px/1.1 var(--font-display)",
            color: "var(--fg)",
            marginTop: "2px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {medName} · {doseLabel}
        </div>
      </div>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
          fontSize: "13px",
          color: "var(--brand)",
          background: "var(--surface)",
          padding: "5px 9px",
          borderRadius: "999px",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
      >
        {countdown}
      </span>
    </Card>
  );
}

export function NextDoseCardEmpty() {
  return (
    <Card
      variant="flat"
      padding="md"
      style={{ display: "flex", alignItems: "center", gap: "13px", opacity: 0.6 }}
    >
      <span
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "12px",
          flex: "none",
          display: "grid",
          placeItems: "center",
          background: "var(--surface-2, var(--surface))",
          color: "var(--fg-muted)",
        }}
      >
        <Pill size={21} />
      </span>
      <div style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--fg-muted)" }}>
        Nenhuma dose agendada
      </div>
    </Card>
  );
}
