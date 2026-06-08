# Trends insight upgrade — design

Date: 2026-06-08
Status: approved (pending spec review)

## Problem

The `/trends` dashboard shows a single **total** seizure-frequency bar chart plus
three stat cards. The owner cannot tell *how the condition is progressing* because:

- Frequency is undifferentiated by **type**. "1 crise/semana" is fine if focal,
  alarming if tônico-clônica (generalizada). The total bar hides composition.
- There is no view of **tônico-clônica duration** over time, even though duration
  is the key emergency signal (a tônico-clônica over ~1 min warrants the vet).
- The **"Tudo" (All)** range floors at `2000-01-01`, rendering ~26 years of empty
  buckets and crushing the meaningful recent data.

The vet report (`/profile/report`) has the same gap: it lists per-type counts but
no duration insight.

## Goals

1. Break frequency down **by type** (stacked bars) + a **by-type summary** list;
   omit types with zero episodes in range.
2. A **tônico-clônica duration** chart: average duration per period as a line, a
   dashed **1-minute emergency** reference line, a trend hint, and a **delta vs the
   previous period** stat card.
3. Fix **"Tudo"** to floor at the first episode (anchor `2024-01-01` as fallback).
4. Surface the duration insight in the **vet report** too.

## Decisions (from brainstorming Q&A)

- Type breakdown: **stacked bars + separate by-type summary** ("Both").
- Duration chart: **line + trend hint + 1-min threshold line**.
- Period comparison: **delta stat card** ("1m20s ▲ +18s vs anterior").
- "All" floor: **first episode**, fallback constant `2024-01-01` (the approximate
  start of her seizure history — *not* a birthdate; `Dog.birthdate` is unrelated).
- Emergency threshold on the duration chart is **60s** (per owner). The existing
  **5-min status-epilepticus badge** on episodes is unchanged — two separate things.

## Non-goals

- Severity and time-of-day charts (the stats engine already computes
  `bySeverity` / `byHour`, but they were not requested here).
- Changing the 5-min episode emergency badge or any logging flow.
- Backfilling seed episodes.

## Architecture

### A. Shared aggregation module — `lib/trends.ts` (new)

Today `app/(app)/trends/page.tsx` (server initial render) and
`app/api/seizures/stats/route.ts` (client refetch) **duplicate the entire
aggregation block** verbatim — fetch, `perPeriod`, stats, `medChanges`, `recent`.
Adding stacked-by-type + duration to both copies invites drift.

Extract one function:

```ts
buildTrendsPayload(allEpisodes: Episode[], opts: {
  from: Date; to: Date; bucket: "week" | "month"; now: Date;
  medSchedules: MedScheduleLite[];   // already-fetched, for medChanges
  recent: SerializedEpisode[];       // already-fetched newest 8
}): StatsResponse
```

It owns: `series` (existing total), **new** `typeSeries` (stacked), **new**
`durationSeries` + `durationStats`, `stats`, `breakdown`, `medChanges`,
`firstEpisodeAt`. Prisma calls stay in the route/page (server boundary); the module
is pure over already-fetched rows so it stays unit-testable.

`StatsResponse` gains:

```ts
typeSeries: { label: string; start: string; byType: Record<SeizureType, number>; total: number }[];
typesPresent: SeizureType[];               // types with >0 in range, ordered, for stacks+legend
durationSeries: { label: string; start: string; avgSeconds: number | null; n: number }[];
durationStats: {
  currentAvg: number | null;               // seconds, tônico-clônica only
  previousAvg: number | null;              // previous equal-length window
  deltaSeconds: number | null;             // currentAvg - previousAvg
  direction: "up" | "down" | "flat";       // slope across buckets
  emergencyCount: number;                  // tônico-clônica episodes >= 60s in range
  maxSeconds: number | null;
};
firstEpisodeAt: string | null;             // earliest occurredAt, ISO
```

### B. New pure functions — `lib/stats.ts` (TDD)

- `perPeriodByType(episodes, bucket, range)` →
  `{ label, start, byType, total }[]`. Reuses the existing week/month binning;
  counts per `SeizureType` within each bin.
- `typesPresent(episodes)` → ordered `SeizureType[]` with count > 0
  (canonical order: tonic_clonic, focal, absence, other).
