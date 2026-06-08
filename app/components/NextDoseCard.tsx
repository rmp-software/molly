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
    <Card variant="highlighted" padding="md" className="flex items-center gap-[13px]">
      <span className="w-[42px] h-[42px] rounded-[12px] flex-none grid place-items-center bg-surface text-brand">
        <Pill size={21} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-semibold text-brand font-body">
          Próxima dose
        </div>
        <div className="font-display font-bold text-[17px] leading-[1.1] text-fg mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
          {medName} · {doseLabel}
        </div>
      </div>
      <span className="font-mono font-semibold text-[13px] text-brand bg-surface py-[5px] px-[9px] rounded-pill flex-none whitespace-nowrap">
        {countdown}
      </span>
    </Card>
  );
}

export function NextDoseCardEmpty() {
  return (
    <Card variant="flat" padding="md" className="flex items-center gap-[13px] opacity-60">
      <span className="w-[42px] h-[42px] rounded-[12px] flex-none grid place-items-center bg-surface text-fg-muted">
        <Pill size={21} />
      </span>
      <div className="font-body text-sm text-fg-muted">Nenhuma dose agendada</div>
    </Card>
  );
}
