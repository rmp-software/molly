/**
 * ICS (iCalendar) builder for dose schedules.
 * Pure functions — no side effects, no Date.now(), fully deterministic.
 */

/** Escape RFC5545 TEXT value: \, \; \\ and \n */
function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/** Zero-pad a number to `width` digits. */
function pad(n: number, width = 2): string {
  return String(n).padStart(width, "0");
}

/**
 * Format a Date as iCal UTC stamp: YYYYMMDDTHHMMSSZ
 * Uses the date's local year/month/day and fixed 000000 time (derived from `from`).
 */
function formatDtstamp(from: Date): string {
  const y = pad(from.getFullYear(), 4);
  const mo = pad(from.getMonth() + 1);
  const d = pad(from.getDate());
  return `${y}${mo}${d}T000000Z`;
}

/**
 * Format a floating local-time DTSTART: YYYYMMDDTHHMMSS (no Z, no TZID).
 * Uses from's local year/month/day + parsed H:M from doseTime.
 */
function formatDtstart(from: Date, doseTime: string): string {
  const y = pad(from.getFullYear(), 4);
  const mo = pad(from.getMonth() + 1);
  const d = pad(from.getDate());
  const [hh, mm] = doseTime.split(":").map((x) => parseInt(x, 10));
  return `${y}${mo}${d}T${pad(hh)}${pad(mm)}00`;
}

/**
 * Fold long lines per RFC5545 §3.1: lines > 75 octets should be folded
 * with CRLF + single space. We fold at 75 chars (ASCII-only content here).
 */
function foldLine(line: string): string {
  const maxLen = 75;
  if (line.length <= maxLen) return line;
  let result = "";
  let pos = 0;
  while (pos < line.length) {
    if (pos === 0) {
      result += line.slice(0, maxLen);
      pos = maxLen;
    } else {
      result += "\r\n " + line.slice(pos, pos + maxLen - 1);
      pos += maxLen - 1;
    }
  }
  return result;
}

/** Join lines with CRLF endings and fold each line. */
function icsLines(lines: string[]): string {
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

export interface BuildDoseIcsOpts {
  medName: string;
  doseTimes: string[]; // "HH:MM"
  from: Date;
  uidSeed: string;
}

/**
 * Build a VCALENDAR string with one VEVENT per dose time.
 * - DTSTART is floating (no Z) so calendars use wall-clock time daily.
 * - RRULE:FREQ=DAILY repeats forever.
 * - UIDs are stable: ${uidSeed}-${HHMM}@molly
 * - DTSTAMP is derived from `from` at 00:00:00Z (deterministic).
 * - CRLF line endings throughout.
 */
export function buildDoseIcs(opts: BuildDoseIcsOpts): string {
  const { medName, doseTimes, from, uidSeed } = opts;

  const dtstamp = formatDtstamp(from);
  const summary = escapeText(medName);

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Molly//Doses//PT-BR",
    "CALSCALE:GREGORIAN",
  ];

  for (const time of doseTimes) {
    const hhmm = time.replace(":", ""); // e.g. "0800"
    const uid = `${uidSeed}-${hhmm}@molly`;
    const dtstart = formatDtstart(from, time);

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      "DURATION:PT15M",
      "RRULE:FREQ=DAILY",
      `SUMMARY:${summary} — dose`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");

  return icsLines(lines);
}
