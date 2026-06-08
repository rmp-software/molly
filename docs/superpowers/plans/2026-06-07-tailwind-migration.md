# Tailwind Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (chosen: phased inline execution with checkpoints). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all inline `style={{…}}` styling with Tailwind v4 utilities, keeping inline `style` only for programmatic/dynamic values, with no visual change.

**Architecture:** Extend `@theme inline` so the existing design tokens become the utility vocabulary; add a `cn()` helper (clsx + tailwind-merge configured for custom token groups); convert the React primitives (`Button`, `Card`, `Input`) to className variant maps; then mechanically convert feature components and pages using a fixed conversion recipe. Verify each phase with `tsc`, lint, tests, and 390px screenshots for parity.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, `clsx`, `tailwind-merge`.

**Commit policy:** This repo only commits when the user asks. Treat each phase boundary as a checkpoint where the user reviews and decides whether to commit. Do not commit unprompted.

---

## Conversion Recipe (token → utility)

Apply this mapping when converting any inline style. Values not listed that already match Tailwind defaults (spacing) use the default utility; off-scale values use arbitrary `[...]`.

| Inline style | Utility |
|---|---|
| `background: var(--surface)` / `--bg` / `--bg-2` / `--surface-raised` | `bg-surface` / `bg-bg` / `bg-bg-2` / `bg-surface-raised` |
| `color: var(--fg)` / `--fg-2` / `--fg-muted` | `text-fg` / `text-fg-2` / `text-fg-muted` |
| `color/background: var(--brand)` / `--brand-soft` / `--brand-on` | `text-brand`/`bg-brand` / `bg-brand-soft` / `text-brand-on` |
| success/warning/danger/info (+ `-soft`) | `{text,bg}-success` … `{text,bg}-info-soft` |
| `border: 1px solid var(--border)` | `border border-border` |
| `border: 1.5px solid var(--border-strong)` | `border-[1.5px] border-border-strong` |
| `borderRadius: var(--radius-xs…pill)` | `rounded-xs … rounded-pill` |
| `boxShadow: var(--shadow-xs…lg / brand)` | `shadow-xs … shadow-lg / shadow-brand` |
| `fontFamily: var(--font-display/body/mono)` | `font-display / font-body / font-mono` |
| `fontSize: var(--text-2xs…5xl)` | `text-2xs … text-5xl` |
| `fontWeight: 400/500/600/700` | `font-normal/medium/semibold/bold` |
| `lineHeight: var(--lh-tight…relaxed)` | `leading-tight/snug/normal/relaxed` |
| `letterSpacing: var(--ls-*)` | `tracking-tight/snug/normal/wide/wider` |
| `padding/margin/gap: var(--space-N)` or rem multiples of .25 | `p-N`/`m-N`/`gap-N` (e.g. 1rem→`p-4`, 18px→`p-4.5`) |
| `display:flex; flexDirection:column` | `flex flex-col` |
| `display:grid; placeItems:center` | `grid place-items-center` |
| `alignItems/justifyContent` | `items-* / justify-*` |
| `position/inset/zIndex` | `absolute/fixed/relative`, `inset-0`, `z-[N]` |
| `minHeight:44px` / `48px` | `min-h-11` / `min-h-12` |
| `width:100%` | `w-full`; `maxWidth:100%`→`max-w-full`; `minWidth:0`→`min-w-0` |
| `transition: … var(--ease-standard)` | `transition-* ease-standard duration-[Nms]` (or arbitrary) |
| `var(--gold-300)` (raw palette, not semantic) | arbitrary `[var(--gold-300)]`, e.g. `border-[1.5px] border-[var(--gold-300)]` |
| `WebkitTapHighlightColor: transparent` | `[-webkit-tap-highlight-color:transparent]` |

**Conditional styles:** build a `Record<key, string>` of utility classes and select via `cn(base, map[key])`. Never use inline `style` ternaries for colors.

**Stays inline (last resort):** computed % widths, chart/SVG geometry, state-driven transforms (Sheet/drawer), per-render computed font sizes.

---

## Phase 1 — Foundation

### Task 1: Restart dev server & install deps

