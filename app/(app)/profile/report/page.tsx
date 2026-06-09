"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Download, RefreshCw } from "lucide-react";
import { Button } from "@/app/components/Button";
import { Card } from "@/app/components/Card";
import { cn } from "@/lib/cn";
import { fmtNum, fmtKg, fmtDuration, fmtDateTimePt } from "@/lib/format";
import { typeLabelPt } from "@/lib/seizure-types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DogInfo {
  name: string;
  breed: string | null;
  birthdate: string | null;
  diagnosis: string | null;
  vetName: string | null;
  emergencyContact: string | null;
}

interface EpisodeRow {
  id: string;
  occurredAt: string;
  type: string;
  durationSeconds: number | null;
  severity: string | null;
  isCluster: boolean;
  rescueGiven: boolean;
  notes: string | null;
}

interface MedInfo {
  name: string;
  category: string;
  form: string;
  strengthMg: number | null;
  archivedAt: string | null;
  activeSchedule: {
    doseTimes: string[];
    unitsPerDose: number;
    effectiveFrom: string;
  } | null;
}

interface ScheduleChange {
  medName: string;
  effectiveFrom: string;
  doseTimes: string[];
  unitsPerDose: number;
}

interface ReportPayload {
  dog: DogInfo;
  latestWeightKg: number | null;
  range: { from: string; to: string };
  episodes: EpisodeRow[];
  summary: {
    total: number;
    monthlyAverage: number;
    longestGapDays: number | null;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    durationStats: {
      currentAvg: number | null;
      previousAvg: number | null;
      deltaSeconds: number | null;
      direction: "up" | "down" | "flat";
      emergencyCount: number;
      maxSeconds: number | null;
    };
  };
  medications: MedInfo[];
  scheduleChanges: ScheduleChange[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SEVERITY_PT: Record<string, string> = {
  mild: "Leve",
  moderate: "Moderada",
  severe: "Grave",
};

const CATEGORY_PT: Record<string, string> = {
  continuous: "Contínuo",
  otc: "Venda livre",
  compounded: "Manipulado",
};

const FORM_PT: Record<string, string> = {
  pill: "Comprimido",
  capsule: "Cápsula",
  tablet: "Tablete",
};

const DIRECTION_LABEL: Record<"up" | "down" | "flat", string> = {
  up: "subindo",
  down: "descendo",
  flat: "estável",
};

function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

function computeAge(birthdate: string | null): string | null {
  if (!birthdate) return null;
  const birth = new Date(birthdate + "T00:00:00Z");
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const mDiff = now.getMonth() - birth.getMonth();
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < birth.getDate())) {
    years--;
  }
  if (years < 0) return null;
  return years === 1 ? "1 ano" : `${years} anos`;
}

function isoToDateInput(iso: string): string {
  // Convert ISO to YYYY-MM-DD for <input type="date">
  return iso.slice(0, 10);
}

function dateInputToIso(dateStr: string, endOfDay = false): string {
  if (!dateStr) return "";
  // Use Brazil offset (UTC-3, no DST) so the full calendar day is captured
  // in São Paulo time — avoids losing 21:00–23:59 BRT on the 'to' date.
  return endOfDay ? `${dateStr}T23:59:59.999-03:00` : `${dateStr}T00:00:00.000-03:00`;
}

const dateFieldCls =
  "w-full min-w-0 max-w-full box-border font-body text-sm py-2 px-2.5 rounded-sm border-[1.5px] border-border-strong bg-surface text-fg";

