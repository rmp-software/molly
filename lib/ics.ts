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
 * Fold long lines per RFC5545 §3.1: lines > 75 octets must be folded
 * with CRLF + single leading space. Measures length in UTF-8 bytes so
 * multi-byte characters are never split across a fold boundary.
 * First line: max 75 bytes; continuation lines: max 74 bytes of content
 * (the leading space consumes 1 byte of the 75-octet limit).
 */
function foldLine(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;

  const chars = [...line]; // iterate Unicode code points, not UTF-16 code units
  let result = "";
  let currentBytes = 0;
  let currentChunk = "";
  let firstSegment = true;
  const limit = () => (firstSegment ? 75 : 74);

  for (const ch of chars) {
    const chBytes = enc.encode(ch).length;
    if (currentBytes + chBytes > limit()) {
      result += currentChunk;
      currentChunk = "\r\n " + ch;
      currentBytes = 1 + chBytes; // 1 byte for the leading space
      firstSegment = false;
    } else {
      currentChunk += ch;
      currentBytes += chBytes;
    }
  }
  result += currentChunk;
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
