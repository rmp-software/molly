"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Download, RefreshCw } from "lucide-react";
import { Button } from "@/app/components/Button";
import { Card } from "@/app/components/Card";
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
  // "to" dates use end-of-day so episodes on that calendar day are included
  return endOfDay ? dateStr + "T23:59:59.999Z" : dateStr + "T00:00:00.000Z";
}

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
    setFromDate(pendingFrom);
    setToDate(pendingTo);
    fetchReport(pendingFrom, pendingTo);
  }

  const csvHref = fromDate && toDate
    ? `/api/report/episodes.csv?from=${dateInputToIso(fromDate)}&to=${dateInputToIso(toDate, true)}`
    : "/api/report/episodes.csv";

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "0 20px 40px" }}>
      {/* Toolbar (hidden in print) */}
      <div
        className="no-print"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft size={16} />}
          onClick={() => router.back()}
          style={{ flexShrink: 0 }}
        >
          Voltar
        </Button>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", flex: 1 }}>
          <label
            style={{ fontSize: "var(--text-sm)", color: "var(--fg-muted)", fontFamily: "var(--font-body)" }}
          >
            De
          </label>
          <input
            type="date"
            value={pendingFrom}
            onChange={(e) => setPendingFrom(e.target.value)}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              padding: "6px 10px",
              borderRadius: "var(--radius-sm)",
              border: "1.5px solid var(--border-strong)",
              background: "var(--surface)",
              color: "var(--fg)",
            }}
          />
          <label
            style={{ fontSize: "var(--text-sm)", color: "var(--fg-muted)", fontFamily: "var(--font-body)" }}
          >
            Até
          </label>
          <input
            type="date"
            value={pendingTo}
            onChange={(e) => setPendingTo(e.target.value)}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              padding: "6px 10px",
              borderRadius: "var(--radius-sm)",
              border: "1.5px solid var(--border-strong)",
              background: "var(--surface)",
              color: "var(--fg)",
            }}
          />
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={handleUpdate}
            loading={loading}
          >
            Atualizar
          </Button>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <Button
            variant="secondary"
            size="sm"
            icon={<Printer size={14} />}
            onClick={() => window.print()}
            title="Abre o diálogo de impressão do navegador. Escolha 'Salvar como PDF' para exportar."
          >
            Salvar como PDF
          </Button>
          <a href={csvHref} download>
            <Button
              variant="secondary"
              size="sm"
              icon={<Download size={14} />}
            >
              Baixar CSV
            </Button>
          </a>
        </div>
      </div>

      {/* Print hint (hidden in print) */}
      <p
        className="no-print"
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--fg-muted)",
          fontFamily: "var(--font-body)",
          marginBottom: "16px",
          marginTop: "-8px",
        }}
      >
        Dica: &ldquo;Salvar como PDF&rdquo; abre o diálogo de impressão do navegador — escolha &ldquo;Salvar como PDF&rdquo; para exportar.
      </p>

      {/* Loading / error states */}
      {loading && !report && (
        <p style={{ fontFamily: "var(--font-body)", color: "var(--fg-muted)", textAlign: "center", padding: "40px 0" }}>
          Carregando relatório…
        </p>
      )}
      {error && (
        <p style={{ fontFamily: "var(--font-body)", color: "var(--danger)", padding: "16px 0" }}>
          {error}
        </p>
      )}

      {/* ─── Report Content ────────────────────────────────────────────────── */}
      {report && (
        <div id="report-content">
          {/* Header */}
          <div style={{ marginBottom: "24px", borderBottom: "2px solid var(--border)", paddingBottom: "16px" }}>
            <h1
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-2xl)",
                fontWeight: 700,
                color: "var(--fg)",
                letterSpacing: "-0.02em",
              }}
            >
              {report.dog.name}
            </h1>
            <p style={{ margin: "4px 0 0", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--fg-muted)" }}>
              {[
                report.dog.breed,
                report.dog.birthdate ? `Nascimento: ${formatDate(report.dog.birthdate)}` : null,
                computeAge(report.dog.birthdate) ? `(${computeAge(report.dog.birthdate)})` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {report.dog.diagnosis && (
              <p style={{ margin: "4px 0 0", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--fg)" }}>
                <strong>Diagnóstico:</strong> {report.dog.diagnosis}
              </p>
            )}
            {report.dog.vetName && (
              <p style={{ margin: "4px 0 0", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--fg)" }}>
                <strong>Veterinária:</strong> {report.dog.vetName}
              </p>
            )}
            {report.dog.emergencyContact && (
              <p style={{ margin: "4px 0 0", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--fg)" }}>
                <strong>Emergência:</strong> {report.dog.emergencyContact}
              </p>
            )}
            {report.latestWeightKg != null && (
              <p style={{ margin: "4px 0 0", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--fg)" }}>
                <strong>Peso atual:</strong> {fmtKg(report.latestWeightKg)}
              </p>
            )}

            <p style={{ margin: "12px 0 0", fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.01em" }}>
              Relatório de crises
            </p>
            <p style={{ margin: "4px 0 0", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--fg-muted)" }}>
              Período: {formatDate(report.range.from)} – {formatDate(report.range.to)}
            </p>
            {generatedAt && (
              <p style={{ margin: "2px 0 0", fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--fg-muted)" }}>
                Gerado em: {fmtDateTimePt(generatedAt)}
              </p>
            )}
          </div>

          {/* Summary block */}
          <Card style={{ marginBottom: "20px" }}>
            <h2
              style={{
                margin: "0 0 12px",
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-lg)",
                fontWeight: 700,
                color: "var(--fg)",
              }}
            >
              Resumo
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <SummaryItem label="Total de crises" value={String(report.summary.total)} />
              <SummaryItem
                label="Média por mês"
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
              <div style={{ marginBottom: "12px" }}>
                <p style={{ margin: "0 0 6px", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--fg)" }}>
                  Por tipo
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {Object.entries(report.summary.byType).map(([type, count]) => (
                    <span
                      key={type}
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-sm)",
                        padding: "3px 10px",
                        borderRadius: "var(--radius-pill)",
                        background: "var(--brand-soft)",
                        color: "var(--brand)",
                      }}
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
                <p style={{ margin: "0 0 6px", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--fg)" }}>
                  Por severidade
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {Object.entries(report.summary.bySeverity).map(([sev, count]) => (
                    <span
                      key={sev}
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-sm)",
                        padding: "3px 10px",
                        borderRadius: "var(--radius-pill)",
                        background: "var(--bg-2)",
                        color: "var(--fg-2)",
                      }}
                    >
                      {sev === "unknown" ? "Não informada" : (SEVERITY_PT[sev] ?? sev)}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Episodes table */}
          <Card style={{ marginBottom: "20px", overflowX: "auto" }}>
            <h2
              style={{
                margin: "0 0 12px",
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-lg)",
                fontWeight: 700,
                color: "var(--fg)",
              }}
            >
              Crises no período ({report.episodes.length})
            </h2>
            {report.episodes.length === 0 ? (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--fg-muted)" }}>
                Nenhuma crise registrada neste período.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-sm)",
                    color: "var(--fg)",
                  }}
                >
                  <thead>
                    <tr>
                      {["Data/hora", "Tipo", "Duração", "Severidade", "Cluster", "Resgate", "Observações"].map(
                        (h) => (
                          <th
                            key={h}
                            style={{
                              textAlign: "left",
                              padding: "6px 10px",
                              borderBottom: "1.5px solid var(--border)",
                              color: "var(--fg-muted)",
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {report.episodes.map((ep, idx) => (
                      <tr
                        key={ep.id}
                        style={{
                          background: idx % 2 === 0 ? "transparent" : "var(--bg-2)",
                        }}
                      >
                        <td style={{ padding: "6px 10px", whiteSpace: "nowrap" }}>
                          {fmtDateTimePt(new Date(ep.occurredAt))}
                        </td>
                        <td style={{ padding: "6px 10px", whiteSpace: "nowrap" }}>
                          {typeLabelPt(ep.type as Parameters<typeof typeLabelPt>[0])}
                        </td>
                        <td style={{ padding: "6px 10px", whiteSpace: "nowrap" }}>
                          {ep.durationSeconds != null ? fmtDuration(ep.durationSeconds) : "—"}
                        </td>
                        <td style={{ padding: "6px 10px", whiteSpace: "nowrap" }}>
                          {ep.severity ? (SEVERITY_PT[ep.severity] ?? ep.severity) : "—"}
                        </td>
                        <td style={{ padding: "6px 10px" }}>
                          {ep.isCluster ? "Sim" : "Não"}
                        </td>
                        <td style={{ padding: "6px 10px" }}>
                          {ep.rescueGiven ? "Sim" : "Não"}
                        </td>
                        <td style={{ padding: "6px 10px", maxWidth: "200px", wordBreak: "break-word" }}>
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
            <Card style={{ marginBottom: "20px" }}>
              <h2
                style={{
                  margin: "0 0 12px",
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-lg)",
                  fontWeight: 700,
                  color: "var(--fg)",
                }}
              >
                Medicamentos atuais
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {report.medications.map((med, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--bg-2)",
                    }}
                  >
                    <p style={{ margin: 0, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "var(--text-base)", color: "var(--fg)" }}>
                      {med.name}
                      {med.strengthMg != null && (
                        <span style={{ fontWeight: 400, color: "var(--fg-muted)", marginLeft: "6px" }}>
                          {fmtNum(med.strengthMg)} mg
                        </span>
                      )}
                    </p>
                    <p style={{ margin: "2px 0 0", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--fg-muted)" }}>
                      {[
                        CATEGORY_PT[med.category] ?? med.category,
                        FORM_PT[med.form] ?? med.form,
                      ].join(" · ")}
                    </p>
                    {med.activeSchedule && (
                      <p style={{ margin: "4px 0 0", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--fg)" }}>
                        <strong>Horários:</strong> {med.activeSchedule.doseTimes.join(", ")} · {fmtNum(med.activeSchedule.unitsPerDose)} unid./dose
                        {" "}<span style={{ color: "var(--fg-muted)" }}>(desde {formatDate(med.activeSchedule.effectiveFrom + "T00:00:00Z")})</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Dose-change history */}
          {report.scheduleChanges.length > 0 && (
            <Card style={{ marginBottom: "20px" }}>
              <h2
                style={{
                  margin: "0 0 12px",
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-lg)",
                  fontWeight: 700,
                  color: "var(--fg)",
                }}
              >
                Alterações de dose no período
              </h2>
              <ul style={{ margin: 0, padding: "0 0 0 16px", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--fg)", lineHeight: 1.7 }}>
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

// ─── Summary Item ─────────────────────────────────────────────────────────────

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "var(--radius-sm)",
        background: "var(--bg-2)",
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-xs)",
          color: "var(--fg-muted)",
          marginBottom: "4px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-xl)",
          fontWeight: 700,
          color: "var(--fg)",
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </p>
    </div>
  );
}
