"use client";

import React, { useState, useCallback, useRef } from "react";
import { Card } from "@/app/components/Card";
import { FrequencyChart, type FrequencyChartSeries, type FrequencyChartMedChange } from "@/app/components/FrequencyChart";
import { RecentEpisodes, type RecentEpisodeData } from "@/app/components/RecentEpisodes";
import { fmtNum } from "@/lib/format";
import { Activity, Award, Calendar } from "lucide-react";

// ─── Types mirroring API response ────────────────────────────────────────────

interface StatsPayload {
  monthlyAverage: number;
  longestGapDays: number | null;
  totalInRange: number;
  totalInYear: number;
  timeSinceLast: { days: number } | null;
}

interface StatsResponse {
  range: { from: string; to: string };
  bucket: "week" | "month";
  series: FrequencyChartSeries[];
  stats: StatsPayload;
  breakdown: unknown;
  medChanges: FrequencyChartMedChange[];
  recent: RecentEpisodeData[];
}

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
    <Card padding="sm" style={{ textAlign: "center" }}>
      <span style={{ color: "var(--brand)", display: "inline-flex" }}>{icon}</span>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
          fontSize: "22px",
          color: "var(--fg)",
          marginTop: "6px",
          lineHeight: 1,
        }}
      >
        {value}
        {unit && (
          <>
            {" "}
            <span
              style={{
                fontSize: "12px",
                color: "var(--fg-muted)",
                fontFamily: "var(--font-body)",
              }}
            >
              {unit}
            </span>
          </>
        )}
      </div>
      <div
        style={{
          fontSize: "11px",
          color: "var(--fg-muted)",
          marginTop: "4px",
          fontFamily: "var(--font-body)",
        }}
      >
        {label}
      </div>
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
      style={{
        padding: "6px 14px",
        borderRadius: "999px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "var(--font-body)",
        border: "1.5px solid",
        borderColor: active ? "var(--brand)" : "var(--border-strong)",
        background: active ? "var(--brand-soft, #ede9fe)" : "var(--surface)",
        color: active ? "var(--brand-press, var(--brand))" : "var(--fg-2)",
        minHeight: "36px",
        display: "inline-flex",
        alignItems: "center",
      }}
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
        setLoading(false);
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
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        padding: "4px 18px 8px",
        opacity: loading ? 0.6 : 1,
        transition: "opacity 200ms ease",
      }}
    >
      {/* Frequency chart card */}
      <Card padding="lg">
        <h3
          style={{
            margin: "0 0 2px",
            font: "600 17px var(--font-display)",
            color: "var(--fg)",
          }}
        >
          Frequência de crises
        </h3>
        <p
          style={{
            margin: "0 0 10px",
            fontSize: "13px",
            color: "var(--fg-muted)",
            fontFamily: "var(--font-body)",
          }}
        >
          {rangeLabel}
        </p>

        {/* Range chips */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            marginBottom: "10px",
          }}
        >
          {(["3m", "6m", "12m", "all"] as const).map((k) => (
            <Chip key={k} active={rangeKey === k} onClick={() => handleRangeChange(k)}>
              {k === "all" ? "Tudo" : k === "3m" ? "3m" : k === "6m" ? "6m" : "12m"}
            </Chip>
          ))}
          <span
            style={{
              flex: 1,
              borderLeft: "1px solid var(--border)",
              margin: "0 4px",
            }}
          />
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
          <div
            style={{
              padding: "32px 0",
              textAlign: "center",
              color: "var(--fg-muted)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
            }}
          >
            Nenhuma crise registrada ainda.
            <br />
            <span style={{ fontSize: "12px" }}>
              Use o botão + para registrar a primeira crise.
            </span>
          </div>
        )}
      </Card>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "10px",
        }}
      >
        <StatCard
          value={avgDisplay}
          label="média / mês"
          icon={<Activity size={18} color="var(--brand)" />}
        />
        <StatCard
          value={gapDisplay}
          unit={gapUnit}
          label="maior intervalo"
          icon={<Award size={18} color="var(--brand)" />}
        />
        <StatCard
          value={totalDisplay}
          label={`total em ${currentYear}`}
          icon={<Calendar size={18} color="var(--brand)" />}
        />
      </div>

      {/* Recent episodes card */}
      <Card padding="lg">
        <h3
          style={{
            margin: "0 0 12px",
            font: "600 17px var(--font-display)",
            color: "var(--fg)",
          }}
        >
          Registros recentes
        </h3>
        <RecentEpisodes episodes={recent} />
      </Card>
    </div>
  );
}
