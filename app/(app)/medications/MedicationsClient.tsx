"use client";

import React, { useState, useCallback } from "react";
import { MedStatusCard } from "@/app/components/MedStatusCard";
import { MedOverviewStrip } from "@/app/components/MedOverviewStrip";
import { MedForm } from "@/app/components/MedForm";
import { ScheduleForm } from "@/app/components/ScheduleForm";
import { StockDialog } from "@/app/components/StockDialog";
import { Button } from "@/app/components/Button";
import { Pill, Plus, Package, RefreshCw, Edit, Calendar, CalendarPlus } from "lucide-react";
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

  return (
    <div style={{ padding: "4px 0 8px" }}>
      {/* Overview strip */}
      {meds.length > 0 && <MedOverviewStrip meds={meds} />}

      {/* Cards */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          padding: "0 18px",
        }}
      >
        {meds.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px 20px",
              color: "var(--fg-muted)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-base)",
            }}
          >
            <Pill
              size={40}
              style={{ color: "var(--border-strong)", marginBottom: "12px" }}
            />
            <p style={{ margin: "0 0 4px" }}>Nenhum remédio ainda.</p>
            <p style={{ margin: 0, fontSize: "var(--text-sm)" }}>
              Adicione o primeiro usando o botão abaixo.
            </p>
          </div>
        ) : (
          meds.map((med) => {
            const dose = buildDoseLabel(med);
            const mgKgLabel = buildMgKgLabel(med);
            const doseWithMgKg = mgKgLabel ? `${dose} · ${mgKgLabel}` : dose;

            return (
              <div key={med.id} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Package size={14} />}
                    onClick={() => openRestock(med)}
                    style={{ flex: 1, minWidth: "100px" }}
                  >
                    Repor
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<RefreshCw size={14} />}
                    onClick={() => openAdjust(med)}
                    style={{ flex: 1, minWidth: "100px" }}
                  >
                    Corrigir
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Calendar size={14} />}
                    onClick={() => openSchedule(med)}
                    style={{ flex: 1, minWidth: "140px" }}
                  >
                    Agendamento
                  </Button>
                  {med.activeSchedule && (
                    <a
                      href={`/api/medications/${med.id}/calendar.ics`}
                      download
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flex: 1,
                        minWidth: "140px",
                        padding: "0 12px",
                        minHeight: "36px",
                        fontSize: "var(--text-sm)",
                        fontFamily: "var(--font-body)",
                        fontWeight: "var(--fw-medium)" as unknown as number,
                        color: "var(--fg-2)",
                        background: "var(--surface-raised)",
                        border: "1.5px solid var(--border-strong)",
                        borderRadius: "var(--radius-md)",
                        textDecoration: "none",
                        cursor: "pointer",
                        justifyContent: "center",
                        whiteSpace: "nowrap",
                      }}
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
          style={{ marginTop: meds.length > 0 ? "4px" : "0" }}
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
