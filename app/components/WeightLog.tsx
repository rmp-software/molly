"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Card } from "@/app/components/Card";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";
import { useToast } from "@/app/components/Toast";
import { fmtKg } from "@/lib/format";

export interface WeightEntry {
  id: string;
  measuredOn: string; // "YYYY-MM-DD"
  weightKg: number;
}

interface Props {
  initialEntries: WeightEntry[];
}

function fmtDatePtBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

// Tiny SVG sparkline for weight trend
function Sparkline({ entries }: { entries: WeightEntry[] }) {
  if (entries.length < 2) return null;

  const sorted = [...entries].sort((a, b) =>
    a.measuredOn.localeCompare(b.measuredOn)
  );
  const values = sorted.map((e) => e.weightKg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const W = 120;
  const H = 36;
  const padX = 4;
  const padY = 4;
  const plotW = W - padX * 2;
  const plotH = H - padY * 2;

  const pts = sorted.map((e, i) => {
    const x = padX + (i / (sorted.length - 1)) * plotW;
    const y = padY + plotH - ((e.weightKg - min) / range) * plotH;
    return { x, y, id: e.id };
  });

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      <polyline
        points={polyline}
        fill="none"
        stroke="var(--brand)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {pts.map((p) => (
        <circle
          key={p.id}
          cx={p.x}
          cy={p.y}
          r={2.5}
          fill="var(--brand)"
          opacity={0.85}
        />
      ))}
    </svg>
  );
}

export function WeightLog({ initialEntries }: Props) {
  const router = useRouter();
  const { show } = useToast();
  const [entries, setEntries] = useState<WeightEntry[]>(initialEntries);
  const [dateVal, setDateVal] = useState("");
  const [kgVal, setKgVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const deleteConfirmTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Only set today's date on the client (avoid SSR mismatch)
  useEffect(() => {
    setDateVal(getTodayIso());
  }, []);

  // Clear delete-confirm timer on unmount to avoid state updates on unmounted component
  useEffect(() => () => { if (deleteConfirmTimerRef.current) clearTimeout(deleteConfirmTimerRef.current); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const kg = parseFloat(kgVal.replace(",", "."));
    if (!dateVal || isNaN(kg) || kg <= 0) {
      show("Preencha a data e o peso (positivo).", { variant: "error" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ measuredOn: dateVal, weightKg: kg }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Erro ao registrar");
      }
      const created: WeightEntry = await res.json();
      setEntries((prev) => [created, ...prev]);
      setKgVal("");
      setDateVal(getTodayIso());
      show("Peso registrado", { variant: "success" });
      router.refresh();
    } catch (err) {
      show(
        err instanceof Error ? err.message : "Erro ao registrar",
        { variant: "error" }
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      // Auto-reset confirm after 4 s if user doesn't confirm
      if (deleteConfirmTimerRef.current) clearTimeout(deleteConfirmTimerRef.current);
      deleteConfirmTimerRef.current = setTimeout(() => setDeleteConfirm(null), 4000);
      return;
    }
    if (deleteConfirmTimerRef.current) clearTimeout(deleteConfirmTimerRef.current);
    setDeleteConfirm(null);
    try {
      const res = await fetch(`/api/weight/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover");
      setEntries((prev) => prev.filter((e) => e.id !== id));
      show("Removido", { variant: "success" });
      router.refresh();
    } catch {
      show("Erro ao remover", { variant: "error" });
    }
  }

  return (
    <Card>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Header with sparkline */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: "var(--fw-semibold)" as unknown as number,
              fontSize: "var(--text-base)",
              color: "var(--fg)",
            }}
          >
            Histórico de peso
          </span>
          {entries.length >= 2 && <Sparkline entries={entries} />}
        </div>

        {/* Entry list */}
        {entries.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {entries.map((entry) => (
              <div
                key={entry.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  background: "var(--bg)",
                  borderRadius: "var(--radius-md)",
                  fontFamily: "var(--font-body)",
                }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: "2px" }}
                >
                  <span
                    style={{
                      fontSize: "var(--text-base)",
                      fontWeight: "var(--fw-semibold)" as unknown as number,
                      color: "var(--fg)",
                    }}
                  >
                    {fmtKg(entry.weightKg)}
                  </span>
                  <span
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--fg-muted)",
                    }}
                  >
                    {fmtDatePtBR(entry.measuredOn)}
                  </span>
                </div>
                <Button
                  variant={deleteConfirm === entry.id ? "destructive" : "ghost"}
                  size="sm"
                  iconOnly
                  icon={<Trash2 size={16} />}
                  aria-label={
                    deleteConfirm === entry.id
                      ? "Confirmar remoção"
                      : "Remover peso"
                  }
                  onClick={() => handleDelete(entry.id)}
                  title={
                    deleteConfirm === entry.id
                      ? "Clique novamente para confirmar"
                      : "Remover"
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <p
            style={{
              color: "var(--fg-muted)",
              fontSize: "var(--text-sm)",
              fontFamily: "var(--font-body)",
              margin: 0,
            }}
          >
            Nenhum peso registrado.
          </p>
        )}

        {/* Add form */}
        <form
          onSubmit={handleAdd}
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ flex: 1 }}>
              <Input
                type="date"
                label="Data"
                value={dateVal}
                onChange={(e) => setDateVal(e.target.value)}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <Input
                type="text"
                inputMode="decimal"
                label="Peso (kg)"
                placeholder="29,4"
                value={kgVal}
                onChange={(e) => setKgVal(e.target.value)}
                required
              />
            </div>
          </div>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            fullWidth
            loading={loading}
          >
            Adicionar peso
          </Button>
        </form>
      </div>
    </Card>
  );
}
