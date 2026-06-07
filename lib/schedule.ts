/**
 * Schedule engine — pure functions, no side effects.
 * All functions accept explicit Date arguments; never call Date.now() or new Date()
 * without explicit args.
 */

export interface Schedule {
  doseTimes: string[]; // "HH:MM" strings
  unitsPerDose: number;
  effectiveFrom: Date;
  effectiveTo: Date | null; // null = open-ended
}

/** Returns the total units consumed per day for a given schedule. */
export function dailyConsumption(s: Schedule): number {
  return s.doseTimes.length * s.unitsPerDose;
}

/**
 * Returns the schedule whose half-open interval [effectiveFrom, effectiveTo)
 * contains the given date (comparison is date-only; time portion is ignored).
 * effectiveTo === null means open-ended.
 * When multiple schedules match, the one with the latest effectiveFrom wins.
 * Returns null if no schedule matches.
 */
export function activeScheduleOn(
  schedules: Schedule[],
  date: Date
): Schedule | null {
  // Strip time: compare by year/month/day only using UTC-midnight values
  const dateKey = dateOnly(date);

  const matching = schedules.filter((s) => {
    const from = dateOnly(s.effectiveFrom);
    const to = s.effectiveTo !== null ? dateOnly(s.effectiveTo) : null;
    return dateKey >= from && (to === null || dateKey < to);
  });

  if (matching.length === 0) return null;

  // Tiebreak: latest effectiveFrom
  matching.sort((a, b) => dateOnly(b.effectiveFrom) - dateOnly(a.effectiveFrom));
  return matching[0];
}

/**
 * Returns the next dose time relative to `now`.
 *
 * Algorithm:
 *   1. Find the active schedule on now's date.
 *   2. Among its doseTimes, find the earliest time strictly after now's wall-clock.
 *   3. If none found today, find the active schedule on tomorrow and pick
 *      its earliest dose time.
 *   4. Returns null if no active schedule or no dose times.
 */
export function nextDose(
  schedules: Schedule[],
  now: Date
): { time: string; at: Date } | null {
  const todaySchedule = activeScheduleOn(schedules, now);

  if (todaySchedule && todaySchedule.doseTimes.length > 0) {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const todayTimes = [...todaySchedule.doseTimes].sort();

    for (const t of todayTimes) {
      const tMinutes = parseTimeMinutes(t);
      if (tMinutes > nowMinutes) {
        const at = buildDate(now.getFullYear(), now.getMonth(), now.getDate(), t);
        return { time: t, at };
      }
    }
  }

  // No dose remains today — look at tomorrow
  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );
  const tomorrowSchedule = activeScheduleOn(schedules, tomorrow);

  if (tomorrowSchedule && tomorrowSchedule.doseTimes.length > 0) {
    const sorted = [...tomorrowSchedule.doseTimes].sort();
    const t = sorted[0];
    const at = buildDate(
      tomorrow.getFullYear(),
      tomorrow.getMonth(),
      tomorrow.getDate(),
      t
    );
    return { time: t, at };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Returns the UTC-midnight timestamp for the date portion of d.
 * Using UTC avoids DST gaps when comparing calendar days.
 */
function dateOnly(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Parses "HH:MM" into total minutes from midnight. */
function parseTimeMinutes(t: string): number {
  const [hh, mm] = t.split(":").map(Number);
  return hh * 60 + mm;
}

/**
 * Constructs a local-time Date from year/month (0-based)/day and "HH:MM" string.
 * Uses explicit constructor args — never calls new Date() arglessly.
 */
function buildDate(
  year: number,
  month: number, // 0-based
  day: number,
  time: string
): Date {
  const [hh, mm] = time.split(":").map(Number);
  return new Date(year, month, day, hh, mm, 0, 0);
}
