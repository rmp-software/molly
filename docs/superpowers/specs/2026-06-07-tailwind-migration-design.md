# Tailwind Migration — Design

Date: 2026-06-07
Status: Approved (pending plan)

## Problem

Tailwind v4 is installed and configured (`@tailwindcss/postcss`, `@import "tailwindcss"`,
and an `@theme inline` block mapping the design tokens to color/font/radius utilities),
but it is almost entirely unused. The app sets style with inline `style={{…}}` objects
reading raw `var(--…)` tokens — ~300+ inline style blocks across ~28 files. Only two
`className` strings exist in the whole `app/` tree (`min-h-full flex flex-col` and the
custom `no-print`).

Consequences:
- The `@theme` utility mapping is dead weight; the app pays Tailwind's cost (Preflight
  reset is active — it caused the `svg { display:block }` centering bug) without the
  benefit (utilities).
- Styling is verbose, repetitive, and hard to keep consistent (every color/spacing value
  is hand-typed at each call site).

## Goal

Migrate all styling to Tailwind utilities. Inline `style` becomes a **last resort**,
allowed only for programmatic/dynamic values. Document the convention in `app_spec.txt`
and a new `CLAUDE.md`. No visual redesign — this is a faithful refactor with parity.

## Decisions (locked)

1. **Primitive pattern:** keep the React primitives (`Button`, `Card`, `Input`, …) and
   replace their inline style objects with **className variant maps** (cva-style, hand-rolled
   — no `cva` dependency yet), composed through `cn()`.
2. **Class helper:** `cn()` built on **`clsx` + `tailwind-merge`**. Configure
   `extendTailwindMerge` so custom token groups (font sizes like `text-2xs`, shadows like
   `shadow-brand`) dedupe correctly. Without this, two conflicting custom utilities would
   resolve by CSS source order rather than class order — a silent footgun.
3. **Theme tokens:** **extend `@theme inline`** so the design system *is* the utility
   vocabulary. Off-scale one-offs use arbitrary values (`min-h-[44px]`).
4. **Execution:** phased and sequential with verification checkpoints.

## Foundation

### `lib/cn.ts`
```ts
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["2xs", "xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl"] },
      ],
      shadow: [{ shadow: ["xs", "sm", "md", "lg", "brand", "focus"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```
Install: `clsx`, `tailwind-merge`.

### `@theme inline` additions (globals.css)
Add the custom scales that differ from Tailwind defaults so utilities match the design system:
- **Typography:** `--text-2xs … --text-5xl` (full custom scale — several differ from
  defaults, e.g. `--text-xl: 1.375rem`, `--text-2xl: 1.75rem`).
- **Shadows:** `--shadow-xs/sm/md/lg`, `--shadow-brand`, and a new `--shadow-focus`
  (= current `--focus-ring-shadow`) so `focus:shadow-focus` works.
- **Leading:** `--leading-tight/snug/normal/relaxed`.
- **Tracking:** `--tracking-tight/snug/normal/wide/wider`.
- **Easing:** `--ease-standard/out/in/spring`.

Already mapped (no change needed): colors, fonts, radii (incl. `rounded-pill`).
**Spacing needs nothing:** the app's `--space-*` equals Tailwind's default scale
(`p-4` = 1rem); v4 supports half-steps (`p-4.5` = 18px) and arbitrary values.

Raw `:root` token definitions and the dark-theme overrides stay — the `@theme` block
references them. `no-print` and `@media print` rules stay as-is.

### Primitives
- **Button:** `base` + `sizeMap` + `variantMap` + state classes (`disabled:`/`aria-busy`),
  `fullWidth`, `iconOnly` → all via `cn()`. Preserve current look (no new hover states).
- **Card:** variant classes (default/highlighted), keep `data-card` attribute (print CSS
  depends on it).
- **Input/Textarea:** base + label/hint/error classes; replace the `onFocus`/`onBlur` JS
  that mutated `style.borderColor`/`boxShadow` with `focus:border-brand focus:shadow-focus`.
  Keep `maxWidth/minWidth` fix as `max-w-full min-w-0` utilities.

## Phases

- **Phase 1 — Foundation:** restart dev server (Turbopack didn't hot-reload `globals.css`
  earlier); install deps; `lib/cn.ts`; extend `@theme`; migrate `Button`, `Card`, `Input`.
  Verify primitives render identically (styleguide + a couple of screens).
- **Phase 2 — Feature components:** `MedStatusCard`, `NextDoseCard`, `TabBar`, `Sheet`,
  `Toast`, `StatusPill`, `Logo`, `MedOverviewStrip`, `RecentEpisodes`, `Counter`,
  `BarChart`, `FrequencyChart`, `AppShell`, `LogSeizure`, `ScheduleForm`, `MedForm`,
  `StockDialog`, `WeightLog`, `Providers`.
- **Phase 3 — Pages/clients:** `HomeClient`, `MedicationsClient`, `ProfileClient`,
  `TrendsClient`, `SeizureDetailClient`, `profile/report/page`, `auth/login/page`,
  `styleguide/page`, layouts.

## When inline `style` stays (last-resort rule)

Allowed only for values that cannot be a utility class:
- Computed dimensions: progress-bar fill width %, chart bar heights, SVG geometry.
- Animation transforms: `Sheet`/drawer translate/opacity driven by state.
- Per-render computed sizes: `Counter` font size.

Everything else — including conditional/status colors — uses `cn()` with className lookups,
not inline ternaries on `style`.

## Spec & docs changes

- **`app_spec.txt`:** add a `<styling_conventions>` block: utility-first Tailwind; semantic
  tokens only (no raw hex / no `var(--…)` in `style`); `cn()` for conditionals; primitives
  own their variants; inline `style` reserved for programmatic values; 44px min tap targets.
- **`CLAUDE.md`** (new): concise version of the same rules so future agents comply, plus
  build/test/dev commands and the date-input/iOS overflow gotcha.

## Verification (each phase)

- `npx tsc --noEmit` clean.
- `npx eslint <changed>` — no *new* issues (pre-existing warnings unchanged).
- `npm test` — 169 tests stay green.
- Playwright at 390px: screenshot key screens, confirm **visual parity** vs pre-migration
  (only intended diffs are the already-applied date-input/centering fixes).

## Out of scope

- No visual redesign; no new hover/active states (unused `--brand-hover/press` tokens
  flagged as a follow-up, not changed now).
- No `cva` dependency (hand-rolled variant maps).
- No graph/animation libraries — that's the separate post-migration discussion.
