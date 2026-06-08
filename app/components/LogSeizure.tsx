"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Minus, Plus } from "lucide-react";
import { Button } from "@/app/components/Button";
import { Textarea } from "@/app/components/Input";
import { useToast } from "@/app/components/Toast";
import { cn } from "@/lib/cn";
import { fmtDuration } from "@/lib/format";
import {
  TYPE_OPTIONS,
  SEVERITY_OPTIONS,
  type SeizureType,
  type Severity,
} from "@/lib/seizure-types";

// --- Helper -----------------------------------------------------------------
function getNowLocalDatetimeValue(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = now.getFullYear();
  const mo = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  const h = pad(now.getHours());
  const mi = pad(now.getMinutes());
  return `${y}-${mo}-${d}T${h}:${mi}`;
}

const fieldLabel = "block text-[13px] font-semibold text-fg-2 font-body mb-2";
const chipBase =
  "rounded-pill font-semibold cursor-pointer font-body inline-flex items-center border-[1.5px] transition-all duration-150";
const chipSelected = "border-brand bg-brand-soft text-brand-press";
const chipUnselected = "border-border-strong bg-surface text-fg-2";

// --- Component Props --------------------------------------------------------
interface LogSeizureProps {
  open: boolean;
  onClose: () => void;
}

function getNowLocalDatetimeMax(): string {
  // Called post-mount only, so Date.now() is safe (no hydration drift)
  return getNowLocalDatetimeValue();
}

// --- LogSeizure -------------------------------------------------------------
export function LogSeizure({ open, onClose }: LogSeizureProps) {
  const router = useRouter();
  const { show } = useToast();

  // Form state
  const [occurredAt, setOccurredAt] = useState("");
  const [maxDatetime, setMaxDatetime] = useState("");
  const [durationSecs, setDurationSecs] = useState(0);
  const [type, setType] = useState<SeizureType | null>(null);
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [rescueGiven, setRescueGiven] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset form whenever sheet opens
  useEffect(() => {
    if (open) {
      const nowVal = getNowLocalDatetimeValue();
      setOccurredAt(nowVal);
      setMaxDatetime(getNowLocalDatetimeMax());
      setDurationSecs(0);
      setType(null);
      setSeverity(null);
      setRescueGiven(false);
      setNotes("");
      setLoading(false);
    }
  }, [open]);

  function decrementDuration() {
    setDurationSecs((s) => Math.max(0, s - 5));
  }

  function incrementDuration() {
    setDurationSecs((s) => s + 5);
  }

  async function handleSave() {
    if (!type) {
      show("Selecione o tipo da crise.", { variant: "error" });
      return;
    }

    if (!occurredAt) {
      show("Informe a data e hora da crise.", { variant: "error" });
      return;
    }

    // Convert datetime-local value to ISO string
    // datetime-local format: "YYYY-MM-DDTHH:MM" (local time)
    // We parse it as local time
    const localDate = new Date(occurredAt);
    if (isNaN(localDate.getTime())) {
      show("Data/hora inválida.", { variant: "error" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/seizures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occurredAt: localDate.toISOString(),
          type,
          durationSeconds: durationSecs > 0 ? durationSecs : undefined,
          severity: severity ?? undefined,
          rescueGiven,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Erro ao salvar");
      }

      show("Anotado. Você cuidou bem da Molly.", { variant: "success" });
      onClose();
      router.refresh();
    } catch (err) {
      show(
        err instanceof Error ? err.message : "Erro ao registrar crise.",
        { variant: "error" }
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col">
      {/* Lead copy */}
      <p className="mt-0 mb-[18px] text-sm text-fg-muted leading-normal font-body">
        Respire. Vou guardar tudo pra você — pode ajustar os detalhes depois.
      </p>

      {/* Time row */}
      <div className="flex items-center gap-2.5 py-3 px-3.5 mb-4 bg-bg rounded-md">
        <Clock size={18} className="text-brand" />
        <span className="text-[14.5px] text-fg font-medium font-body">Agora</span>
        <div className="ml-auto">
          <input
            type="datetime-local"
            aria-label="Data e hora da crise"
            value={occurredAt}
            max={maxDatetime || undefined}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="font-mono font-semibold text-fg bg-transparent border-none outline-none text-sm cursor-pointer"
          />
        </div>
      </div>

      {/* Duration stepper */}
      <label className={fieldLabel}>Duração</label>
      <div className="flex items-center gap-4 mb-[18px]">
        <button
          type="button"
          onClick={decrementDuration}
          aria-label="Menos 5 segundos"
          className="w-11 h-11 rounded-pill border-[1.5px] border-border-strong bg-surface text-fg cursor-pointer grid place-items-center shrink-0"
        >
          <Minus size={20} />
        </button>
        <div
          className={cn(
            "flex-1 text-center font-mono font-semibold text-[30px] [font-feature-settings:'tnum'_1]",
            durationSecs > 0 ? "text-fg" : "text-fg-muted"
          )}
        >
          {durationSecs > 0 ? fmtDuration(durationSecs) : "—"}
        </div>
        <button
          type="button"
          onClick={incrementDuration}
          aria-label="Mais 5 segundos"
          className="w-11 h-11 rounded-pill border-[1.5px] border-border-strong bg-surface text-fg cursor-pointer grid place-items-center shrink-0"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Type chips */}
      <label className={fieldLabel}>
        Tipo <span className="text-danger">*</span>
      </label>
      <div className="flex flex-wrap gap-2 mb-[18px]">
        {TYPE_OPTIONS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={type === t.id}
            onClick={() => setType(t.id)}
            className={cn(
              chipBase,
              "py-2.5 px-3.5 text-sm min-h-11",
              type === t.id ? chipSelected : chipUnselected
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Severity segmented control */}
      <label className={fieldLabel}>Intensidade</label>
      <div className="flex gap-1.5 mb-[18px] flex-wrap">
        {/* None option */}
        <button
          type="button"
          aria-pressed={severity === null}
          onClick={() => setSeverity(null)}
          className={cn(
            chipBase,
            "py-2 px-3 text-[13px] min-h-9",
            severity === null ? chipSelected : chipUnselected
          )}
        >
          Nenhuma
        </button>
        {SEVERITY_OPTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={severity === s.id}
            onClick={() => setSeverity(s.id)}
            className={cn(
              chipBase,
              "py-2 px-3 text-[13px] min-h-9",
              severity === s.id ? chipSelected : chipUnselected
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Rescue medication toggle */}
      <label className="flex items-center gap-3 py-3 px-3.5 bg-bg rounded-md mb-[18px] cursor-pointer font-body text-sm text-fg font-medium">
        <input
          type="checkbox"
          checked={rescueGiven}
          onChange={(e) => setRescueGiven(e.target.checked)}
          className="w-[18px] h-[18px] accent-brand shrink-0"
        />
        Medicação de resgate administrada
      </label>

      {/* Notes */}
      <div className="mb-6">
        <Textarea
          label="Observações"
          placeholder="Estava dormindo, se recuperou rápido…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2.5">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="primary"
          fullWidth
          loading={loading}
          onClick={handleSave}
        >
          Salvar registro
        </Button>
      </div>
    </div>
  );
}
