"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Card } from "@/app/components/Card";
import { Button } from "@/app/components/Button";
import { Input, Textarea } from "@/app/components/Input";
import { useToast } from "@/app/components/Toast";
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

  // Delete confirm state (two-tap pattern)
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      return;
    }
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
    <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Badges row */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {isEmergency && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "4px 12px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 700,
              fontFamily: "var(--font-body)",
              background: "var(--danger-soft, #fee2e2)",
              color: "var(--danger, #dc2626)",
              border: "1px solid var(--red-200, #fecaca)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Emergência
          </span>
        )}
        {episode.isCluster && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "4px 12px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 700,
              fontFamily: "var(--font-body)",
              background: "var(--warning-soft, #fef3c7)",
              color: "var(--warning, #d97706)",
              border: "1px solid var(--amber-300, #fcd34d)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Cluster
          </span>
        )}
      </div>

      {/* Detail card */}
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
        <div style={{ display: "flex", gap: "10px" }}>
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
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-lg)",
                fontWeight: 700,
                color: "var(--fg)",
              }}
            >
              Editar episódio
            </h3>

            {/* DateTime */}
            <Input
              type="datetime-local"
              label="Data e hora"
              aria-label="Data e hora da crise"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
            />

            {/* Duration */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  color: "var(--fg-2)",
                  marginBottom: "8px",
                  fontFamily: "var(--font-body)",
                }}
              >
                Duração
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setDurationSecs((s) => Math.max(0, s - 5))}
                  aria-label="Menos 5 segundos"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "999px",
                    border: "1.5px solid var(--border-strong)",
                    background: "var(--surface)",
                    color: "var(--fg)",
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    fontSize: "20px",
                  }}
                >
                  −
                </button>
                <span
                  style={{
                    flex: 1,
                    textAlign: "center",
                    fontFamily: "var(--font-mono, monospace)",
                    fontWeight: 600,
                    fontSize: "22px",
                    color: durationSecs > 0 ? "var(--fg)" : "var(--fg-muted)",
                  }}
                >
                  {durationSecs > 0 ? fmtDuration(durationSecs) : "—"}
                </span>
                <button
                  type="button"
                  onClick={() => setDurationSecs((s) => s + 5)}
                  aria-label="Mais 5 segundos"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "999px",
                    border: "1.5px solid var(--border-strong)",
                    background: "var(--surface)",
                    color: "var(--fg)",
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    fontSize: "20px",
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Type chips */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  color: "var(--fg-2)",
                  marginBottom: "8px",
                  fontFamily: "var(--font-body)",
                }}
              >
                Tipo
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {TYPE_OPTIONS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={type === t.id}
                    onClick={() => setType(t.id)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "999px",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "var(--font-body)",
                      minHeight: "40px",
                      display: "inline-flex",
                      alignItems: "center",
                      border: "1.5px solid",
                      borderColor:
                        type === t.id ? "var(--brand)" : "var(--border-strong)",
                      background:
                        type === t.id
                          ? "var(--brand-soft, #ede9fe)"
                          : "var(--surface)",
                      color:
                        type === t.id
                          ? "var(--brand-press, var(--brand))"
                          : "var(--fg-2)",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  color: "var(--fg-2)",
                  marginBottom: "8px",
                  fontFamily: "var(--font-body)",
                }}
              >
                Intensidade
              </label>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  aria-pressed={severity === null}
                  onClick={() => setSeverity(null)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "999px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    border: "1.5px solid",
                    borderColor:
                      severity === null ? "var(--brand)" : "var(--border-strong)",
                    background:
                      severity === null
                        ? "var(--brand-soft, #ede9fe)"
                        : "var(--surface)",
                    color:
                      severity === null
                        ? "var(--brand-press, var(--brand))"
                        : "var(--fg-2)",
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
                      padding: "6px 12px",
                      borderRadius: "999px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "var(--font-body)",
                      border: "1.5px solid",
                      borderColor:
                        severity === s.id ? "var(--brand)" : "var(--border-strong)",
                      background:
                        severity === s.id
                          ? "var(--brand-soft, #ede9fe)"
                          : "var(--surface)",
                      color:
                        severity === s.id
                          ? "var(--brand-press, var(--brand))"
                          : "var(--fg-2)",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rescue */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
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
                style={{
                  width: "18px",
                  height: "18px",
                  accentColor: "var(--brand)",
                  flexShrink: 0,
                }}
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
            <div style={{ display: "flex", gap: "10px" }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <span
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--fg-muted)",
          fontFamily: "var(--font-body)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "var(--text-base)",
          color: "var(--fg)",
          fontFamily: "var(--font-body)",
        }}
      >
        {value}
      </span>
    </div>
  );
}
