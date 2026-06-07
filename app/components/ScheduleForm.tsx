"use client";

import React, { useState, useEffect } from "react";
import { Sheet } from "@/app/components/Sheet";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";
import { useToast } from "@/app/components/Toast";
import { Plus, X } from "lucide-react";
import type { EnrichedMed } from "@/app/api/medications/enrich";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  med: EnrichedMed | null;
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "var(--text-sm)",
  fontWeight: "var(--fw-semibold)" as unknown as number,
  color: "var(--fg-2)",
  marginBottom: "6px",
  fontFamily: "var(--font-body)",
};

const selectStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  minHeight: "48px",
  padding: "12px 14px",
  fontSize: "var(--text-base)",
  fontFamily: "var(--font-body)",
  color: "var(--fg)",
  background: "var(--surface)",
  border: "1.5px solid var(--border-strong)",
  borderRadius: "var(--radius-md)",
  outline: "none",
  boxSizing: "border-box",
};

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
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p
            style={{
              margin: 0,
              fontSize: "var(--text-sm)",
              color: "var(--fg-muted)",
              fontFamily: "var(--font-body)",
            }}
          >
            Remédio: <strong style={{ color: "var(--fg)" }}>{med.name}</strong>
          </p>

          {/* Horários */}
          <div>
            <label style={labelStyle}>Horários de dose</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {doseTimes.map((t, idx) => (
                <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="time"
                    value={t}
                    onChange={(e) => updateTime(idx, e.target.value)}
                    style={{
                      ...selectStyle,
                      flex: 1,
                      minHeight: "44px",
                      padding: "10px 12px",
                    }}
                  />
                  {doseTimes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTime(idx)}
                      aria-label="Remover horário"
                      style={{
                        background: "var(--danger-soft)",
                        border: "none",
                        borderRadius: "var(--radius-md)",
                        color: "var(--danger)",
                        width: "44px",
                        height: "44px",
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                        flex: "none",
                      }}
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
            <label style={labelStyle}>A partir de</label>
            <input
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              style={{ ...selectStyle, minHeight: "44px" }}
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
