"use client";

import React, { useState } from "react";
import { Button } from "../components/Button";
import { Card, CardChip } from "../components/Card";
import { Input, Textarea } from "../components/Input";
import { StatusPill, StockPill } from "../components/StatusPill";
import { TabBar } from "../components/TabBar";
import { Counter } from "../components/Counter";
import { BarChart } from "../components/BarChart";
import { MedStatusCard } from "../components/MedStatusCard";
import { Logo } from "../components/Logo";
import { Sheet } from "../components/Sheet";
import { useToast } from "../components/Toast";
import { cn } from "@/lib/cn";
import { typeLabelPt, type SeizureType } from "@/lib/seizure-types";
import {
  Home,
  Activity,
  Pill,
  BarChart2,
  Plus,
  PawPrint,
  Heart,
  Package,
  CheckCircle,
  AlertTriangle,
  Search,
} from "lucide-react";

const sectionTitleCls =
  "font-display font-bold text-xl text-fg mb-4 tracking-snug border-b border-border pb-2";
const rowCls = "flex flex-wrap gap-2.5 items-center";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className={sectionTitleCls}>{title}</h2>
      {children}
    </section>
  );
}

export default function StyleguidePage() {
  const [activeTab, setActiveTab] = useState("home");
  const [sheetOpen, setSheetOpen] = useState(false);
  const { show: showToast } = useToast();

  const tabItems = [
    { id: "home", label: "Início", icon: <Home size={23} /> },
    { id: "trends", label: "Tendências", icon: <BarChart2 size={23} /> },
    { id: "meds", label: "Medicamentos", icon: <Pill size={23} /> },
    { id: "history", label: "Histórico", icon: <Activity size={23} /> },
  ];

  const centerAction = {
    label: "Registrar",
    icon: <Plus size={27} strokeWidth={2.5} />,
    onClick: () => showToast("Registrar crise", { variant: "info" }),
  };

  const chartData = [
    { label: "Jan", value: 4 },
    { label: "Fev", value: 2 },
    { label: "Mar", value: 5 },
    { label: "Abr", value: 3, highlight: true },
    { label: "Mai", value: 1 },
    { label: "Jun", value: 2 },
  ];

  // Each displayed type has at least one non-zero bucket so the legend/stacks
  // honestly demo "zero types absent" (production passes only typesPresent).
  // Columns intentionally vary which type is topmost (incl. cases where the
  // canonical-last type `other` is zero) to exercise the rounded-top logic.
  const stackedTypeData = [
    { label: "Jan", tonic_clonic: 2, focal: 1, absence: 1, other: 0 },
    { label: "Fev", tonic_clonic: 1, focal: 0, absence: 1, other: 1 },
    { label: "Mar", tonic_clonic: 3, focal: 2, absence: 0, other: 2 },
    { label: "Abr", tonic_clonic: 1, focal: 1, absence: 2, other: 0 },
  ];

  // STATIC literal swatch classes (one per seizure type) — present in source so
  // Turbopack's JIT generates them. Never build these dynamically.
  const typeSwatchClass: Record<SeizureType, string> = {
    tonic_clonic: "bg-[var(--chart-type-tonic-clonic)]",
    focal: "bg-[var(--chart-type-focal)]",
    absence: "bg-[var(--chart-type-absence)]",
    other: "bg-[var(--chart-type-other)]",
  };

  const typeStacks = (
    [
      { id: "tonic_clonic", cssVar: "--chart-type-tonic-clonic" },
      { id: "focal", cssVar: "--chart-type-focal" },
      { id: "absence", cssVar: "--chart-type-absence" },
      { id: "other", cssVar: "--chart-type-other" },
    ] as const
  ).map((t) => ({
    key: t.id,
    label: typeLabelPt(t.id),
    color: `var(${t.cssVar})`,
    swatchClass: typeSwatchClass[t.id],
  }));

  return (
    <div className="max-w-[480px] mx-auto pt-6 px-4 pb-[120px]">
      {/* Logo */}
      <Section title="Logo">
        <div className="flex flex-wrap gap-6 flex-col items-start">
          <Logo size="sm" />
          <Logo size="md" />
          <Logo size="lg" />
          <Logo size="md" badge />
          <Logo size="md" markOnly />
        </div>
      </Section>

      {/* Buttons */}
      <Section title="Botões">
        <div className={cn(rowCls, "mb-2.5")}>
          <Button variant="primary">Salvar</Button>
          <Button variant="secondary">Cancelar</Button>
          <Button variant="ghost">Ver mais</Button>
          <Button variant="destructive">Excluir</Button>
        </div>
        <div className={cn(rowCls, "mb-2.5")}>
          <Button variant="primary" size="sm">Pequeno</Button>
          <Button variant="primary" size="md">Médio</Button>
          <Button variant="primary" size="lg">Grande</Button>
        </div>
        <div className={cn(rowCls, "mb-2.5")}>
          <Button variant="primary" loading>Carregando…</Button>
          <Button variant="primary" disabled>Desabilitado</Button>
          <Button variant="primary" icon={<PawPrint size={18} />}>Com ícone</Button>
        </div>
        <Button variant="primary" fullWidth>Largura total</Button>
      </Section>

      {/* Cards */}
      <Section title="Cards">
        <div className="flex flex-col gap-3">
          <Card variant="default" padding="md">
            <div className="font-semibold text-fg">Card padrão</div>
            <div className="text-sm text-fg-muted mt-1">
              Superfície branca com borda e sombra suave.
            </div>
          </Card>
          <Card variant="raised" padding="md">
            <div className="font-semibold text-fg">Card elevado</div>
            <div className="text-sm text-fg-muted mt-1">
              Sombra maior, sem borda visível.
            </div>
          </Card>
          <Card variant="highlighted" padding="md">
            <div className="font-semibold text-fg">Card destacado</div>
            <div className="text-sm text-fg-muted mt-1">
              Fundo brand-soft com borda dourada.
            </div>
          </Card>
          <Card variant="default" padding="sm">
            <div className="flex items-center gap-3">
              <CardChip tone="brand" icon={<PawPrint size={20} />} />
              <div>
                <div className="font-semibold text-[15px]">Com chip de ícone</div>
                <div className="text-[13px] text-fg-muted">Tom brand</div>
              </div>
            </div>
          </Card>
          <Card variant="default" padding="sm" interactive>
            <div className="flex items-center gap-3">
              <CardChip tone="ok" icon={<Heart size={20} />} />
              <div>
                <div className="font-semibold text-[15px]">Card interativo</div>
                <div className="text-[13px] text-fg-muted">Toque para interagir</div>
              </div>
            </div>
          </Card>
        </div>
      </Section>

      {/* Inputs */}
      <Section title="Campos de texto">
        <div className="flex flex-col gap-4">
          <Input label="Nome do cão" placeholder="Ex: Molly" />
          <Input
            label="Peso"
            placeholder="Ex: 28,5"
            hint="Em quilogramas"
            trailingIcon={<span className="text-[13px]">kg</span>}
          />
          <Input
            label="E-mail"
            placeholder="você@email.com"
            leadingIcon={<Search size={16} />}
            error="E-mail inválido"
          />
          <Textarea
            label="Observações"
            placeholder="Descreva o episódio..."
            hint="Seja o mais detalhado possível"
            rows={3}
          />
        </div>
      </Section>

      {/* Status pills */}
      <Section title="Pills de status">
        <div className={cn(rowCls, "mb-2.5")}>
          <StockPill status="ok" />
          <StockPill status="reorder" />
          <StockPill status="urgent" />
        </div>
        <div className={cn(rowCls, "mb-2.5")}>
          <StatusPill status="ok" size="sm">Estoque OK</StatusPill>
          <StatusPill status="reorder" size="sm">Reabastecer em breve</StatusPill>
          <StatusPill status="urgent" size="sm">Acabando</StatusPill>
        </div>
        <div className={rowCls}>
          <StatusPill status="info" icon={<CheckCircle size={14} />}>Consulta agendada</StatusPill>
          <StatusPill status="urgent" solid>Urgente</StatusPill>
          <StatusPill status="neutral">Neutro</StatusPill>
        </div>
      </Section>

      {/* Counter */}
      <Section title="Contador">
        <Card variant="raised" padding="lg">
          <Counter
            since={new Date(Date.now() - 3 * 86400000 - 5 * 3600000 - 23 * 60000)}
            sub="Continue assim"
          />
        </Card>
        <div className="mt-3">
          <Card variant="default" padding="md">
            <Counter
              since={new Date(Date.now() - 14 * 3600000)}
              size="sm"
              eyebrow="Última crise"
            />
          </Card>
        </div>
      </Section>

      {/* BarChart */}
      <Section title="Gráfico de barras">
        <Card variant="default" padding="md">
          <div className="font-semibold text-[15px] mb-3">Crises por mês</div>
          <BarChart
            data={chartData}
            annotations={[{ index: 3, label: "Dose ajustada" }]}
          />
        </Card>
      </Section>

      {/* Stacked BarChart by seizure type */}
      <Section title="Gráfico de barras empilhado (por tipo)">
        <Card variant="default" padding="md">
          <div className="font-semibold text-[15px] mb-3">Crises por tipo</div>
          <BarChart
            data={stackedTypeData}
            stacks={typeStacks}
            ariaLabel="Crises por tipo ao longo do tempo"
          />
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {typeStacks.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "h-2.5 w-2.5 shrink-0 rounded-[2px]",
                    s.swatchClass,
                  )}
                />
                <span className="text-2xs text-fg-2">{s.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      {/* MedStatusCard */}
      <Section title="Cards de medicamentos">
        <div className="flex flex-col gap-3">
          <MedStatusCard
            name="Fenobarbital"
            dose="97,5 mg · 2× ao dia"
            daysRemaining={28}
            capacityDays={30}
            chipIcon={<Pill size={21} />}
          />
          <MedStatusCard
            name="Brometo de Potássio"
            dose="500 mg · 1× ao dia"
            daysRemaining={10}
            capacityDays={30}
            chipIcon={<Package size={21} />}
            icon={<AlertTriangle size={14} />}
          />
          <MedStatusCard
            name="Imepitoin"
            dose="200 mg · 2× ao dia"
            daysRemaining={3}
            capacityDays={30}
            chipIcon={<Pill size={21} />}
          />
        </div>
      </Section>

      {/* Sheet */}
      <Section title="Bottom Sheet">
        <Button variant="secondary" onClick={() => setSheetOpen(true)}>
          Abrir Sheet
        </Button>
        <Sheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="Registrar crise"
        >
          <div className="flex flex-col gap-4">
            <Input label="Data e hora" type="datetime-local" />
            <Textarea label="Observações" placeholder="Descreva o episódio..." rows={3} />
            <Button variant="primary" fullWidth onClick={() => setSheetOpen(false)}>
              Salvar
            </Button>
          </div>
        </Sheet>
      </Section>

      {/* Toast */}
      <Section title="Toast">
        <div className={rowCls}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => showToast("Crise registrada com sucesso", { variant: "success" })}
          >
            Sucesso
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => showToast("Estoque baixo: Fenobarbital", { variant: "warning" })}
          >
            Aviso
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => showToast("Erro ao salvar. Tente novamente.", { variant: "error" })}
          >
            Erro
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => showToast("Sincronizando dados...", { variant: "info" })}
          >
            Info
          </Button>
        </div>
      </Section>

      {/* TabBar */}
      <Section title="Barra de navegação">
        <div className="relative h-[100px] bg-bg-2 rounded-lg overflow-hidden">
          <TabBar
            items={tabItems}
            active={activeTab}
            onChange={setActiveTab}
            centerAction={centerAction}
          />
        </div>
      </Section>
    </div>
  );
}
