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

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "var(--text-sm)",
  fontWeight: "var(--fw-semibold)" as unknown as number,
  color: "var(--fg-2)",
  marginBottom: "6px",
  fontFamily: "var(--font-body)",
};

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

          {/* Current stock context */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              background: "var(--bg)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                color: "var(--fg-muted)",
              }}
            >
              Estoque atual
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: "18px",
                color: "var(--fg)",
              }}
            >
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
              <label style={labelStyle}>Contagem atual (total em mãos)</label>
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
