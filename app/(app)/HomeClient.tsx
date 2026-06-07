"use client";

import React from "react";
import { Card } from "@/app/components/Card";
import { Button } from "@/app/components/Button";
import { Counter } from "@/app/components/Counter";
import { FrequencyChart, type FrequencyChartSeries } from "@/app/components/FrequencyChart";
import { NextDoseCard, NextDoseCardEmpty } from "@/app/components/NextDoseCard";
import { useLogSheet } from "@/app/components/AppShell";
import { ShieldCheck, TrendingDown, TrendingUp, Minus, PawPrint } from "lucide-react";

export interface HomeProps {
  lastSeizureAt: string | null; // ISO
  nextDose: { medName: string; at: string } | null; // at = ISO
  series: FrequencyChartSeries[];
  trend: "less" | "more" | "stable";
}

function TrendIcon({ trend }: { trend: HomeProps["trend"] }) {
  if (trend === "less")
    return <TrendingDown size={14} color="var(--success)" />;
  if (trend === "more")
    return <TrendingUp size={14} color="var(--danger)" />;
  return <Minus size={14} color="var(--fg-muted)" />;
}

function trendLabel(trend: HomeProps["trend"]): string {
  if (trend === "less") return "menos que antes";
  if (trend === "more") return "mais que antes";
  return "estável";
}

function trendColor(trend: HomeProps["trend"]): string {
  if (trend === "less") return "var(--success)";
  if (trend === "more") return "var(--danger)";
  return "var(--fg-muted)";
}

export function HomeClient({ lastSeizureAt, nextDose, series, trend }: HomeProps) {
  const { openLog } = useLogSheet();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        padding: "4px 18px 8px",
      }}
    >
      {/* Hero counter card */}
      <Card
        variant="raised"
        padding="lg"
        style={{ textAlign: "center", paddingTop: "26px", paddingBottom: "26px" }}
      >
        {lastSeizureAt ? (
          <Counter
            since={new Date(lastSeizureAt)}
            eyebrow="Desde a última crise"
            sub="Você está cuidando bem dela."
          />
        ) : (
          <div
            style={{
              fontFamily: "var(--font-body)",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--fg-2)",
                marginBottom: "8px",
              }}
            >
              Nenhuma crise registrada
            </p>
            <p
              style={{
                fontSize: "15px",
                color: "var(--fg)",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              Tudo tranquilo por aqui. 🐾
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "var(--fg-muted)",
                marginTop: "8px",
              }}
            >
              Você está cuidando bem dela.
            </p>
          </div>
        )}
      </Card>

      {/* Primary action */}
      <div>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          icon={<PawPrint size={22} />}
          onClick={openLog}
        >
          Registrar crise
        </Button>
        <p
          style={{
            margin: "8px 0 2px",
            textAlign: "center",
            fontSize: "13px",
            color: "var(--fg-muted)",
            fontFamily: "var(--font-body)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <ShieldCheck size={14} color="var(--fg-muted)" />
          Leva poucos segundos, com uma mão só.
        </p>
      </div>

      {/* Next dose card */}
      {nextDose ? (
        <NextDoseCard medName={nextDose.medName} at={nextDose.at} />
      ) : (
        <NextDoseCardEmpty />
      )}

      {/* Frequency mini chart */}
      <Card padding="lg">
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: "6px",
          }}
        >
          <h3
            style={{
              margin: 0,
              font: "600 17px var(--font-display)",
              color: "var(--fg)",
            }}
          >
            Crises por mês
          </h3>
          <span
            style={{
              fontSize: "12.5px",
              color: trendColor(trend),
              fontWeight: 600,
              fontFamily: "var(--font-body)",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <TrendIcon trend={trend} />
            {trendLabel(trend)}
          </span>
        </div>
        {series.length > 0 ? (
          <FrequencyChart series={series} height={150} />
        ) : (
          <div
            style={{
              padding: "24px 0",
              textAlign: "center",
              color: "var(--fg-muted)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
            }}
          >
            Nenhuma crise registrada ainda.
          </div>
        )}
      </Card>
    </div>
  );
}
