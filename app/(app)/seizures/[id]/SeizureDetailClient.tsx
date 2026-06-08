"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Minus, Plus } from "lucide-react";
import { Card } from "@/app/components/Card";
import { Button } from "@/app/components/Button";
import { Input, Textarea } from "@/app/components/Input";
import { useToast } from "@/app/components/Toast";
import { cn } from "@/lib/cn";
import { fmtDuration, fmtDateTimePt } from "@/lib/format";
import {
  TYPE_OPTIONS,
  SEVERITY_OPTIONS,
  typeLabelPt,
  type SeizureType,
  type Severity,
} from "@/lib/seizure-types";

export interface SeizureEpisodeData {
  id: string;
  occurredAt: string; // ISO string
  type: SeizureType;
  durationSeconds: number | null;
  severity: Severity | null;
  isCluster: boolean;
  rescueGiven: boolean;
  notes: string | null;
}

interface Props {
  episode: SeizureEpisodeData;
}

const fieldLabel = "block text-sm font-semibold text-fg-2 mb-2 font-body";
const chipBase =
  "rounded-pill font-semibold cursor-pointer font-body inline-flex items-center border-[1.5px]";
const chipSelected = "border-brand bg-brand-soft text-brand-press";
const chipUnselected = "border-border-strong bg-surface text-fg-2";
const stepperBtn =
  "w-10 h-10 rounded-pill border-[1.5px] border-border-strong bg-surface text-fg cursor-pointer grid place-items-center shrink-0";
const badgeBase =
  "inline-flex items-center py-1 px-3 rounded-pill text-xs font-bold font-body border uppercase tracking-wide";

function severityLabelPt(severity: Severity | null): string {
  if (!severity) return "—";
  return SEVERITY_OPTIONS.find((s) => s.id === severity)?.label ?? severity;
}

