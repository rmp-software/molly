"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Card } from "@/app/components/Card";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";
import { useToast } from "@/app/components/Toast";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/app/components/ui/alert-dialog";
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
      className="block flex-none"
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

  // Only set today's date on the client (avoid SSR mismatch)
  useEffect(() => {
    setDateVal(getTodayIso());
  }, []);

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

  async function doDelete(id: string) {
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
      <div className="flex flex-col gap-4">
        {/* Header with sparkline */}
        <div className="flex items-center justify-between">
          <span className="font-body font-semibold text-base text-fg">
            Histórico de peso
          </span>
          {entries.length >= 2 && <Sparkline entries={entries} />}
        </div>

        {/* Entry list */}
        {entries.length > 0 ? (
          <div className="flex flex-col gap-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between py-2.5 px-3 bg-bg rounded-md font-body"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-base font-semibold text-fg">
                    {fmtKg(entry.weightKg)}
                  </span>
                  <span className="text-xs text-fg-muted">
                    {fmtDatePtBR(entry.measuredOn)}
                  </span>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      icon={<Trash2 size={16} />}
                      aria-label="Remover peso"
                      title="Remover"
                    />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover este peso?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {fmtKg(entry.weightKg)} · {fmtDatePtBR(entry.measuredOn)}. Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-pill">Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        className="rounded-pill"
                        onClick={() => doDelete(entry.id)}
                      >
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-fg-muted text-sm font-body m-0">
            Nenhum peso registrado.
          </p>
        )}

        {/* Add form */}
        <form onSubmit={handleAdd} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex-1 min-w-0">
              <Input
                type="date"
                label="Data"
                value={dateVal}
                onChange={(e) => setDateVal(e.target.value)}
                required
              />
            </div>
            <div className="flex-1 min-w-0">
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
