/**
 * pt-BR formatting helpers.
 *
 * All date/time formatters use timeZone: "America/Sao_Paulo" so output is
 * deterministic regardless of the host machine's local timezone.
 */

const PT_BR = "pt-BR";
const TZ = "America/Sao_Paulo";

/**
 * Format a number in pt-BR locale (comma decimal separator, dot thousands
 * separator).  Whole numbers show no decimal places; fractional values show
 * up to 2 significant decimal places.
 *
 * Examples:
 *   28.5   → "28,5"
 *   30     → "30"
 *   1234.5 → "1.234,5"
 */
export function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const isWhole = Number.isInteger(n);
  return new Intl.NumberFormat(PT_BR, {
    minimumFractionDigits: 0,
    maximumFractionDigits: isWhole ? 0 : 2,
  }).format(n);
}

/**
 * Format a weight in kilograms using pt-BR decimal notation.
 *
 * Example: 29.4 → "29,4 kg"
 */
export function fmtKg(n: number): string {
  return `${fmtNum(n)} kg`;
}

/**
 * Format a duration (in whole seconds) as a human-readable string.
 *
 * Rules:
 *   < 60 s  → "{s}s"
 *   ≥ 60 s  → "{m}min {s}s"   (e.g. 120 → "2min 0s", 95 → "1min 35s")
 *   ≤ 0 / NaN → "0s"
 */
export function fmtDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0s";
  const secs = Math.floor(totalSeconds);
  const minutes = Math.floor(secs / 60);
  const seconds = secs % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}min ${seconds}s`;
}

/**
 * Format a Date as a full pt-BR date + time string.
 * Uses timeZone "America/Sao_Paulo" for deterministic output.
 *
 * Example (UTC 2024-03-15T12:00:00Z → Sao Paulo 09:00):
 *   "15/03/2024, 09:00"
 */
export function fmtDateTimePt(d: Date): string {
  return new Intl.DateTimeFormat(PT_BR, {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/**
 * Format a Date as "dd/mm" (short date, no year) using Sao Paulo timezone.
 *
 * Example: 2024-03-15 → "15/03"
 */
export function fmtShortDate(d: Date): string {
  const parts = new Intl.DateTimeFormat(PT_BR, {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
  }).formatToParts(d);

  const day = parts.find((p) => p.type === "day")?.value ?? "??";
  const month = parts.find((p) => p.type === "month")?.value ?? "??";
  return `${day}/${month}`;
}
