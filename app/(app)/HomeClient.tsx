"use client";

import React from "react";
import { Card } from "@/app/components/Card";
import { Button } from "@/app/components/Button";
import { Counter } from "@/app/components/Counter";
import { FrequencyChart, type FrequencyChartSeries } from "@/app/components/FrequencyChart";
import { NextDoseCard, NextDoseCardEmpty } from "@/app/components/NextDoseCard";
import { useLogSheet } from "@/app/components/AppShell";
import { cn } from "@/lib/cn";
import { ShieldCheck, TrendingDown, TrendingUp, Minus, PawPrint } from "lucide-react";

export interface HomeProps {
  lastSeizureAt: string | null; // ISO
  nextDose: { medName: string; at: string } | null; // at = ISO
  series: FrequencyChartSeries[];
  trend: "less" | "more" | "stable";
}

function TrendIcon({ trend }: { trend: HomeProps["trend"] }) {
  if (trend === "less")
    return <TrendingDown size={14} className="text-success" />;
  if (trend === "more")
    return <TrendingUp size={14} className="text-danger" />;
  return <Minus size={14} className="text-fg-muted" />;
}

function trendLabel(trend: HomeProps["trend"]): string {
  if (trend === "less") return "menos que antes";
  if (trend === "more") return "mais que antes";
  return "estável";
}

function trendTextClass(trend: HomeProps["trend"]): string {
  if (trend === "less") return "text-success";
  if (trend === "more") return "text-danger";
  return "text-fg-muted";
}

export function HomeClient({ lastSeizureAt, nextDose, series, trend }: HomeProps) {
  const { openLog } = useLogSheet();

  return (
    <div className="flex flex-col gap-4 pt-1 px-[18px] pb-2">
      {/* Hero counter card */}
      <Card variant="raised" padding="lg" className="text-center py-[26px]">
        {lastSeizureAt ? (
          <Counter
            since={new Date(lastSeizureAt)}
            eyebrow="Desde a última crise"
            sub="Você está cuidando bem dela."
          />
        ) : (
          <div className="font-body text-center">
            <p className="text-[13px] font-semibold text-fg-2 mb-2">
              Nenhuma crise registrada
            </p>
            <p className="text-[15px] text-fg m-0 leading-[1.4]">
              Tudo tranquilo por aqui. 🐾
            </p>
            <p className="text-[13px] text-fg-muted mt-2">
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
        <p className="mt-2 mb-0.5 text-center text-[13px] text-fg-muted font-body flex items-center justify-center gap-1.5">
          <ShieldCheck size={14} className="text-fg-muted" />
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
        <div className="flex items-baseline justify-between mb-1.5">
          <h3 className="m-0 font-display font-semibold text-[17px] text-fg">
            Crises por mês
          </h3>
          <span
            className={cn(
              "text-[12.5px] font-semibold font-body inline-flex items-center gap-1",
              trendTextClass(trend)
            )}
          >
            <TrendIcon trend={trend} />
            {trendLabel(trend)}
          </span>
        </div>
        {series.length > 0 ? (
          <FrequencyChart series={series} height={150} />
        ) : (
          <div className="py-6 text-center text-fg-muted font-body text-sm">
            Nenhuma crise registrada ainda.
          </div>
        )}
      </Card>
    </div>
  );
}
