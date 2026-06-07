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

const SECTION_STYLE: React.CSSProperties = {
  marginBottom: "40px",
};

const SECTION_TITLE_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: "var(--text-xl)",
  color: "var(--fg)",
  marginBottom: "16px",
  letterSpacing: "-0.01em",
  borderBottom: "1px solid var(--border)",
  paddingBottom: "8px",
};

const ROW_STYLE: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  alignItems: "center",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={SECTION_STYLE}>
      <h2 style={SECTION_TITLE_STYLE}>{title}</h2>
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

  return (
    <div
      style={{
        maxWidth: "480px",
        margin: "0 auto",
        padding: "24px 16px 120px",
      }}
    >
      {/* Logo */}
      <Section title="Logo">
        <div style={{ ...ROW_STYLE, gap: "24px", flexDirection: "column", alignItems: "flex-start" }}>
          <Logo size="sm" />
          <Logo size="md" />
          <Logo size="lg" />
          <Logo size="md" badge />
          <Logo size="md" markOnly />
        </div>
      </Section>

      {/* Buttons */}
      <Section title="Botões">
        <div style={{ ...ROW_STYLE, marginBottom: "10px" }}>
          <Button variant="primary">Salvar</Button>
          <Button variant="secondary">Cancelar</Button>
          <Button variant="ghost">Ver mais</Button>
          <Button variant="destructive">Excluir</Button>
        </div>
        <div style={{ ...ROW_STYLE, marginBottom: "10px" }}>
          <Button variant="primary" size="sm">Pequeno</Button>
          <Button variant="primary" size="md">Médio</Button>
          <Button variant="primary" size="lg">Grande</Button>
        </div>
        <div style={{ ...ROW_STYLE, marginBottom: "10px" }}>
          <Button variant="primary" loading>Carregando…</Button>
          <Button variant="primary" disabled>Desabilitado</Button>
          <Button variant="primary" icon={<PawPrint size={18} />}>Com ícone</Button>
        </div>
        <Button variant="primary" fullWidth>Largura total</Button>
      </Section>

      {/* Cards */}
      <Section title="Cards">
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Card variant="default" padding="md">
            <div style={{ fontWeight: 600, color: "var(--fg)" }}>Card padrão</div>
            <div style={{ fontSize: "14px", color: "var(--fg-muted)", marginTop: "4px" }}>
              Superfície branca com borda e sombra suave.
            </div>
          </Card>
          <Card variant="raised" padding="md">
            <div style={{ fontWeight: 600, color: "var(--fg)" }}>Card elevado</div>
            <div style={{ fontSize: "14px", color: "var(--fg-muted)", marginTop: "4px" }}>
              Sombra maior, sem borda visível.
            </div>
          </Card>
          <Card variant="highlighted" padding="md">
            <div style={{ fontWeight: 600, color: "var(--fg)" }}>Card destacado</div>
            <div style={{ fontSize: "14px", color: "var(--fg-muted)", marginTop: "4px" }}>
              Fundo brand-soft com borda dourada.
            </div>
          </Card>
          <Card variant="default" padding="sm">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <CardChip tone="brand" icon={<PawPrint size={20} />} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "15px" }}>Com chip de ícone</div>
                <div style={{ fontSize: "13px", color: "var(--fg-muted)" }}>Tom brand</div>
              </div>
            </div>
          </Card>
          <Card variant="default" padding="sm" interactive>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <CardChip tone="ok" icon={<Heart size={20} />} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "15px" }}>Card interativo</div>
                <div style={{ fontSize: "13px", color: "var(--fg-muted)" }}>Toque para interagir</div>
              </div>
            </div>
          </Card>
        </div>
      </Section>

      {/* Inputs */}
      <Section title="Campos de texto">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input label="Nome do cão" placeholder="Ex: Molly" />
          <Input
            label="Peso"
            placeholder="Ex: 28,5"
            hint="Em quilogramas"
            trailingIcon={<span style={{ fontSize: "13px" }}>kg</span>}
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
        <div style={{ ...ROW_STYLE, marginBottom: "10px" }}>
          <StockPill status="ok" />
          <StockPill status="reorder" />
          <StockPill status="urgent" />
        </div>
        <div style={{ ...ROW_STYLE, marginBottom: "10px" }}>
          <StatusPill status="ok" size="sm">Estoque OK</StatusPill>
          <StatusPill status="reorder" size="sm">Reabastecer em breve</StatusPill>
          <StatusPill status="urgent" size="sm">Acabando</StatusPill>
        </div>
        <div style={ROW_STYLE}>
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
        <div style={{ marginTop: "12px" }}>
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
          <div style={{ fontWeight: 600, fontSize: "15px", marginBottom: "12px" }}>
            Crises por mês
          </div>
          <BarChart
            data={chartData}
            annotations={[{ index: 3, label: "Dose ajustada" }]}
          />
        </Card>
      </Section>

      {/* MedStatusCard */}
      <Section title="Cards de medicamentos">
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
        <div style={ROW_STYLE}>
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
        <div
          style={{
            position: "relative",
            height: "100px",
            background: "var(--bg-2)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}
        >
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