- [ ] **Step 1: Stop the existing dev server** (Turbopack didn't hot-reload `globals.css`)

Find and kill the `next dev` process (PID from `lsof -iTCP:3000 -sTCP:LISTEN`), then it will be restarted after deps install.

- [ ] **Step 2: Install class helpers**

Run: `npm install clsx tailwind-merge`
Expected: both added to `dependencies` in `package.json`.

- [ ] **Step 3: Restart dev server (background)**

Run: `npm run dev` (background). Confirm `http://localhost:3000` returns 307→/login or 200.

### Task 2: Create `cn()` helper

**Files:** Create `lib/cn.ts`

- [ ] **Step 1: Write the helper**

```ts
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge about our custom font-size and shadow tokens so that
// conflicting classes are de-duped by class order, not CSS source order.
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

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

### Task 3: Extend `@theme inline`

**Files:** Modify `app/globals.css` (inside the existing `@theme inline { … }` block, after the radii section)

- [ ] **Step 1: Add typography, shadow, leading, tracking, easing tokens**

```css
  /* Typography scale (custom — overrides Tailwind defaults where they differ) */
  --text-2xs: 0.6875rem;
  --text-xs:  0.75rem;
  --text-sm:  0.875rem;
  --text-base: 1rem;
  --text-lg:  1.125rem;
  --text-xl:  1.375rem;
  --text-2xl: 1.75rem;
  --text-3xl: 2.25rem;
  --text-4xl: 3rem;
  --text-5xl: 4rem;

  /* Line height */
  --leading-tight:   1.08;
  --leading-snug:    1.25;
  --leading-normal:  1.5;
  --leading-relaxed: 1.65;

  /* Letter spacing */
  --tracking-tight:  -0.02em;
  --tracking-snug:   -0.01em;
  --tracking-normal: 0;
  --tracking-wide:   0.04em;
  --tracking-wider:  0.08em;

  /* Shadows */
  --shadow-xs: 0 1px 2px rgba(53, 48, 39, 0.06);
  --shadow-sm: 0 1px 3px rgba(53, 48, 39, 0.08), 0 1px 2px rgba(53, 48, 39, 0.05);
  --shadow-md: 0 4px 12px rgba(53, 48, 39, 0.08), 0 2px 4px rgba(53, 48, 39, 0.05);
  --shadow-lg: 0 12px 28px rgba(53, 48, 39, 0.12), 0 4px 10px rgba(53, 48, 39, 0.06);
  --shadow-brand: 0 8px 20px rgba(178, 122, 34, 0.30);
  --shadow-focus: var(--focus-ring-shadow);

  /* Easing */
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-out:      cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in:       cubic-bezier(0.4, 0, 1, 1);
  --ease-spring:   cubic-bezier(0.34, 1.32, 0.64, 1);
```

Note: these reference values already defined in `:root`; duplicating the literals here is required because `@theme` tokens must be concrete for utility generation. Keep the `:root` definitions (used by remaining inline styles during migration and by dark-mode overrides).

- [ ] **Step 2: Verify utilities generate**

Reload `http://localhost:3000` and confirm via the browser that `text-2xs`, `shadow-brand`, `rounded-pill`, `leading-tight` resolve (check `document.styleSheets` contains the rules, or apply to a test element).
Expected: rules present (this also confirms the dev-server restart fixed the CSS reload).

### Task 4: Convert `Button`

**Files:** Modify `app/components/Button.tsx`

- [ ] **Step 1: Replace style objects with className maps**

```tsx
"use client";
import React from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  iconOnly?: boolean;
}

const base =
  "inline-flex items-center justify-center font-body font-bold leading-none " +
  "tracking-[-0.005em] rounded-pill border-[1.5px] border-transparent cursor-pointer " +
  "select-none whitespace-nowrap transition-[background,border-color,color,transform,box-shadow] " +
  "duration-[140ms] ease-standard [-webkit-tap-highlight-color:transparent] no-underline";

const sizeMap: Record<ButtonSize, string> = {
  sm: "min-h-10 px-3.5 py-[9px] text-sm gap-1.5",
  md: "min-h-12 px-[18px] py-3 text-base gap-2",
  lg: "min-h-14 px-6 py-4 text-lg gap-2.5",
};

const variantMap: Record<ButtonVariant, string> = {
  primary: "bg-brand text-brand-on shadow-sm",
  secondary: "bg-surface text-brand border-border-strong",
  ghost: "bg-transparent text-fg",
  destructive: "bg-danger text-[var(--neutral-0)] shadow-sm",
};

const iconOnlySize: Record<ButtonSize, string> = {
  sm: "w-10 p-0",
  md: "w-12 p-0",
  lg: "w-14 p-0",
};

export function Button({
  variant = "primary", size = "md", fullWidth = false, disabled = false,
  loading = false, icon, trailingIcon, iconOnly = false, className,
  children, ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        base, sizeMap[size], variantMap[variant],
        fullWidth && "w-full",
        iconOnly && cn(iconOnlySize[size], "aspect-square"),
        (disabled || loading) && "cursor-not-allowed opacity-45",
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner />}
      {!loading && icon && <span className="inline-flex flex-none">{icon}</span>}
      {!iconOnly && children}
      {!loading && trailingIcon && <span className="inline-flex flex-none">{trailingIcon}</span>}
    </button>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block w-[1.15em] h-[1.15em] rounded-full border-[2.5px] border-current border-t-transparent opacity-90"
      style={{ animation: "molly-spin 0.7s linear infinite" }}
    />
  );
}
```

Note: `animation` stays inline (keyframe utility not defined; acceptable last-resort). `text-[var(--neutral-0)]` because `neutral-0` is a raw palette token, not semantic.

- [ ] **Step 2: Typecheck + visual check**

Run: `npx tsc --noEmit` (expect 0). Screenshot `/medications` at 390px; the "Adicionar remédio" primary button and secondary action buttons must look identical to before.

### Task 5: Convert `Card` + `CardChip`

**Files:** Modify `app/components/Card.tsx`

- [ ] **Step 1: Replace with className maps (keep `data-card`, a11y logic, `as` prop)**

```tsx
const paddingMap: Record<CardPadding, string> = { sm: "p-3.5", md: "p-5", lg: "p-6" };

const variantMap: Record<CardVariant, string> = {
  default: "bg-surface border-border shadow-sm",
  flat: "bg-surface border-border shadow-none",
  raised: "bg-surface border-transparent shadow-md",
  highlighted: "bg-brand-soft border-[var(--gold-300)] shadow-none",
};

const base =
  "block border rounded-lg text-fg font-body " +
  "transition-[box-shadow,transform,border-color] duration-[220ms] ease-standard";
```
Compose on the element: `className={cn(base, paddingMap[padding], variantMap[variant], interactive && "cursor-pointer [-webkit-tap-highlight-color:transparent]", className)}`. Remove `cardStyle`/`style` object except passing through caller `style` (still allowed for callers that set dynamic values). Keep `data-card=""` and the existing `a11yProps` block unchanged.

`CardChip`:
```tsx
const chipToneMap: Record<CardTone, string> = {
  brand: "bg-brand-soft text-brand",
  ok: "bg-success-soft text-success",
  reorder: "bg-warning-soft text-warning",
  urgent: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};
// span: cn("w-10 h-10 rounded-xl flex-none grid place-items-center", chipToneMap[tone], className)
```
Note `border` default is 1px (`border-border`); `border-[1.5px]` only where the original used 1.5px (Card uses 1px — keep `border`).

- [ ] **Step 2: Typecheck + visual check**

Run: `npx tsc --noEmit` (expect 0). Screenshot `/profile` (cards, highlighted avatar card) and `/medications` (med cards + chips) — identical.

### Task 6: Convert `Input` + `Textarea`

**Files:** Modify `app/components/Input.tsx`

- [ ] **Step 1: Replace base style + remove JS focus handlers**

```tsx
const labelCls = "block text-sm font-semibold text-fg-2 mb-1.5 font-body";
const inputBase =
  "block w-full max-w-full min-w-0 min-h-12 px-3.5 py-3 text-base font-body text-fg " +
  "bg-surface border-[1.5px] border-border-strong rounded-md outline-none " +
  "transition-[border-color,box-shadow] duration-[140ms] ease-standard " +
  "[-webkit-tap-highlight-color:transparent] " +
  "focus:border-brand focus:shadow-focus";
const errorBorder = "border-danger focus:border-danger";
const hintCls = "text-xs text-fg-muted mt-[5px] font-body";
const errorCls = "text-xs text-danger mt-[5px] font-body";
```
- Input element: `className={cn(inputBase, leadingIcon && "pl-10", trailingIcon && "pr-10", error && errorBorder, className)}`.
- **Delete** the `onFocus`/`onBlur` handlers that mutated `style` (now handled by `focus:` utilities); keep forwarding `rest.onFocus`/`onBlur` only if a caller passed them — i.e. spread `{...rest}` still carries them. Remove the inline border/shadow mutation entirely.
- Leading/trailing icon spans: `absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted inline-flex pointer-events-none` (right-3 for trailing).
- Textarea: same base minus `min-h-12`, add `min-h-0 resize-y leading-normal`.

- [ ] **Step 2: Typecheck + verify focus**

Run: `npx tsc --noEmit` (expect 0). On `/profile` edit mode, focus an input — border turns brand + focus ring shows. Date input stays within the card (max-w-full/min-w-0 preserved).

### Phase 1 checkpoint
Run `npm test` (169 pass), `npx tsc --noEmit` (0). Screenshot `/styleguide`, `/`, `/medications`, `/profile` at 390px → parity. **Pause for user review.**

---

## Phase 2 — Feature components

Convert each file with the recipe. For each: replace inline `style` with `className={cn(...)}`, build className maps for any conditional colors, and leave dynamic values inline (noted per file). After each small group: `npx tsc --noEmit` + spot screenshot.

### Task 7: Simple presentational components
**Files:** `StatusPill.tsx`, `Logo.tsx`, `MedOverviewStrip.tsx`, `CardChip` callers, `TabBar.tsx`, `Toast.tsx`
- [ ] `StatusPill` — tone→className map (mirror `chipToneMap`).
- [ ] `Logo` — static utilities; SVG sizing attrs stay as props.
- [ ] `MedOverviewStrip` — the 3 count chips → tone map.
- [ ] `TabBar` — active/inactive link classes via `cn(base, active && activeCls)`; fixed positioning + safe-area inset stays (`pb-[env(safe-area-inset-bottom)]` utility OR inline if needed).
- [ ] `Toast` — variant→className map; entry animation (`molly-toast-in`) stays inline `style` (keyframe).
- [ ] Verify: `npx tsc --noEmit`; screenshot home (tab bar) + trigger a toast.

### Task 8: Status/metric cards
**Files:** `MedStatusCard.tsx`, `NextDoseCard.tsx`, `Counter.tsx`
- [ ] `MedStatusCard` — status→className maps for chip/progress color. **Progress-bar fill width % stays inline** (`style={{ width: `${pct}%` }}`).
- [ ] `NextDoseCard` — utilities; any countdown color via map.
- [ ] `Counter` — utilities for layout/colors; **`numSize` font-size stays inline** (computed `34px`/`56px`); `fontFeatureSettings` stays inline (no utility) → `[font-feature-settings:'tnum'_1,'zero'_1]` arbitrary is acceptable instead.
- [ ] Verify: screenshot `/` (NextDose, Counter) + `/medications` (MedStatusCard progress at various statuses).

### Task 9: Charts
**Files:** `BarChart.tsx`, `FrequencyChart.tsx`
- [ ] Convert container/label/axis text to utilities. **All SVG geometry (x/y/width/height/points/heights) stays inline/attributes** — that's programmatic.
- [ ] Verify: screenshot `/trends` and home frequency chart.

### Task 10: Overlay + form components
**Files:** `Sheet.tsx`, `LogSeizure.tsx`, `ScheduleForm.tsx`, `MedForm.tsx`, `StockDialog.tsx`, `WeightLog.tsx`
- [ ] `Sheet` — backdrop/panel utilities; **open/close transform + opacity transitions stay inline** (state-driven). Keep `z-[var(--z-sheet)]` (or `z-[300]`).
- [ ] `LogSeizure` — chips (type/severity) active state via `aria-pressed:`-style className maps; stepper already uses lucide icons; duration value color via map.
- [ ] `ScheduleForm`, `MedForm`, `StockDialog` — recipe; the Google-Agenda-style inline anchors (if any) → utilities matching Button secondary.
- [ ] `WeightLog` — recipe; sparkline SVG geometry stays inline; the flex `min-w-0` becomes `min-w-0` utility.
- [ ] Verify: open Crise sheet, schedule sheet, stock dialog, weight form — all parity; sheet open/close animates.

### Task 11: `AppShell.tsx`, `Providers.tsx`
- [ ] `AppShell` — layout container utilities (`max-w-[var(--app-max)] mx-auto`, header, main padding).
- [ ] `Providers` — usually no styles; verify nothing to convert.
- [ ] Verify: app frame parity across pages.

### Phase 2 checkpoint
`npm test`, `npx tsc --noEmit`, lint (no new issues). Screenshots of `/`, `/medications`, `/trends`, Crise sheet → parity. **Pause for user review.**

---

## Phase 3 — Pages / clients

### Task 12: Client pages
**Files:** `HomeClient.tsx`, `MedicationsClient.tsx`, `ProfileClient.tsx`, `TrendsClient.tsx`, `SeizureDetailClient.tsx`
- [ ] Convert each with the recipe. Conditional colors (status, severity) → className maps. Keep already-applied fixes (empty-state pill `mx-auto`, stepper icons, Google Agenda full-width button → re-express as utilities).
- [ ] Verify after each: `npx tsc --noEmit` + screenshot that page at 390px.

### Task 13: Route pages + layouts
**Files:** `profile/report/page.tsx`, `auth/login/page.tsx`, `(app)/layout.tsx`, `(app)/page.tsx`, `app/layout.tsx`, `styleguide/page.tsx`
- [ ] `report/page` — convert toolbar (re-express the Phase-fix layout as utilities), report content, table, `SummaryItem`. Keep `no-print`/`#report-content`/`@media print` CSS.
- [ ] `login/page` — recipe.
- [ ] `styleguide/page` — recipe (largest mechanical conversion; dev-only).
- [ ] layouts — minimal styles.
- [ ] Verify: screenshot `/profile/report`, `/login`, `/styleguide`.

### Phase 3 checkpoint
Full sweep: `npm test` (169), `npx tsc --noEmit` (0), `npx eslint app lib` (no new issues). Confirm **zero remaining `style={{` except the documented dynamic cases** — run `grep -rn "style={{" app | wc -l` and review each remaining one against the last-resort rule. **Pause for user review.**

---

## Phase 4 — Documentation

### Task 14: Add styling conventions to `app_spec.txt`
- [ ] Insert a `<styling_conventions>` block (near the existing tech/architecture section):
  - Utility-first Tailwind v4; design tokens are the utility vocabulary.
  - No raw hex and no `var(--…)` inside `style`; use semantic utilities (`bg-surface`, `text-fg`, …).
  - `cn()` (clsx + tailwind-merge) for conditional classes; primitives own their variants via className maps.
  - Inline `style` is a last resort, only for programmatic values (computed dimensions, chart/SVG geometry, state-driven transforms, per-render font sizes).
  - Min 44px tap targets; focus ring via `focus:shadow-focus` + global `:focus-visible`.

### Task 15: Create `CLAUDE.md`
- [ ] Create `CLAUDE.md` at repo root:
  - Project one-liner; dev commands (`npm run dev`, `npm test`, `npx tsc --noEmit`, Postgres via `docker compose`/`init.sh`).
  - Styling rules (condensed from `<styling_conventions>`), pointing to `app_spec.txt`.
  - Gotchas: Tailwind Preflight sets `svg{display:block}` (center icons with `mx-auto`/grid, not `text-center`); native date/time inputs overflow on iOS — `Input` already caps with `max-w-full min-w-0`; Turbopack may not hot-reload `globals.css` (restart dev server).

### Final checkpoint
`npm test`, `npx tsc --noEmit`, lint. Present summary. Offer commit (user-gated).

---

## Self-Review

- **Spec coverage:** Foundation (cn/theme/primitives) = Tasks 1–6; feature components = 7–11; pages = 12–13; spec+CLAUDE rules = 14–15; verification in every checkpoint; out-of-scope items respected (no cva, no hover redesign, no chart libs). ✔ All design sections mapped.
- **Placeholder scan:** No TBD/TODO; foundation code complete; recipe makes per-file conversions deterministic. Per-file tasks name exact files and call out which styles stay inline. ✔
- **Type consistency:** `cn()` signature stable; `ButtonVariant`/`CardVariant`/`CardTone` reuse existing exported types; className map keys match those union types. ✔