// Convert ISO to datetime-local value (local time via "America/Sao_Paulo" TZ)
function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  // Use local time from the browser
  const y = d.getFullYear();
  const mo = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${y}-${mo}-${day}T${h}:${mi}`;
}

export function SeizureDetailClient({ episode }: Props) {
  const router = useRouter();
  const { show } = useToast();

  // Edit form state
  const [editing, setEditing] = useState(false);
  const [occurredAt, setOccurredAt] = useState(isoToDatetimeLocal(episode.occurredAt));
  const [type, setType] = useState<SeizureType>(episode.type);
  const [durationSecs, setDurationSecs] = useState(episode.durationSeconds ?? 0);
  const [severity, setSeverity] = useState<Severity | null>(episode.severity);
  const [rescueGiven, setRescueGiven] = useState(episode.rescueGiven);
  const [notes, setNotes] = useState(episode.notes ?? "");
  const [saving, setSaving] = useState(false);

  // Max datetime for the picker — set post-mount to avoid hydration drift
  const [maxDatetime, setMaxDatetime] = useState("");
  useEffect(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const y = now.getFullYear();
    const mo = pad(now.getMonth() + 1);
    const d = pad(now.getDate());
    const h = pad(now.getHours());
    const mi = pad(now.getMinutes());
    setMaxDatetime(`${y}-${mo}-${d}T${h}:${mi}`);
  }, []);

  // Delete confirm state (two-tap pattern)
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteConfirmTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear delete-confirm timer on unmount to avoid state updates on unmounted component
  useEffect(() => () => { if (deleteConfirmTimerRef.current) clearTimeout(deleteConfirmTimerRef.current); }, []);

  const occurredAtDate = new Date(episode.occurredAt);
  const isEmergency =
    episode.durationSeconds !== null && episode.durationSeconds > 300;

  async function handleSave() {
    const localDate = new Date(occurredAt);
    if (isNaN(localDate.getTime())) {
      show("Data/hora inválida.", { variant: "error" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/seizures/${episode.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occurredAt: localDate.toISOString(),
          type,
          durationSeconds: durationSecs > 0 ? durationSecs : null,
          severity: severity ?? null,
          rescueGiven,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Erro ao salvar");
      }

      show("Alterações salvas.", { variant: "success" });
      setEditing(false);
      router.refresh();
    } catch (err) {
      show(
        err instanceof Error ? err.message : "Erro ao salvar alterações.",
        { variant: "error" }
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      // Auto-reset confirm after 4 s if user doesn't confirm
      if (deleteConfirmTimerRef.current) clearTimeout(deleteConfirmTimerRef.current);
      deleteConfirmTimerRef.current = setTimeout(() => setDeleteConfirm(false), 4000);
      return;
    }
    if (deleteConfirmTimerRef.current) clearTimeout(deleteConfirmTimerRef.current);
    setDeleteConfirm(false);
    setDeleting(true);
    try {
      const res = await fetch(`/api/seizures/${episode.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao remover episódio.");
      show("Episódio removido.", { variant: "success" });
      router.push("/");
    } catch (err) {
      show(
        err instanceof Error ? err.message : "Erro ao remover episódio.",
        { variant: "error" }
      );
      setDeleting(false);
    }
  }

  return (
    <div className="px-5 flex flex-col gap-4">
      {/* Badges row */}
      <div className="flex gap-2 flex-wrap">
        {isEmergency && (
          <span className={cn(badgeBase, "bg-danger-soft text-danger border-[var(--red-200)]")}>
            Emergência
          </span>
        )}
        {episode.isCluster && (
          <span className={cn(badgeBase, "bg-warning-soft text-warning border-[var(--amber-300)]")}>
            Cluster
          </span>
        )}
      </div>

      {/* Detail card */}
      <Card>
        <div className="flex flex-col gap-3">
          <Detail label="Data/hora" value={fmtDateTimePt(occurredAtDate)} />
          <Detail label="Tipo" value={typeLabelPt(episode.type)} />
          <Detail
            label="Duração"
            value={
              episode.durationSeconds !== null && episode.durationSeconds > 0
                ? fmtDuration(episode.durationSeconds)
                : "—"
            }
          />
          <Detail label="Intensidade" value={severityLabelPt(episode.severity)} />
          <Detail
            label="Medicação de resgate"
            value={episode.rescueGiven ? "Sim" : "Não"}
          />
          {episode.notes && <Detail label="Observações" value={episode.notes} />}
        </div>
      </Card>

      {/* Edit / Delete buttons */}
      {!editing && (
        <div className="flex gap-2.5">
          <Button
            variant="secondary"
            onClick={() => {
              setOccurredAt(isoToDatetimeLocal(episode.occurredAt));
              setType(episode.type);
              setDurationSecs(episode.durationSeconds ?? 0);
              setSeverity(episode.severity);
              setRescueGiven(episode.rescueGiven);
              setNotes(episode.notes ?? "");
              setDeleteConfirm(false);
              setEditing(true);
            }}
          >
            Editar
          </Button>
          <Button
            variant={deleteConfirm ? "destructive" : "ghost"}
            icon={<Trash2 size={16} />}
            loading={deleting}
            onClick={handleDelete}
            title={deleteConfirm ? "Clique para confirmar exclusão" : "Excluir episódio"}
          >
            {deleteConfirm ? "Confirmar exclusão" : "Excluir"}
          </Button>
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <Card>
          <div className="flex flex-col gap-4">
            <h3 className="m-0 font-display text-lg font-bold text-fg">
              Editar episódio
            </h3>

            {/* DateTime */}
            <Input
              type="datetime-local"
              label="Data e hora"
              aria-label="Data e hora da crise"
              value={occurredAt}
              max={maxDatetime || undefined}
              onChange={(e) => setOccurredAt(e.target.value)}
            />

            {/* Duration */}
            <div>
              <label className={fieldLabel}>Duração</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDurationSecs((s) => Math.max(0, s - 5))}
                  aria-label="Menos 5 segundos"
                  className={stepperBtn}
                >
                  <Minus size={18} />
                </button>
                <span
                  className={cn(
                    "flex-1 text-center font-mono font-semibold text-xl",
                    durationSecs > 0 ? "text-fg" : "text-fg-muted"
                  )}
                >
                  {durationSecs > 0 ? fmtDuration(durationSecs) : "—"}
                </span>
                <button
                  type="button"
                  onClick={() => setDurationSecs((s) => s + 5)}
                  aria-label="Mais 5 segundos"
                  className={stepperBtn}
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Type chips */}
            <div>
              <label className={fieldLabel}>Tipo</label>
              <div className="flex flex-wrap gap-2">
                {TYPE_OPTIONS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={type === t.id}
                    onClick={() => setType(t.id)}
                    className={cn(
                      chipBase,
                      "py-2 px-3.5 text-sm min-h-10",
                      type === t.id ? chipSelected : chipUnselected
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity */}
            <div>
              <label className={fieldLabel}>Intensidade</label>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  aria-pressed={severity === null}
                  onClick={() => setSeverity(null)}
                  className={cn(
                    chipBase,
                    "py-1.5 px-3 text-[13px]",
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
                      "py-1.5 px-3 text-[13px]",
                      severity === s.id ? chipSelected : chipUnselected
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rescue */}
            <label className="flex items-center gap-3 cursor-pointer font-body text-sm text-fg font-medium">
              <input
                type="checkbox"
                checked={rescueGiven}
                onChange={(e) => setRescueGiven(e.target.checked)}
                className="w-[18px] h-[18px] accent-brand shrink-0"
              />
              Medicação de resgate administrada
            </label>

            {/* Notes */}
            <Textarea
              label="Observações"
              placeholder="Estava dormindo, se recuperou rápido…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />

            {/* Form buttons */}
            <div className="flex gap-2.5">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                fullWidth
                loading={saving}
                onClick={handleSave}
              >
                Salvar alterações
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// Small helper for detail row
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-fg-muted font-body font-semibold uppercase tracking-[0.05em]">
        {label}
      </span>
      <span className="text-base text-fg font-body">{value}</span>
    </div>
  );
}
