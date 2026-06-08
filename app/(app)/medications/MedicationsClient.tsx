"use client";

import React, { useState, useCallback } from "react";
import { MedStatusCard } from "@/app/components/MedStatusCard";
import { MedOverviewStrip } from "@/app/components/MedOverviewStrip";
import { MedForm } from "@/app/components/MedForm";
import { ScheduleForm } from "@/app/components/ScheduleForm";
import { StockDialog } from "@/app/components/StockDialog";
import { Button } from "@/app/components/Button";
import { Pill, Plus, Package, RefreshCw, Edit, Calendar, CalendarPlus } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmtNum } from "@/lib/format";
import type { EnrichedMed } from "@/app/api/medications/enrich";

interface Props {
  initialMeds: EnrichedMed[];
}

type StockMode = "restock" | "adjust";

function buildDoseLabel(med: EnrichedMed): string {
  if (!med.activeSchedule) return "Sem agendamento ativo";
  const times = med.activeSchedule.doseTimes.length;
  const units = med.activeSchedule.unitsPerDose;
  const unitsStr = fmtNum(units);
  const timesStr = `${times}× ao dia`;

  if (med.strengthMg) {
    const doseMg = units * med.strengthMg;
    return `${fmtNum(doseMg)} mg/dose · ${timesStr}`;
  }
  return `${unitsStr} un · ${timesStr}`;
}

function buildMgKgLabel(med: EnrichedMed): string | undefined {
  if (med.mgPerKg == null) return undefined;
  return `${fmtNum(med.mgPerKg)} mg/kg/dia`;
}

export function MedicationsClient({ initialMeds }: Props) {
  const [meds, setMeds] = useState<EnrichedMed[]>(initialMeds);
  const [addOpen, setAddOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [selectedMed, setSelectedMed] = useState<EnrichedMed | null>(null);
  const [stockMode, setStockMode] = useState<StockMode>("restock");
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/medications");
      if (res.ok) {
        const data: EnrichedMed[] = await res.json();
        setMeds(data);
      }
    } catch {
      // silent
    } finally {
      setRefreshing(false);
    }
  }, []);

  function openRestock(med: EnrichedMed) {
    setSelectedMed(med);
    setStockMode("restock");
    setStockOpen(true);
  }

  function openAdjust(med: EnrichedMed) {
    setSelectedMed(med);
    setStockMode("adjust");
    setStockOpen(true);
  }

  function openSchedule(med: EnrichedMed) {
    setSelectedMed(med);
    setScheduleOpen(true);
  }

  return (
    <div className="pt-1 pb-2">
      {/* Overview strip */}
      {meds.length > 0 && <MedOverviewStrip meds={meds} />}

      {/* Cards */}
      <div className="flex flex-col gap-3 px-[18px]">
        {meds.length === 0 ? (
          <div className="text-center py-12 px-5 text-fg-muted font-body text-base">
            <Pill size={40} className="text-border-strong block mx-auto mb-3" />
            <p className="mt-0 mb-1">Nenhum remédio ainda.</p>
            <p className="m-0 text-sm">
              Adicione o primeiro usando o botão abaixo.
            </p>
          </div>
        ) : (
          meds.map((med) => {
            const dose = buildDoseLabel(med);
            const mgKgLabel = buildMgKgLabel(med);
            const doseWithMgKg = mgKgLabel ? `${dose} · ${mgKgLabel}` : dose;

            return (
              <div key={med.id} className="flex flex-col gap-2">
                <MedStatusCard
                  name={med.name}
                  dose={doseWithMgKg}
                  daysRemaining={med.daysRemaining ?? 0}
                  capacityDays={med.reorderLeadTimeDays + 14}
                  status={med.status}
                  chipIcon={<Pill size={18} />}
                />

                {/* Action buttons */}
                <div
                  className={cn(
                    "flex gap-2 flex-wrap transition-opacity duration-200",
                    refreshing ? "opacity-50 pointer-events-none" : "opacity-100"
                  )}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Package size={14} />}
                    onClick={() => openRestock(med)}
                    disabled={refreshing}
                    className="flex-1 min-w-[100px] min-h-11"
                  >
                    Repor
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<RefreshCw size={14} />}
                    onClick={() => openAdjust(med)}
                    disabled={refreshing}
                    className="flex-1 min-w-[100px] min-h-11"
                  >
                    Corrigir
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Calendar size={14} />}
                    onClick={() => openSchedule(med)}
                    disabled={refreshing}
                    className="flex-[1_1_100%] min-h-11"
                  >
                    Agendamento
                  </Button>
                  {med.activeSchedule && (
                    <a
                      href={`/api/medications/${med.id}/calendar.ics`}
                      download
                      aria-label={`Adicionar ${med.name} ao Google Agenda (baixar .ics)`}
                      className="flex items-center justify-center gap-1.5 flex-[1_1_100%] min-h-11 py-[9px] px-3.5 text-sm font-body font-bold text-brand bg-surface border-[1.5px] border-border-strong rounded-pill no-underline cursor-pointer whitespace-nowrap"
                    >
                      <CalendarPlus size={14} />
                      Adicionar ao Google Agenda
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Add button */}
        <Button
          variant="primary"
          fullWidth
          icon={<Plus size={18} />}
          onClick={() => setAddOpen(true)}
          className={meds.length > 0 ? "mt-1" : "mt-0"}
        >
          Adicionar remédio
        </Button>
      </div>

      {/* Sheets */}
      <MedForm
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={refresh}
      />

      <ScheduleForm
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onSaved={refresh}
        med={selectedMed}
      />

      <StockDialog
        open={stockOpen}
        onClose={() => setStockOpen(false)}
        onSaved={refresh}
        med={selectedMed}
        mode={stockMode}
      />
    </div>
  );
}