- `avgDurationPerPeriod(episodes, bucket, range, type)` →
  `{ label, start, avgSeconds, n }[]`. Filters to `type` with non-null
  `durationSeconds`; `avgSeconds = null` when `n === 0` (renders as a gap, not 0).
- `durationStats(episodes, range, type, now)` → the `durationStats` shape above.
  - Previous window = `[from - (to-from), from)`.
  - `direction`: sign of the least-squares slope over non-null buckets
    (`|slope| < epsilon → "flat"`). `epsilon` ~ 1s/bucket.
  - `emergencyCount`: `type` episodes in range with `durationSeconds >= 60`.
- `firstEpisodeAt(episodes)` → earliest `occurredAt | null`.

All exported, all covered by Vitest (see Testing).

### C. "All" range fix

- Payload carries `firstEpisodeAt`.
- New constant `EPISODE_HISTORY_START = "2024-01-01"` (America/Sao_Paulo midnight)
  in `lib/seizure-types.ts` (alongside the other shared seizure constants).
- `TrendsClient.computeRange("all")` →
  `from = firstEpisodeAt ?? EPISODE_HISTORY_START`. The far-past `2000-01-01`
  literal is removed. On the very first server render the page passes
  `firstEpisodeAt` into `initial`, so "All" is correct without a roundtrip.

### D. UI — `TrendsClient.tsx` + components

- **`BarChart`** gains an optional **stacked mode**: `stacks?: { key, label, color }[]`
  → one `<Bar dataKey={key} stackId="t">` per stack; tooltip lists each type + total;
  highlight of the last bucket is dropped in stacked mode (composition matters more).
  Single-value mode is unchanged for any other caller.
- **`FrequencyChart`** maps `typeSeries` → stacked rows keyed by `typesPresent`,
  passes a `--chart-type-*` color per present type, renders a legend. Zero types are
  absent from `typesPresent`, so they never appear.
- **`TypeBreakdown`** (new): labeled horizontal bars (type label · count · bar),
  sorted desc, zeros omitted. Driven by `breakdown.byType` / `typesPresent`.
- **`DurationTrendChart`** (new): Recharts `LineChart` over `durationSeries`
  (`connectNulls={false}` so empty buckets gap). Dashed `ReferenceLine y={60}`
  labeled `1 min — emergência` in `--danger`; dots with `avgSeconds >= 60` painted
  `--danger`, else `--brand`. Y axis in `m:ss` via `fmtDuration`.
- **Duration delta stat card** (new, near the chart): big `currentAvg` as `m:ss`;
  delta row `▲ +18s vs anterior` — red ▲ when increasing, green ▼ when decreasing,
  neutral when flat/null; sub-label `duração média (tônico-clônica)`. A small
  secondary line shows `emergencyCount` ("N acima de 1 min") when > 0.
- Duration card + chart render only when ≥1 tônico-clônica episode **with a recorded
  duration** exists in range; otherwise a gentle empty state
  ("Sem durações de crises tônico-clônicas neste período.").

### E. Colors — `app/globals.css` `@theme`

Add warm-theme categorical type tokens (mapped to existing palette ramps):

