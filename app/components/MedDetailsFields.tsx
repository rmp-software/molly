"use client";

import React from "react";
import { Input } from "@/app/components/Input";
import { cn } from "@/lib/cn";

// Single source of truth for the med-detail option maps. Shared by the create
// (MedForm) and edit (EditMedForm) flows so they can't drift.
export const CATEGORY_OPTIONS = [
  { value: "continuous", label: "Contínuo" },
  { value: "otc", label: "Balcão" },
  { value: "compounded", label: "Manipulado" },
] as const;

export const FORM_OPTIONS = [
  { value: "pill", label: "Comprimido" },
  { value: "capsule", label: "Cápsula" },
  { value: "tablet", label: "Tablete" },
] as const;

// Shared field styling — exported so MedForm's own dose/times/stock fields use
// the exact same label + control look (single source of truth, can't drift).
export const labelCls = "block text-sm font-semibold text-fg-2 mb-1.5 font-body";

export const fieldBase =
  "block w-full max-w-full min-w-0 text-base font-body text-fg bg-surface " +
  "border-[1.5px] border-border-strong rounded-md outline-none appearance-none " +
  "[-webkit-tap-highlight-color:transparent]";

export interface MedDetailsValue {
  name: string;
  category: string;
  form: string;
  strengthMg: string;
  leadDays: string;
}

interface Props {
  value: MedDetailsValue;
  onChange: (patch: Partial<MedDetailsValue>) => void;
  autoFocusName?: boolean;
}

/**
 * Presentational, controlled rendering of the five med-detail fields shared by
 * the create and edit forms: Nome, Categoria, Forma, Concentração (mg), Dias de
 * antecedência para reabastecer. Pure markup — the parent owns state, validation,
 * and submission (e.g. category-driven lead-time defaults live in the parent).
 */
export function MedDetailsFields({ value, onChange, autoFocusName }: Props) {
  return (
    <>
      {/* Nome */}
      <Input
        label="Nome"
        placeholder="Ex: Fenobarbital"
        value={value.name}
        onChange={(e) => onChange({ name: e.target.value })}
        autoFocus={autoFocusName}
      />

      {/* Categoria */}
      <div>
        <label className={labelCls}>Categoria</label>
        <select
          className={cn(fieldBase, "min-h-12 py-3 px-3.5")}
          value={value.category}
          onChange={(e) => onChange({ category: e.target.value })}
        >
          {CATEGORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Forma */}
      <div>
        <label className={labelCls}>Forma</label>
        <select
          className={cn(fieldBase, "min-h-12 py-3 px-3.5")}
          value={value.form}
          onChange={(e) => onChange({ form: e.target.value })}
        >
          {FORM_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Concentração */}
      <Input
        label="Concentração (mg)"
        placeholder="Ex: 97,5"
        inputMode="decimal"
        value={value.strengthMg}
        onChange={(e) => onChange({ strengthMg: e.target.value })}
        hint="Opcional"
      />

      {/* Dias de antecedência */}
      <Input
        label="Dias de antecedência para reabastecer"
        inputMode="numeric"
        value={value.leadDays}
        onChange={(e) => onChange({ leadDays: e.target.value })}
      />
    </>
  );
}
