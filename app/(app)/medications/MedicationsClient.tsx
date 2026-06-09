"use client";

import React, { useState, useCallback } from "react";
import { MedStatusCard } from "@/app/components/MedStatusCard";
import { MedOverviewStrip } from "@/app/components/MedOverviewStrip";
import { MedForm } from "@/app/components/MedForm";
import { MedActionDrawer } from "@/app/components/MedActionDrawer";
import { EditMedForm } from "@/app/components/EditMedForm";
import { ScheduleForm } from "@/app/components/ScheduleForm";
import { StockDialog } from "@/app/components/StockDialog";
import { Button } from "@/app/components/Button";
import { useToast } from "@/app/components/Toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/app/components/ui/alert-dialog";
import { Pill, Plus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmtNum } from "@/lib/format";
import type { EnrichedMed } from "@/app/api/medications/enrich";

interface Props {
  initialMeds: EnrichedMed[];
  initialArchivedMeds: EnrichedMed[];
}

type StockMode = "restock" | "adjust";

// Make every space inside a single fact non-breaking, so the only places the
// subtitle is allowed to wrap are the " · " fact separators — never mid-phrase.
const nb = (s: string): string => s.replace(/ /g, " ");

// Format an ISO timestamp as a pt-BR date (dd/mm/yyyy) in the app's timezone,
// mirroring the report's formatDate so archive dates render consistently.
function fmtArchivedDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

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

export function MedicationsClient({ initialMeds, initialArchivedMeds }: Props) {
  const { show } = useToast();
  const [meds, setMeds] = useState<EnrichedMed[]>(initialMeds);
  const [archivedMeds, setArchivedMeds] = useState<EnrichedMed[]>(initialArchivedMeds);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<EnrichedMed | null>(null);
  const [selectedMed, setSelectedMed] = useState<EnrichedMed | null>(null);
  const [stockMode, setStockMode] = useState<StockMode>("restock");

  // Refresh both the active and archived lists so they stay consistent after
  // any add / archive / reactivate. Both lists are updated only when BOTH
  // fetches succeed, so a partial failure can never leave a med in both lists
  // (or neither) — they move atomically from the UI's perspective.
  const refreshAll = useCallback(async () => {
    try {
      const [activeRes, archivedRes] = await Promise.all([
        fetch("/api/medications"),
        fetch("/api/medications?archived=1"),
      ]);
      if (activeRes.ok && archivedRes.ok) {
        const [active, archived]: [EnrichedMed[], EnrichedMed[]] = await Promise.all([
          activeRes.json(),
          archivedRes.json(),
        ]);
        setMeds(active);
        setArchivedMeds(archived);
      }
    } catch {
      // silent — keep the last-known consistent lists on network failure
    }
  }, []);

  const refresh = refreshAll;

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

  function openEdit(med: EnrichedMed) {
    setSelectedMed(med);
    setEditOpen(true);
  }

  function openActions(med: EnrichedMed) {
    setSelectedMed(med);
    setActionOpen(true);
  }

  function openArchiveConfirm(med: EnrichedMed) {
    setArchiveTarget(med);
    setArchiveConfirmOpen(true);
  }

  async function doArchive() {
    // Capture the target before any await — the dialog closes (and state may
    // change) synchronously when the confirm button is pressed.
    const target = archiveTarget;
    if (!target) return;
    try {
      const res = await fetch(`/api/medications/${target.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao arquivar");
      show("Remédio arquivado", { variant: "success" });
      await refreshAll();
    } catch {
      show("Erro ao arquivar remédio", { variant: "error" });
    }
  }

  async function doReactivate(med: EnrichedMed) {
    try {
      const res = await fetch(`/api/medications/${med.id}/reactivate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Erro ao reativar");
      show("Remédio reativado", { variant: "success" });
      await refreshAll();
    } catch {
      show("Erro ao reativar remédio", { variant: "error" });
    }
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

        {/* Arquivados — collapsed by default, hidden entirely when empty. */}
        {archivedMeds.length > 0 && (
          <section className="mt-2">
            <button
              type="button"
              onClick={() => setArchivedOpen((o) => !o)}
              aria-expanded={archivedOpen}
              aria-controls="archived-meds-list"
              className="w-full min-h-11 flex items-center justify-between gap-2 py-2 px-1 text-left cursor-pointer font-body [-webkit-tap-highlight-color:transparent]"
            >
              <span className="text-sm font-semibold text-fg-muted">
                Arquivados ({archivedMeds.length})
              </span>
              <ChevronDown
                size={18}
                className={cn(
                  "text-fg-muted transition-transform duration-[160ms] ease-standard",
                  archivedOpen && "rotate-180"
                )}
              />
            </button>

            {archivedOpen && (
              <ul id="archived-meds-list" className="flex flex-col gap-2 mt-1 list-none m-0 p-0">
                {archivedMeds.map((med) => (
                  <li
                    key={med.id}
                    className="flex items-center justify-between gap-3 py-2.5 px-3 bg-bg rounded-md font-body"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-base font-semibold text-fg truncate">
                        {med.name}
                      </span>
                      <span className="text-xs text-fg-muted">
                        Descontinuado em {fmtArchivedDate(med.archivedAt)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => doReactivate(med)}
                      className="shrink-0 min-h-11"
                    >
                      Reativar
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      {/* Sheets */}
      <MedActionDrawer
        open={actionOpen}
        onClose={() => setActionOpen(false)}
        med={selectedMed}
        onRestock={openRestock}
        onAdjust={openAdjust}
        onSchedule={openSchedule}
        onEdit={openEdit}
        onArchive={openArchiveConfirm}
      />

      {/* Archive confirm — destructive AlertDialog driven by state. */}
      <AlertDialog open={archiveConfirmOpen} onOpenChange={setArchiveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {archiveTarget ? `Arquivar ${archiveTarget.name}?` : "Arquivar remédio?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              O histórico é mantido e você pode reativar depois. O agendamento atual será encerrado hoje.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-pill">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="rounded-pill"
              onClick={doArchive}
            >
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      <EditMedForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
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
