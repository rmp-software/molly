/**
 * Restock digest builder and email sender.
 *
 * buildDigest – PURE function; no I/O. Fully covered by Vitest.
 * sendDigestEmail – sends via Resend; gracefully skipped when no API key.
 */

import { Resend } from "resend";

// ─── types ───────────────────────────────────────────────────────────────────

export interface DigestMed {
  name: string;
  status: "ok" | "reorder" | "urgent";
  daysRemaining: number | null;
  reorderByDate: string | null; // ISO date string YYYY-MM-DD or null
}

export interface DigestResult {
  subject: string;
  body: string;
  html: string;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Format an ISO date string (YYYY-MM-DD) as dd/mm/aaaa (pt-BR).
 * Parses the date as UTC-midnight so no timezone shifting occurs.
 */
function fmtDatePt(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

/** pt-BR pluralization for remédio / remédios */
function pluralizeMed(n: number): string {
  return n === 1 ? "1 remédio" : `${n} remédios`;
}

/** Urgency label and action phrase for each status */
function urgencyLabel(status: "reorder" | "urgent"): string {
  return status === "urgent" ? "⚠ Acabando" : "↻ Reabastecer em breve";
}

// ─── buildDigest ─────────────────────────────────────────────────────────────

/**
 * Build a pt-BR restock digest from a list of enriched medications.
 *
 * Returns null if no meds need action (all "ok").
 * Urgent meds appear first, then reorder meds.
 * Pure function — no I/O.
 */
export function buildDigest(
  meds: DigestMed[]
): DigestResult | null {
  const alertMeds = meds.filter((m) => m.status === "reorder" || m.status === "urgent");
  if (alertMeds.length === 0) return null;

  // Sort: urgent first, then reorder
  const sorted = [...alertMeds].sort((a, b) => {
    if (a.status === b.status) return 0;
    return a.status === "urgent" ? -1 : 1;
  });

  const subject = `Molly: ${pluralizeMed(alertMeds.length)} para repor`;

  const lines = sorted.map((m) => {
    const dateStr = m.reorderByDate ? fmtDatePt(m.reorderByDate) : "data desconhecida";
    const daysStr =
      m.daysRemaining != null
        ? `${m.daysRemaining} dias restantes`
        : "estoque desconhecido";
    const label = urgencyLabel(m.status as "reorder" | "urgent");
    return `${label} — ${m.name}: repor até ${dateStr} (${daysStr})`;
  });

  const body = [
    `${subject}`,
    "",
    ...lines,
    "",
    "—",
    "Molly — controle de saúde canina",
  ].join("\n");

  const htmlLines = sorted.map((m) => {
    const dateStr = m.reorderByDate ? fmtDatePt(m.reorderByDate) : "data desconhecida";
    const daysStr =
      m.daysRemaining != null
        ? `${m.daysRemaining} dias restantes`
        : "estoque desconhecido";
    const label = urgencyLabel(m.status as "reorder" | "urgent");
    const color = m.status === "urgent" ? "#b91c1c" : "#b45309";
    return `<li style="margin-bottom:8px;color:${color}">${label} — <strong>${m.name}</strong>: repor até ${dateStr} (${daysStr})</li>`;
  });

  const html = `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto">
  <h2 style="font-size:18px;color:#1e293b">${subject}</h2>
  <ul style="padding-left:20px">${htmlLines.join("")}</ul>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin-top:24px"/>
  <p style="font-size:12px;color:#94a3b8">Molly — controle de saúde canina</p>
</div>`.trim();

  return { subject, body, html };
}

// ─── sendDigestEmail ──────────────────────────────────────────────────────────

/**
 * Send the digest email via Resend.
 *
 * Gracefully returns { sent: false, skipped: reason } instead of throwing so
 * the cron handler is never crashed by email failures.
 */
export async function sendDigestEmail(
  to: string,
  subject: string,
  body: string,
  html?: string
): Promise<{ sent: boolean; skipped?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, skipped: "no api key" };
  }

  const from = process.env.ALERT_EMAIL_FROM ?? "Molly <onboarding@resend.dev>";

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to,
      subject,
      text: body,
      ...(html ? { html } : {}),
    });
    return { sent: true };
  } catch (err) {
    console.error("[sendDigestEmail] send failed:", err);
    return { sent: false, skipped: "email send failed" };
  }
}
