"use client";

import React, { useState, useCallback, useRef } from "react";
import { Card } from "@/app/components/Card";
import { FrequencyChart } from "@/app/components/FrequencyChart";
import { RecentEpisodes } from "@/app/components/RecentEpisodes";
import { cn } from "@/lib/cn";
import { fmtNum } from "@/lib/format";
import { Activity, Award, Calendar } from "lucide-react";
import { type TrendsPayload } from "@/lib/trends";

// ─── Types mirroring API response ────────────────────────────────────────────

// The full response shape lives in `lib/trends.ts` (single source of truth,
// shared by the server page and the stats API route).
type StatsResponse = TrendsPayload;

// ─── Range helpers ────────────────────────────────────────────────────────────

type RangeKey = "3m" | "6m" | "12m" | "all";

function computeRange(key: RangeKey, now: Date): { from: string; to: string } {
  const to = now.toISOString();
  if (key === "all") {
    // Far-past origin for "all"
    return { from: new Date(2000, 0, 1).toISOString(), to };
  }
  const months = key === "3m" ? 3 : key === "12m" ? 12 : 6;
  const from = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
  return { from: from.toISOString(), to };
}

function fmtRangeLabel(from: string, to: string): string {
  const f = new Date(from);
  const t = new Date(to);
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  };
  const fmt = new Intl.DateTimeFormat("pt-BR", opts);
  return `${fmt.format(f)} – ${fmt.format(t)}`;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  value,
  unit,
  label,
  icon,
}: {
  value: string;
  unit?: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Card padding="sm" className="text-center">
      <span className="text-brand inline-flex">{icon}</span>
      <div className="font-mono font-semibold text-xl text-fg mt-1.5 leading-none">
        {value}
        {unit && (
          <>
            {" "}
            <span className="text-xs text-fg-muted font-body">{unit}</span>
          </>
        )}
      </div>
      <div className="text-2xs text-fg-muted mt-1 font-body">{label}</div>
    </Card>
  );
}

// ─── Range / bucket chips ─────────────────────────────────────────────────────

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "py-1.5 px-3.5 rounded-pill text-[13px] font-semibold cursor-pointer font-body border-[1.5px] min-h-11 inline-flex items-center",
        active
          ? "border-brand bg-brand-soft text-brand-press"
          : "border-border-strong bg-surface text-fg-2"
      )}
    >
      {children}
    </button>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

interface Props {
  initial: StatsResponse;
  now: string; // ISO — stable reference time passed from the server
}

export function TrendsClient({ initial, now }: Props) {
  const [data, setData] = useState<StatsResponse>(initial);
  const [loading, setLoading] = useState(false);
  const [rangeKey, setRangeKey] = useState<RangeKey>("6m");
  const [bucket, setBucket] = useState<"week" | "month">("month");

  const abortRef = useRef<AbortController | null>(null);

  const nowDate = new Date(now);
  const currentYear = nowDate.getFullYear();

  const fetchStats = useCallback(
    async (newRange: RangeKey, newBucket: "week" | "month") => {
      // Abort any in-flight request before starting a new one
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        const range = computeRange(newRange, nowDate);
        const params = new URLSearchParams({
          from: range.from,
          to: range.to,
          bucket: newBucket,
        });
        const res = await fetch(`/api/seizures/stats?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Erro ao carregar estatísticas");
        const json: StatsResponse = await res.json();
        setData(json);
      } catch (err) {
        // Ignore aborted requests — keep previous data on other errors
        if (err instanceof Error && err.name === "AbortError") return;
      } finally {
        if (abortRef.current === controller) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [now]
  );

  function handleRangeChange(key: RangeKey) {
    setRangeKey(key);
    fetchStats(key, bucket);
  }

  function handleBucketChange(b: "week" | "month") {
    setBucket(b);
    fetchStats(rangeKey, b);
  }

  const { stats, series, medChanges, recent, range } = data;
  const hasAnyData = series.some((s) => s.count > 0) || recent.length > 0;

  const rangeLabel = fmtRangeLabel(range.from, range.to);

  // Stat values
  const avgDisplay = fmtNum(stats.monthlyAverage);
  const hasGap = stats.longestGapDays !== null && stats.longestGapDays > 0;
  const gapDisplay = hasGap ? fmtNum(stats.longestGapDays!) : "—";
  const gapUnit = hasGap
    ? stats.longestGapDays === 1
      ? "dia"
      : "dias"
    : undefined;
  const totalDisplay = fmtNum(stats.totalInYear);

  return (
    <div
      className={cn(
        "flex flex-col gap-3.5 pt-1 px-[18px] pb-2 relative transition-opacity duration-200",
        loading ? "opacity-[0.55] pointer-events-none" : "opacity-100"
      )}
      aria-busy={loading}
    >
      {/* Frequency chart card */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className="m-0 font-display font-semibold text-[17px] text-fg">
            Frequência de crises
          </h3>
          {loading && (
            <span
              aria-label="Carregando"
              className="w-4 h-4 rounded-full border-2 border-brand border-t-transparent inline-block shrink-0"
              style={{ animation: "molly-spin 0.7s linear infinite" }}
            />
          )}
        </div>
        <p className="mt-0 mb-2.5 text-[13px] text-fg-muted font-body">
          {rangeLabel}
        </p>

        {/* Range chips */}
        <div className="flex gap-1.5 flex-wrap mb-2.5">
          {(["3m", "6m", "12m", "all"] as const).map((k) => (
            <Chip key={k} active={rangeKey === k} onClick={() => handleRangeChange(k)}>
              {k === "all" ? "Tudo" : k === "3m" ? "3m" : k === "6m" ? "6m" : "12m"}
            </Chip>
          ))}
          <span className="flex-1 border-l border-border mx-1" />
          <Chip active={bucket === "month"} onClick={() => handleBucketChange("month")}>
            Mês
          </Chip>
          <Chip active={bucket === "week"} onClick={() => handleBucketChange("week")}>
            Semana
          </Chip>
        </div>

        {hasAnyData ? (
          <FrequencyChart series={series} medChanges={medChanges} height={180} />
        ) : (
          <div className="py-8 text-center text-fg-muted font-body text-sm">
            Nenhuma crise registrada ainda.
            <br />
            <span className="text-xs">
              Use o botão + para registrar a primeira crise.
            </span>
          </div>
        )}
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <StatCard
          value={avgDisplay}
          label="média / mês"
          icon={<Activity size={18} className="text-brand" />}
        />
        <StatCard
          value={gapDisplay}
          unit={gapUnit}
          label="maior intervalo"
          icon={<Award size={18} className="text-brand" />}
        />
        <StatCard
          value={totalDisplay}
          label={`total em ${currentYear}`}
          icon={<Calendar size={18} className="text-brand" />}
        />
      </div>

      {/* Recent episodes card */}
      <Card padding="lg">
        <h3 className="m-0 mb-3 font-display font-semibold text-[17px] text-fg">
          Registros recentes
        </h3>
        <RecentEpisodes episodes={recent} />
      </Card>
    </div>
  );
}
