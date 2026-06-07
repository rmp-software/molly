"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Minus, Plus } from "lucide-react";
import { Button } from "@/app/components/Button";
import { Textarea } from "@/app/components/Input";
import { useToast } from "@/app/components/Toast";
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
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Lead copy */}
      <p
        style={{
          margin: "0 0 18px",
          fontSize: "var(--text-sm)",
          color: "var(--fg-muted)",
          lineHeight: 1.5,
          fontFamily: "var(--font-body)",
        }}
      >
        Respire. Vou guardar tudo pra você — pode ajustar os detalhes depois.
      </p>

      {/* Time row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 14px",
          marginBottom: "16px",
          background: "var(--bg)",
          borderRadius: "var(--radius-md)",
        }}
      >
        <Clock size={18} color="var(--brand)" />
        <span
          style={{
            fontSize: "14.5px",
            color: "var(--fg)",
            fontWeight: 500,
            fontFamily: "var(--font-body)",
          }}
        >
          Agora
        </span>
        <div style={{ marginLeft: "auto" }}>
          <input
            type="datetime-local"
            aria-label="Data e hora da crise"
            value={occurredAt}
            max={maxDatetime || undefined}
            onChange={(e) => setOccurredAt(e.target.value)}
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontWeight: 600,
              color: "var(--fg)",
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "14px",
              cursor: "pointer",
            }}
          />
        </div>
      </div>

      {/* Duration stepper */}
      <label
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--fg-2)",
          fontFamily: "var(--font-body)",
          marginBottom: "8px",
          display: "block",
        }}
      >
        Duração
      </label>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "18px",
        }}
      >
        <button
          type="button"
          onClick={decrementDuration}
          aria-label="Menos 5 segundos"
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "999px",
            border: "1.5px solid var(--border-strong)",
            background: "var(--surface)",
            color: "var(--fg)",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <Minus size={20} />
        </button>
        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontFamily: "var(--font-mono, monospace)",
            fontWeight: 600,
            fontSize: "30px",
            color: durationSecs > 0 ? "var(--fg)" : "var(--fg-muted)",
            fontFeatureSettings: '"tnum" 1',
          }}
        >
          {durationSecs > 0 ? fmtDuration(durationSecs) : "—"}
        </div>
        <button
          type="button"
          onClick={incrementDuration}
          aria-label="Mais 5 segundos"
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "999px",
            border: "1.5px solid var(--border-strong)",
            background: "var(--surface)",
            color: "var(--fg)",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Type chips */}
      <label
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--fg-2)",
          fontFamily: "var(--font-body)",
          marginBottom: "8px",
          display: "block",
        }}
      >
        Tipo <span style={{ color: "var(--danger)" }}>*</span>
      </label>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "18px",
        }}
      >
        {TYPE_OPTIONS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={type === t.id}
            onClick={() => setType(t.id)}
            style={{
              padding: "10px 14px",
              borderRadius: "999px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              minHeight: "44px",
              display: "inline-flex",
              alignItems: "center",
              border: "1.5px solid",
              borderColor: type === t.id ? "var(--brand)" : "var(--border-strong)",
              background:
                type === t.id ? "var(--brand-soft, #ede9fe)" : "var(--surface)",
              color:
                type === t.id ? "var(--brand-press, var(--brand))" : "var(--fg-2)",
              transition: "all 0.15s ease",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Severity segmented control */}
      <label
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--fg-2)",
          fontFamily: "var(--font-body)",
          marginBottom: "8px",
          display: "block",
        }}
      >
        Intensidade
      </label>
      <div
        style={{
          display: "flex",
          gap: "6px",
          marginBottom: "18px",
          flexWrap: "wrap",
        }}
      >
        {/* None option */}
        <button
          type="button"
          aria-pressed={severity === null}
          onClick={() => setSeverity(null)}
          style={{
            padding: "8px 12px",
            borderRadius: "999px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            minHeight: "36px",
            display: "inline-flex",
            alignItems: "center",
            border: "1.5px solid",
            borderColor: severity === null ? "var(--brand)" : "var(--border-strong)",
            background: severity === null ? "var(--brand-soft, #ede9fe)" : "var(--surface)",
            color:
              severity === null
                ? "var(--brand-press, var(--brand))"
                : "var(--fg-2)",
            transition: "all 0.15s ease",
          }}
        >
          Nenhuma
        </button>
        {SEVERITY_OPTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={severity === s.id}
            onClick={() => setSeverity(s.id)}
            style={{
              padding: "8px 12px",
              borderRadius: "999px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              minHeight: "36px",
              display: "inline-flex",
              alignItems: "center",
              border: "1.5px solid",
              borderColor:
                severity === s.id ? "var(--brand)" : "var(--border-strong)",
              background:
                severity === s.id ? "var(--brand-soft, #ede9fe)" : "var(--surface)",
              color:
                severity === s.id
                  ? "var(--brand-press, var(--brand))"
                  : "var(--fg-2)",
              transition: "all 0.15s ease",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Rescue medication toggle */}
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 14px",
          background: "var(--bg)",
          borderRadius: "var(--radius-md)",
          marginBottom: "18px",
          cursor: "pointer",
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-sm)",
          color: "var(--fg)",
          fontWeight: 500,
        }}
      >
        <input
          type="checkbox"
          checked={rescueGiven}
          onChange={(e) => setRescueGiven(e.target.checked)}
          style={{ width: "18px", height: "18px", accentColor: "var(--brand)", flexShrink: 0 }}
        />
        Medicação de resgate administrada
      </label>

      {/* Notes */}
      <div style={{ marginBottom: "24px" }}>
        <Textarea
          label="Observações"
          placeholder="Estava dormindo, se recuperou rápido…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: "10px" }}>
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
