"use client";

import React, { useState } from "react";
import { Sheet } from "@/app/components/Sheet";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";
import { useToast } from "@/app/components/Toast";
import { MedDetailsFields, labelCls, fieldBase } from "@/app/components/MedDetailsFields";
import { cn } from "@/lib/cn";
import { Plus, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const CATEGORY_LEAD_DAYS: Record<string, number> = {
  compounded: 7,
  continuous: 3,
  otc: 3,
};

export function MedForm({ open, onClose, onCreated }: Props) {
  const toast = useToast();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("continuous");
  const [form, setForm] = useState<string>("pill");
  const [strengthMg, setStrengthMg] = useState("");
  const [leadDays, setLeadDays] = useState<string>("3");
  const [doseTimes, setDoseTimes] = useState<string[]>(["08:00"]);
  const [unitsPerDose, setUnitsPerDose] = useState("1");
  const [startingStock, setStartingStock] = useState("");
  const [loading, setLoading] = useState(false);

  // The five shared detail fields are controlled via a single patch handler so
  // we can keep MedForm's create-only behavior of defaulting the lead time from
  // the chosen category.
  function handleDetailsChange(patch: {
    name?: string;
    category?: string;
    form?: string;
    strengthMg?: string;
    leadDays?: string;
  }) {
    if (patch.name !== undefined) setName(patch.name);
    if (patch.form !== undefined) setForm(patch.form);
    if (patch.strengthMg !== undefined) setStrengthMg(patch.strengthMg);
    if (patch.category !== undefined) {
      // Changing the category resets the lead time to the category default; this
      // wins over an explicit leadDays in the same patch (the UI only ever sends
      // one field at a time, but make the precedence explicit).
      setCategory(patch.category);
      setLeadDays(String(CATEGORY_LEAD_DAYS[patch.category] ?? 3));
    } else if (patch.leadDays !== undefined) {
      setLeadDays(patch.leadDays);
    }
  }

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
    if (!name.trim()) {
      toast.show("Nome é obrigatório", { variant: "error" });
      return;
    }
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
      const body: Record<string, unknown> = {
        name: name.trim(),
        category,
        form,
        reorderLeadTimeDays: Number(leadDays),
        schedule: {
          doseTimes,
          unitsPerDose: unitsNum,
        },
      };

      const smg = strengthMg.replace(",", ".");
      if (smg.trim()) body.strengthMg = Number(smg);

      const ss = startingStock.replace(",", ".");
      if (ss.trim()) body.startingStock = Number(ss);

      const res = await fetch("/api/medications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        toast.show(err.error ?? "Erro ao criar remédio", { variant: "error" });
        return;
      }

      toast.show("Remédio adicionado!", { variant: "success" });
      onCreated();
      handleClose();
    } catch {
      toast.show("Erro ao criar remédio", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setName("");
    setCategory("continuous");
    setForm("pill");
    setStrengthMg("");
    setLeadDays("3");
    setDoseTimes(["08:00"]);
    setUnitsPerDose("1");
    setStartingStock("");
    onClose();
  }

  return (
    <Sheet open={open} onClose={handleClose} title="Adicionar remédio">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Shared detail fields: Nome, Categoria, Forma, Concentração, Dias */}
        <MedDetailsFields
          value={{ name, category, form, strengthMg, leadDays }}
          onChange={handleDetailsChange}
          autoFocusName
        />

        {/* Horários */}
        <div>
          <label className={labelCls}>Horários de dose</label>
          <div className="flex flex-col gap-2">
            {doseTimes.map((t, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="time"
                  value={t}
                  onChange={(e) => updateTime(idx, e.target.value)}
                  className={cn(fieldBase, "flex-1 min-h-11 py-2.5 px-3")}
                />
                {doseTimes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTime(idx)}
                    aria-label="Remover horário"
                    className="bg-danger-soft border-none rounded-md text-danger w-11 h-11 grid place-items-center cursor-pointer flex-none"
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
          hint="Use vírgula como separador decimal"
        />

        {/* Estoque inicial */}
        <Input
          label="Estoque inicial"
          placeholder="Ex: 30"
          inputMode="decimal"
          value={startingStock}
          onChange={(e) => setStartingStock(e.target.value)}
          hint="Opcional — quantidade atual em mãos"
        />

        <Button type="submit" fullWidth loading={loading}>
          Salvar remédio
        </Button>
      </form>
    </Sheet>
  );
}
