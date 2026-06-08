"use client";

import React, { useState, useEffect } from "react";
import { Sheet } from "@/app/components/Sheet";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";
import { useToast } from "@/app/components/Toast";
import { fmtNum } from "@/lib/format";
import type { EnrichedMed } from "@/app/api/medications/enrich";

type Mode = "restock" | "adjust";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  med: EnrichedMed | null;
  mode: Mode;
}

const labelCls = "block text-sm font-semibold text-fg-2 mb-1.5 font-body";

export function StockDialog({ open, onClose, onSaved, med, mode }: Props) {
  const toast = useToast();
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setQuantity("");
  }, [open, med, mode]);

  const title = mode === "restock" ? "Repor estoque" : "Corrigir estoque";
  const currentDisplay = med
    ? fmtNum(Math.max(0, med.currentStock))
    : "—";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!med) return;

    const numVal = Number(quantity.replace(",", "."));
    if (!Number.isFinite(numVal) || numVal < 0) {
      toast.show("Quantidade inválida", { variant: "error" });
      return;
    }

    if (mode === "restock" && numVal <= 0) {
      toast.show("Quantidade deve ser > 0 para reposição", { variant: "error" });
      return;
    }

    setLoading(true);
    try {
      const endpoint =
        mode === "restock"
          ? `/api/medications/${med.id}/restock`
          : `/api/medications/${med.id}/adjust`;

      const bodyData =
        mode === "restock"
          ? { quantity: numVal }
          : { countedQuantity: numVal };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        toast.show(err.error ?? "Erro ao atualizar estoque", { variant: "error" });
        return;
      }

      const msg =
        mode === "restock"
          ? `+${fmtNum(numVal)} unidades adicionadas`
          : `Estoque corrigido para ${fmtNum(numVal)}`;

      toast.show(msg, { variant: "success" });
      onSaved();
      onClose();
    } catch {
      toast.show("Erro ao atualizar estoque", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {med && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="m-0 text-sm text-fg-muted font-body">
            Remédio: <strong className="text-fg">{med.name}</strong>
          </p>

          {/* Current stock context */}
          <div className="flex items-center justify-between py-3 px-3.5 bg-bg rounded-md border border-border">
            <span className="font-body text-sm text-fg-muted">Estoque atual</span>
            <span className="font-mono font-bold text-lg text-fg">
              {currentDisplay}
            </span>
          </div>

          {mode === "restock" ? (
            <Input
              label="Quantidade a adicionar"
              placeholder="Ex: 30"
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              autoFocus
              hint="Unidades que estão chegando"
            />
          ) : (
            <div>
              <label className={labelCls}>Contagem atual (total em mãos)</label>
              <Input
                placeholder="Ex: 10"
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                autoFocus
                hint="O ajuste será calculado automaticamente"
              />
            </div>
          )}

          <Button type="submit" fullWidth loading={loading}>
            {mode === "restock" ? "Repor estoque" : "Corrigir estoque"}
          </Button>
        </form>
      )}
    </Sheet>
  );
}
