"use client";

import React, { useState, useEffect } from "react";
import { Sheet } from "@/app/components/Sheet";
import { Button } from "@/app/components/Button";
import { useToast } from "@/app/components/Toast";
import {
  MedDetailsFields,
  type MedDetailsValue,
} from "@/app/components/MedDetailsFields";
import type { EnrichedMed } from "@/app/api/medications/enrich";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  med: EnrichedMed | null;
}

const EMPTY: MedDetailsValue = {
  name: "",
  category: "continuous",
  form: "pill",
  strengthMg: "",
  leadDays: "3",
};

/**
 * Edit a med's own details — Nome, Categoria, Forma, Concentração (mg), Dias de
 * antecedência para reabastecer — via PUT /api/medications/[id]. Dose/times live
 * in Agendamento; stock lives in Repor/Corrigir; neither is touched here.
 */
export function EditMedForm({ open, onClose, onSaved, med }: Props) {
  const toast = useToast();

  const [value, setValue] = useState<MedDetailsValue>(EMPTY);
  const [loading, setLoading] = useState(false);

  // Pre-fill from the selected med when the sheet is (re)opened.
  useEffect(() => {
    if (!open || !med) return;
    setValue({
      name: med.name,
      category: med.category,
      form: med.form,
      strengthMg:
        med.strengthMg != null ? String(med.strengthMg).replace(".", ",") : "",
      leadDays: String(med.reorderLeadTimeDays),
    });
  }, [med, open]);

  function patch(p: Partial<MedDetailsValue>) {
    setValue((prev) => ({ ...prev, ...p }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!med) return;

    if (!value.name.trim()) {
      toast.show("Nome é obrigatório", { variant: "error" });
      return;
    }

    // strengthMg is optional; if present it must parse to > 0 (mirror the PUT route).
    const smgRaw = value.strengthMg.replace(",", ".").trim();
    let strengthMg: number | null = null;
    if (smgRaw) {
      const n = Number(smgRaw);
      // Mirror the PUT route bounds (> 0 and < 100000) so we surface a pt-BR
      // message instead of letting the raw server error through.
      if (!Number.isFinite(n) || n <= 0 || n >= 100000) {
        toast.show("Concentração deve ser maior que 0 e menor que 100000", {
          variant: "error",
        });
        return;
      }
      strengthMg = n;
    }

    const leadNum = Number(value.leadDays);
    if (!Number.isInteger(leadNum) || leadNum < 0 || leadNum > 365) {
      toast.show("Dias de antecedência deve ser entre 0 e 365", {
        variant: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/medications/${med.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: value.name.trim(),
          category: value.category,
          form: value.form,
          strengthMg,
          reorderLeadTimeDays: leadNum,
        }),
      });

      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ error: "Erro desconhecido" }));
        toast.show(err.error ?? "Erro ao salvar remédio", { variant: "error" });
        return;
      }

      toast.show("Remédio atualizado", { variant: "success" });
      onSaved();
      onClose();
    } catch {
      toast.show("Erro ao salvar remédio", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Editar remédio">
      {med && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <MedDetailsFields value={value} onChange={patch} />

          <Button type="submit" fullWidth loading={loading}>
            Salvar remédio
          </Button>
        </form>
      )}
    </Sheet>
  );
}
