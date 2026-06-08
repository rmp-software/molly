"use client";

import React, { useState, useEffect } from "react";
import { Sheet } from "@/app/components/Sheet";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";
import { useToast } from "@/app/components/Toast";
import { cn } from "@/lib/cn";
import { Plus, X } from "lucide-react";
import type { EnrichedMed } from "@/app/api/medications/enrich";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  med: EnrichedMed | null;
}

const labelCls = "block text-sm font-semibold text-fg-2 mb-1.5 font-body";

const fieldBase =
  "block w-full max-w-full min-w-0 text-base font-body text-fg bg-surface " +
  "border-[1.5px] border-border-strong rounded-md outline-none";

export function ScheduleForm({ open, onClose, onSaved, med }: Props) {
  const toast = useToast();

  const [doseTimes, setDoseTimes] = useState<string[]>(["08:00"]);
  const [unitsPerDose, setUnitsPerDose] = useState("1");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [loading, setLoading] = useState(false);

  // Pre-fill from current schedule when med changes or sheet is (re)opened
  useEffect(() => {
    if (!open) return;
    if (med?.activeSchedule) {
      setDoseTimes([...med.activeSchedule.doseTimes]);
      setUnitsPerDose(String(med.activeSchedule.unitsPerDose).replace(".", ","));
    } else {
      setDoseTimes(["08:00"]);
      setUnitsPerDose("1");
    }
    setEffectiveFrom(new Date().toISOString().slice(0, 10));
  }, [med, open]);

  function addTime() {
    setDoseTimes((prev) => [...prev, "08:00"]);
  }

  function removeTime(idx: number) {
    setDoseTimes((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateTime(idx: number, val: string) {
    setDoseTimes((prev) => prev.map((t, i) => (i === idx ? val : t)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!med) return;

    if (doseTimes.length === 0) {
      toast.show("Adicione pelo menos um horário", { variant: "error" });
      return;
    }

    const unitsNum = Number(unitsPerDose.replace(",", "."));
    if (!Number.isFinite(unitsNum) || unitsNum <= 0) {
      toast.show("Unidades por dose deve ser > 0", { variant: "error" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/medications/${med.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doseTimes,
          unitsPerDose: unitsNum,
          effectiveFrom: effectiveFrom || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        toast.show(err.error ?? "Erro ao salvar agendamento", { variant: "error" });
        return;
      }

      toast.show(
        "Agendamento atualizado. Atualize o evento no Google Agenda (remova o antigo e adicione o novo).",
        { variant: "success", duration: 6000 }
      );
      onSaved();
      onClose();
    } catch {
      toast.show("Erro ao salvar agendamento", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Editar agendamento">
      {med && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="m-0 text-sm text-fg-muted font-body">
            Remédio: <strong className="text-fg">{med.name}</strong>
          </p>

          {/* Horários */}
          <div>
            <label className={labelCls}>Horários de dose</label>
            <div className="flex flex-col gap-2">
              {doseTimes.map((t, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="time"
                    value={t}
                    onChange={(e) => updateTime(idx, e.target.value)}
                    className={cn(fieldBase, "flex-1 min-h-11 py-2.5 px-3")}
                  />
                  {doseTimes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTime(idx)}
                      aria-label="Remover horário"
                      className="bg-danger-soft border-none rounded-md text-danger w-11 h-11 grid place-items-center cursor-pointer flex-none"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Plus size={15} />}
                onClick={addTime}
              >
                Adicionar horário
              </Button>
            </div>
          </div>

          {/* Unidades por dose */}
          <Input
            label="Unidades por dose"
            placeholder="Ex: 0,5 ou 1"
            inputMode="decimal"
            value={unitsPerDose}
            onChange={(e) => setUnitsPerDose(e.target.value)}
          />

          {/* A partir de */}
          <div>
            <label className={labelCls}>A partir de</label>
            <input
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              className={cn(fieldBase, "min-h-11 px-3.5 py-3")}
            />
          </div>

          <Button type="submit" fullWidth loading={loading}>
            Salvar agendamento
          </Button>
        </form>
      )}
    </Sheet>
  );
}
