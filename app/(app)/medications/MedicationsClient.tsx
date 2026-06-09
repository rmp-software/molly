"use client";

import React, { useState, useCallback } from "react";
import { MedStatusCard } from "@/app/components/MedStatusCard";
import { MedOverviewStrip } from "@/app/components/MedOverviewStrip";
import { MedForm } from "@/app/components/MedForm";
import { MedActionDrawer } from "@/app/components/MedActionDrawer";
import { ScheduleForm } from "@/app/components/ScheduleForm";
import { StockDialog } from "@/app/components/StockDialog";
import { Button } from "@/app/components/Button";
import { Pill, Plus } from "lucide-react";
import { fmtNum } from "@/lib/format";
import type { EnrichedMed } from "@/app/api/medications/enrich";

interface Props {
  initialMeds: EnrichedMed[];
}

type StockMode = "restock" | "adjust";

// Make every space inside a single fact non-breaking, so the only places the
// subtitle is allowed to wrap are the " · " fact separators — never mid-phrase.
const nb = (s: string): string => s.replace(/ /g, " ");

// dose · times · mg/kg, assembled as discrete facts joined by a (breakable)
// " · ". Fits on one line at phone width; wraps cleanly between facts if it ever
// must. All info is always shown — never truncated.
function buildSubtitle(med: EnrichedMed): string {
  if (!med.activeSchedule) return nb("Sem agendamento ativo");
  const times = med.activeSchedule.doseTimes.length;
  const units = med.activeSchedule.unitsPerDose;

  const facts: string[] = [];
  facts.push(med.strengthMg ? `${fmtNum(units * med.strengthMg)} mg/dose` : `${fmtNum(units)} un`);
  facts.push(`${times}× ao dia`);
  if (med.mgPerKg != null) facts.push(`${fmtNum(med.mgPerKg)} mg/kg/dia`);

  return facts.map(nb).join(" · ");
}

export function MedicationsClient({ initialMeds }: Props) {
  const [meds, setMeds] = useState<EnrichedMed[]>(initialMeds);
  const [addOpen, setAddOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [selectedMed, setSelectedMed] = useState<EnrichedMed | null>(null);
  const [stockMode, setStockMode] = useState<StockMode>("restock");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/medications");
      if (res.ok) {
        const data: EnrichedMed[] = await res.json();
        setMeds(data);
      }
    } catch {
      // silent
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

  function openActions(med: EnrichedMed) {
    setSelectedMed(med);
    setActionOpen(true);
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
            return (
              <MedStatusCard
                key={med.id}
                name={med.name}
                dose={buildSubtitle(med)}
                daysRemaining={med.daysRemaining ?? 0}
                capacityDays={med.reorderLeadTimeDays + 14}
                status={med.status}
                chipIcon={<Pill size={18} />}
                onMenuClick={() => openActions(med)}
              />
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
      <MedActionDrawer
        open={actionOpen}
        onClose={() => setActionOpen(false)}
        med={selectedMed}
        onRestock={openRestock}
        onAdjust={openAdjust}
        onSchedule={openSchedule}
      />

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