const rangeLabelCls = "text-sm text-fg-muted font-body";
const cardHeading = "m-0 mb-3 font-display text-lg font-bold text-fg";
const metaLine = "mt-1 mb-0 font-body text-sm";

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const router = useRouter();

  // Date range state — initialized post-mount to avoid hydration drift
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pendingFrom, setPendingFrom] = useState("");
  const [pendingTo, setPendingTo] = useState("");

  const [report, setReport] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  // Set defaults post-mount to avoid SSR mismatch
  useEffect(() => {
    const to = new Date();
    const from = new Date(to);
    from.setMonth(from.getMonth() - 6);
    const toStr = to.toISOString().slice(0, 10);
    const fromStr = from.toISOString().slice(0, 10);
    setFromDate(fromStr);
    setToDate(toStr);
    setPendingFrom(fromStr);
    setPendingTo(toStr);
  }, []);

  const fetchReport = useCallback(
    async (from: string, to: string) => {
      if (!from || !to) return;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          from: dateInputToIso(from),
          to: dateInputToIso(to, true),
        });
        const res = await fetch(`/api/report?${params}`);
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error ?? "Erro ao carregar relatório");
        }
        const data: ReportPayload = await res.json();
        setReport(data);
        setGeneratedAt(new Date());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Auto-fetch when defaults are set
  useEffect(() => {
    if (fromDate && toDate) {
      fetchReport(fromDate, toDate);
    }
  }, [fromDate, toDate, fetchReport]);

  function handleUpdate() {
    // setFromDate/setToDate triggers the useEffect which calls fetchReport —
    // no need to call it explicitly (would cause two concurrent identical requests).
    setFromDate(pendingFrom);
    setToDate(pendingTo);
  }

  const csvHref = fromDate && toDate
    ? `/api/report/episodes.csv?from=${dateInputToIso(fromDate)}&to=${dateInputToIso(toDate, true)}`
    : "/api/report/episodes.csv";

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="px-5 pb-10">
      {/* Toolbar (hidden in print) */}
      <div className="no-print flex flex-col gap-3 mb-5">
        {/* Back */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.back()}
          >
            Voltar
          </Button>
        </div>

        {/* Date range */}
        <div className="flex flex-wrap gap-3 items-end">
          <label className="flex flex-col gap-1.5 flex-[1_1_140px] min-w-0">
            <span className={rangeLabelCls}>De</span>
            <input
              type="date"
              value={pendingFrom}
              onChange={(e) => setPendingFrom(e.target.value)}
              className={dateFieldCls}
            />
          </label>
          <label className="flex flex-col gap-1.5 flex-[1_1_140px] min-w-0">
            <span className={rangeLabelCls}>Até</span>
            <input
              type="date"
              value={pendingTo}
              onChange={(e) => setPendingTo(e.target.value)}
              className={dateFieldCls}
            />
          </label>
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={handleUpdate}
            loading={loading}
            className="flex-[1_1_100%]"
          >
            Atualizar
          </Button>
        </div>

        {/* Export */}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Printer size={14} />}
            onClick={() => window.print()}
            title="Abre o diálogo de impressão do navegador. Escolha 'Salvar como PDF' para exportar."
            className="flex-1"
          >
            Salvar como PDF
          </Button>
          <a href={csvHref} download className="flex-1 flex">
            <Button
              variant="secondary"
              size="sm"
              icon={<Download size={14} />}
              fullWidth
            >
              Baixar CSV
            </Button>
          </a>
        </div>
      </div>

      {/* Print hint (hidden in print) */}
      <p className="no-print text-xs text-fg-muted font-body mb-4 -mt-2">
        Dica: &ldquo;Salvar como PDF&rdquo; abre o diálogo de impressão do navegador — escolha &ldquo;Salvar como PDF&rdquo; para exportar.
      </p>

      {/* Loading / error states */}
      {loading && !report && (
        <p className="font-body text-fg-muted text-center py-10">
          Carregando relatório…
        </p>
      )}
      {error && (
        <p className="font-body text-danger py-4">{error}</p>
      )}

      {/* ─── Report Content ────────────────────────────────────────────────── */}
      {report && (
        <div id="report-content">
          {/* Header */}
          <div className="mb-6 border-b-2 border-border pb-4">
            <h1 className="m-0 font-display text-2xl font-bold text-fg tracking-tight">
              {report.dog.name}
            </h1>
            <p className="mt-1 mb-0 font-body text-sm text-fg-muted">
              {[
                report.dog.breed,
                report.dog.birthdate ? `Nascimento: ${formatDate(report.dog.birthdate)}` : null,
                computeAge(report.dog.birthdate) ? `(${computeAge(report.dog.birthdate)})` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {report.dog.diagnosis && (
              <p className={cn(metaLine, "text-fg")}>
                <strong>Diagnóstico:</strong> {report.dog.diagnosis}
              </p>
            )}
            {report.dog.vetName && (
              <p className={cn(metaLine, "text-fg")}>
                <strong>Veterinária:</strong> {report.dog.vetName}
              </p>
            )}
            {report.dog.emergencyContact && (
              <p className={cn(metaLine, "text-fg")}>
                <strong>Emergência:</strong> {report.dog.emergencyContact}
              </p>
            )}
            {report.latestWeightKg != null && (
              <p className={cn(metaLine, "text-fg")}>
                <strong>Peso atual:</strong> {fmtKg(report.latestWeightKg)}
              </p>
            )}

            <p className="mt-3 mb-0 font-display text-xl font-bold text-fg tracking-snug">
              Relatório de crises
            </p>
            <p className="mt-1 mb-0 font-body text-sm text-fg-muted">
              Período: {formatDate(report.range.from)} – {formatDate(report.range.to)}
            </p>
            {generatedAt && (
              <p className="mt-0.5 mb-0 font-body text-xs text-fg-muted">
                Gerado em: {fmtDateTimePt(generatedAt)}
              </p>
            )}
          </div>

          {/* Summary block */}
          <Card className="mb-5">
            <h2 className={cardHeading}>Resumo</h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3 mb-4">
              <SummaryItem label="Total de crises" value={String(report.summary.total)} />
              <SummaryItem
                label={
                  (() => {
                    const f = new Date(report.range.from);
                    const t = new Date(report.range.to);
                    const months =
                      (t.getFullYear() - f.getFullYear()) * 12 +
                      (t.getMonth() - f.getMonth());
                    return months <= 0 ? "Total no período" : "Média por mês";
                  })()
                }
                value={fmtNum(report.summary.monthlyAverage)}
              />
              <SummaryItem
                label="Maior intervalo"
                value={
                  report.summary.longestGapDays != null
                    ? `${report.summary.longestGapDays} dias`
                    : "—"
                }
              />
            </div>

            {/* By type */}
            {Object.keys(report.summary.byType).length > 0 && (
              <div className="mb-3">
                <p className="mt-0 mb-1.5 font-body text-sm font-semibold text-fg">
                  Por tipo
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(report.summary.byType).map(([type, count]) => (
                    <span
                      key={type}
                      className="font-body text-sm py-[3px] px-2.5 rounded-pill bg-brand-soft text-brand"
                    >
                      {typeLabelPt(type as Parameters<typeof typeLabelPt>[0])}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* By severity */}
            {Object.keys(report.summary.bySeverity).length > 0 && (
              <div>
                <p className="mt-0 mb-1.5 font-body text-sm font-semibold text-fg">
                  Por severidade
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(report.summary.bySeverity).map(([sev, count]) => (
                    <span
                      key={sev}
                      className="font-body text-sm py-[3px] px-2.5 rounded-pill bg-bg-2 text-fg-2"
                    >
                      {sev === "unknown" ? "Não informada" : (SEVERITY_PT[sev] ?? sev)}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tonic-clonic duration block */}
            <DurationBlock stats={report.summary.durationStats} />
          </Card>

          {/* Episodes table */}
          <Card className="mb-5 overflow-x-auto">
            <h2 className={cardHeading}>
              Crises no período ({report.episodes.length})
            </h2>
            {report.episodes.length === 0 ? (
              <p className="font-body text-sm text-fg-muted">
                Nenhuma crise registrada neste período.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse font-body text-sm text-fg">
                  <thead>
                    <tr>
                      {["Data/hora", "Tipo", "Duração", "Severidade", "Cluster", "Resgate", "Observações"].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left py-1.5 px-2.5 border-b-[1.5px] border-border text-fg-muted font-semibold whitespace-nowrap"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {report.episodes.map((ep, idx) => (
                      <tr key={ep.id} className={idx % 2 === 0 ? "bg-transparent" : "bg-bg-2"}>
                        <td className="py-1.5 px-2.5 whitespace-nowrap">
                          {fmtDateTimePt(new Date(ep.occurredAt))}
                        </td>
                        <td className="py-1.5 px-2.5 whitespace-nowrap">
                          {typeLabelPt(ep.type as Parameters<typeof typeLabelPt>[0])}
                        </td>
                        <td className="py-1.5 px-2.5 whitespace-nowrap">
                          {ep.durationSeconds != null ? fmtDuration(ep.durationSeconds) : "—"}
                        </td>
                        <td className="py-1.5 px-2.5 whitespace-nowrap">
                          {ep.severity ? (SEVERITY_PT[ep.severity] ?? ep.severity) : "—"}
                        </td>
                        <td className="py-1.5 px-2.5">{ep.isCluster ? "Sim" : "Não"}</td>
                        <td className="py-1.5 px-2.5">{ep.rescueGiven ? "Sim" : "Não"}</td>
                        <td className="py-1.5 px-2.5 max-w-[200px] break-words">
                          {ep.notes ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Medications section */}
          {report.medications.length > 0 && (
            <Card className="mb-5">
              <h2 className={cardHeading}>Medicamentos atuais</h2>
              <div className="flex flex-col gap-3">
                {report.medications.map((med, i) => (
                  <div key={i} className="py-2.5 px-3 rounded-sm bg-bg-2">
                    <p className="m-0 font-body font-semibold text-base text-fg">
                      {med.name}
                      {med.strengthMg != null && (
                        <span className="font-normal text-fg-muted ml-1.5">
                          {fmtNum(med.strengthMg)} mg
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 mb-0 font-body text-sm text-fg-muted">
                      {[
                        CATEGORY_PT[med.category] ?? med.category,
                        FORM_PT[med.form] ?? med.form,
                      ].join(" · ")}
                    </p>
                    {med.activeSchedule && (
                      <p className="mt-1 mb-0 font-body text-sm text-fg">
                        <strong>Horários:</strong> {med.activeSchedule.doseTimes.join(", ")} · {fmtNum(med.activeSchedule.unitsPerDose)} unid./dose
                        {" "}<span className="text-fg-muted">(desde {formatDate(med.activeSchedule.effectiveFrom + "T00:00:00Z")})</span>
                      </p>
                    )}
                    {med.archivedAt && (
                      <p className="mt-1 mb-0 font-body text-sm text-fg-muted">
                        Descontinuado em {formatDate(med.archivedAt)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Dose-change history */}
          {report.scheduleChanges.length > 0 && (
            <Card className="mb-5">
              <h2 className={cardHeading}>Alterações de dose no período</h2>
              <ul className="m-0 pl-4 font-body text-sm text-fg leading-[1.7]">
                {report.scheduleChanges.map((sc, i) => (
                  <li key={i}>
                    <strong>{sc.medName}</strong> — a partir de {formatDate(sc.effectiveFrom + "T00:00:00Z")}:{" "}
                    {sc.doseTimes.join(", ")} · {fmtNum(sc.unitsPerDose)} unid./dose
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Duration Block ───────────────────────────────────────────────────────────

function DurationBlock({
  stats,
}: {
  stats: ReportPayload["summary"]["durationStats"];
}) {
  const { currentAvg, maxSeconds, emergencyCount, deltaSeconds, previousAvg, direction } =
    stats;

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <p className="mt-0 mb-2 font-body text-sm font-semibold text-fg">
        Duração das crises tônico-clônicas
      </p>

      {currentAvg == null ? (
        <p className="m-0 font-body text-sm text-fg-muted">
          Sem durações de crises tônico-clônicas registradas neste período.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
            <DurationItem label="Média" value={fmtDuration(Math.round(currentAvg))} />
            <DurationItem
              label="Máxima"
              value={maxSeconds != null ? fmtDuration(maxSeconds) : "—"}
            />
            <DurationItem
              label="Acima de 1 min"
              value={String(emergencyCount)}
              danger={emergencyCount > 0}
            />
          </div>

          {/* Trend: slope direction + delta vs previous window */}
          <p className="mt-2.5 mb-0 font-body text-sm text-fg">
            <span className="text-fg-muted">Tendência:</span>{" "}
            <span className="font-semibold">{DIRECTION_LABEL[direction]}</span>
            {previousAvg == null ? (
              <span className="text-fg-muted">{" "}· sem período anterior</span>
            ) : (
              <DurationDelta deltaSeconds={deltaSeconds} previousAvg={previousAvg} />
            )}
          </p>
        </>
      )}
    </div>
  );
}

function DurationDelta({
  deltaSeconds,
  previousAvg,
}: {
  deltaSeconds: number | null;
  previousAvg: number | null;
}) {
  // Round the mean difference before testing its sign so a sub-second drift
  // reads as "estável" rather than "+0s".
  const rounded = deltaSeconds == null ? null : Math.round(deltaSeconds);
  if (previousAvg == null || rounded == null) return null;
  if (rounded > 0) {
    return (
      <span className="text-danger font-semibold">
        {" "}· ▲ +{fmtDuration(rounded)} vs anterior
      </span>
    );
  }
  if (rounded < 0) {
    return (
      <span className="text-success font-semibold">
        {" "}· ▼ −{fmtDuration(Math.abs(rounded))} vs anterior
      </span>
    );
  }
  return <span className="text-fg-muted">{" "}· estável vs anterior</span>;
}

function DurationItem({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="p-3 rounded-sm bg-bg-2">
      <p className="m-0 mb-1 font-body text-xs text-fg-muted">{label}</p>
      <p
        className={cn(
          "m-0 font-mono text-xl font-bold tracking-tight",
          danger ? "text-danger" : "text-fg"
        )}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Summary Item ─────────────────────────────────────────────────────────────

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-sm bg-bg-2">
      <p className="m-0 mb-1 font-body text-xs text-fg-muted">{label}</p>
      <p className="m-0 font-display text-xl font-bold text-fg tracking-tight">
        {value}
      </p>
    </div>
  );
}