- `--chart-type-tonic-clonic` → `--gold-400` (#CE9833)
- `--chart-type-focal` → `--blue-400` (#5891B5)
- `--chart-type-absence` → `--green-400` (#45AC6C)
- `--chart-type-other` → `--amber-300` (#F8C947)

Exposed as utilities only if needed; charts read the CSS vars directly (Recharts
`fill`/`stroke` accept `var(--…)`, consistent with the existing `--chart-bar`).

### F. Vet report — `/api/report` + report page

- `/api/report/route.ts`: add a `durationStats` block (reuse `durationStats()` from
  `lib/stats`) to the `summary` payload — `currentAvg`, `previousAvg`,
  `deltaSeconds`, `direction`, `emergencyCount`, `maxSeconds` for tônico-clônica.
  (Per-type counts already ship as `summary.byType`.)
- Report page (`profile/report/page.tsx`): add a **"Duração das crises
  tônico-clônicas"** block to the Resumo card — average, maximum, count ≥ 1 min
  (flagged in `--danger` when > 0), and the trend/delta line. Text/figure based for
  reliable printing; no canvas dependency. The existing "Por tipo" pills stay.

## Data flow

```
Prisma rows ──► (server page OR /api/seizures/stats)
                     │  fetch allEpisodes, medSchedules, recent
                     ▼
              buildTrendsPayload(allEpisodes, opts)   ← lib/trends.ts (pure)
                     │  uses lib/stats: perPeriod, perPeriodByType,
                     │  avgDurationPerPeriod, durationStats, typesPresent,
                     │  firstEpisodeAt, monthlyAverage, longestGap, breakdown
                     ▼
              StatsResponse ──► TrendsClient
                                  ├─ FrequencyChart (stacked, typesPresent colors)
                                  ├─ TypeBreakdown (summary)
                                  ├─ DurationTrendChart (+ 1-min line)
                                  └─ stat cards (+ duration delta card)

/api/report ──► durationStats() ──► report Resumo "Duração tônico-clônica" block
```

## Error / edge handling

- **Empty range / no episodes:** existing "Nenhuma crise registrada" empty state;
  duration card shows its own empty state; "All" floors at `EPISODE_HISTORY_START`.
- **All-null durations:** `durationSeries` all `null`, `currentAvg = null` → duration
  empty state; no divide-by-zero.
- **Single episode / single bucket:** `direction = "flat"`; `previousAvg` may be null
  → delta shown as "—".
- **Range shorter than a month (month bucket):** existing `perPeriod` handles partial
  bins; per-type binning mirrors it exactly (shared helper).
- **Type not present:** absent from `typesPresent` → no stack, no legend entry, no
  summary row.

## Testing

### Unit — Vitest (`lib/stats.test.ts`, new `lib/trends.test.ts`)

- `perPeriodByType`: counts split correctly per type per bucket; total = sum;
  out-of-range excluded; week vs month parity with `perPeriod` totals.
- `typesPresent`: omits zeros, canonical order.
- `avgDurationPerPeriod`: averages only matching type w/ non-null duration; `null`
  for empty buckets; ignores other types.
- `durationStats`: previous-window math; delta sign; `direction` slope (up/down/flat);
  `emergencyCount` boundary at exactly 60s (inclusive); `maxSeconds`.
- `firstEpisodeAt`: earliest; null when empty.
- `buildTrendsPayload`: shape/consistency (series totals match typeSeries totals;
  durationSeries length == series length).
- Edges: single episode, all-null durations, empty input, 1-bucket range.

### E2E + visual — Playwright (required for every UI change, not optional)

Unit/JS tests on pure functions are necessary but **not sufficient** — they never
prove the chart actually rendered, the legend laid out, or the layout didn't break.
Drive the running app and verify visually:

- Seed a deterministic fixture dataset covering the cases the charts must show:
  multiple types in one period (stacked bars), tônico-clônica durations both under
  and **≥ 60s** (threshold line + danger dots + emergency count), at least one empty
  bucket (line gap), and an episode near `EPISODE_HISTORY_START` (to exercise "All").
- On `/trends`, for each range chip (3m / 6m / 12m / **Tudo**) and bucket toggle
  (Mês / Semana):
  - assert the stacked frequency chart renders with one legend entry **per present
    type only** (zero types absent);
  - assert the by-type summary lists the same present types;
  - assert the duration chart shows the 1-min reference line and that points ≥ 60s
    are styled as emergencies; assert the delta stat card text
    ("… vs anterior") and the "N acima de 1 min" line when applicable;
  - assert **"Tudo"** does not render pre-2024 empty buckets.
- On `/profile/report`, assert the "Duração das crises tônico-clônicas" block shows
  avg / max / emergency count and the trend line.
- **Capture screenshots** of `/trends` (each range) and `/profile/report` and review
  them for layout/overflow/contrast — a passing assertion is not a passing render.
- Run on the **WebKit (iPhone-emulated)** project as well as desktop, per the
  CLAUDE.md iOS-rendering rule (native date inputs, etc.).

Gates: `npm test` green · `npx tsc --noEmit` clean · no new lint warnings ·
Playwright e2e green · screenshots captured and visually reviewed for `/trends`
(all ranges) and `/profile/report`.
