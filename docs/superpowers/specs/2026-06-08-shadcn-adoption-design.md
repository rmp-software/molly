# shadcn Adoption — Design

Date: 2026-06-08
Status: Approved (pending plan)

## Problem

The app reimplements solved/commodity UI from scratch: the bottom-sheet/drawer
(`Sheet.tsx`), toasts (`Toast.tsx`), and charts (`BarChart`/`FrequencyChart`) are
all hand-rolled — fiddly, missing a11y/UX (no drag-to-dismiss, partial focus trap),
and more code to maintain. Root cause: no stated dependency philosophy + an
`app_spec.txt` that says "Recreate visually in app/," so build-from-scratch was the
default.

## Goal

Adopt shadcn/ui as the delivery mechanism for commodity UI, themed to the existing
warm/gold design system, and institutionalize a build-vs-buy rule so future work
reaches for established libraries by default. Buy commodity UI; keep native form
controls (better on mobile) and keep domain logic (`lib/`) bespoke. No visual
regression to the established aesthetic.

## Decisions (locked)

1. **Theming = alias layer.** Map shadcn's semantic tokens to existing tokens in
   `@theme inline` so shadcn components render the warm theme UNMODIFIED and stay
   CLI-updatable. (Not: hand-forking each component.)
2. **Scope.** Adopt: Drawer (Vaul), Toasts (Sonner), AlertDialog (destructive
   confirms), Charts (Recharts via shadcn `chart`). Keep: `Button`/`Card`/`Input`
   (already migrated), and native `<select>`/checkbox/date inputs (native mobile UX
   beats JS dropdowns).
3. **No destructive `init`.** Hand-wire `components.json` + manual `@theme` aliases;
   use `shadcn add` only (which writes component source + installs deps, leaving
   `globals.css` alone).
4. **Base library:** Radix (shadcn default).

## Foundation

- **`components.json`** (hand-created):
  - `style: "new-york"`, `rsc: true`, `tsx: true`, `iconLibrary: "lucide"`.
  - `tailwind`: `config: ""` (Tailwind v4 has no config file), `css: "app/globals.css"`,
    `baseColor: "neutral"`, `cssVariables: true`.
  - `aliases`: `components: "@/app/components"`, `ui: "@/app/components/ui"`,
    `utils: "@/lib/cn"`, `lib: "@/lib"`, `hooks: "@/app/hooks"`.
- **Alias tokens** appended to the `@theme inline` block in `globals.css` (existing
  `:root` tokens stay the source of truth):
  ```css
  --color-background: var(--bg);
  --color-foreground: var(--fg);
  --color-card: var(--surface);
  --color-card-foreground: var(--fg);
  --color-popover: var(--surface);
  --color-popover-foreground: var(--fg);
  --color-primary: var(--brand);
  --color-primary-foreground: var(--brand-on);
  --color-secondary: var(--bg-2);
  --color-secondary-foreground: var(--fg-2);
  --color-muted: var(--bg-2);
  --color-muted-foreground: var(--fg-muted);
  --color-accent: var(--brand-soft);
  --color-accent-foreground: var(--brand-press);
  --color-destructive: var(--danger);
  --color-border: var(--border);
  --color-input: var(--border-strong);
  --color-ring: var(--focus-ring);
  ```
  (Dark mode already flips the underlying `--bg/--fg/...` tokens, so the aliases
  inherit dark automatically.)
- **Add components:** `npx shadcn@latest add drawer sonner alert-dialog chart`
  → installs `vaul`, `sonner`, `recharts`, `radix-ui`, `class-variance-authority`;
  writes source into `app/components/ui/`.

## The four swaps — keep public APIs stable

- **Drawer:** rewrite `Sheet.tsx` to wrap shadcn `Drawer` (Vaul) while preserving the
  current `Sheet` props `{ open, onClose, title, children }`. All 5 callers
  (AppShell's Crise sheet, MedForm, ScheduleForm, StockDialog) unchanged. Keep grip
  handle + title/close header; gain drag-to-dismiss, snap, focus/scroll handling.
- **Toasts:** mount Sonner's `<Toaster />` in the root layout, themed to tokens
  (not `richColors` — use our own status colors via CSS).
  Reshape `useToast()` to a shim: `show(msg, { variant, duration })` →
  `toast[variant === "error" ? "error" : variant](msg, { duration })`. Call sites
  (`show(...)`) unchanged. Delete the hand-rolled context/portal/queue. Theme Sonner
  to tokens (bg-surface, border, status colors).
- **AlertDialog:** replace the two-tap delete pattern in `WeightLog` (per-entry
  delete) and `SeizureDetailClient` (episode delete) with a themed `AlertDialog`
  (trigger = the delete button; confirm = destructive action). Remove the
  `deleteConfirm`/timeout state those components carry.
- **Charts:** replace `BarChart` + `FrequencyChart` with shadcn `chart` (Recharts):
  `ChartContainer` + `ChartConfig` mapped to `--chart-bar`/`--chart-bar-strong`,
  `ChartTooltip` for tap tooltips, keep the med-change annotations (Recharts
  `ReferenceLine`). Keep `WeightLog`'s sparkline as hand SVG (too small to justify
  Recharts). `FrequencyChart`'s public props (`series`, `medChanges`, `height`) stay
  so HomeClient/TrendsClient are unchanged.

## Sequencing — 2 PRs

- **PR A — foundation + Drawer + Sonner + AlertDialog + docs.** The core
  "buy commodity UI" win; minor bundle impact (Vaul ~5KB, Sonner small, Radix
  dialog small). Includes the docs changes below.
- **PR B — charts → Recharts.** Isolated because it's the only bundle-significant
  change (~100KB). Report the bundle-size delta in the PR so the cost is explicit;
  easy to judge/revert on its own.

## Docs (in PR A)

- **`CLAUDE.md`:** add a `Dependencies / build-vs-buy` section — prefer established
  libraries for commodity problems (drawer/toast/dialog/charts via shadcn); keep
  native form controls on mobile; keep domain logic in `lib/` bespoke; justify any
  from-scratch UI. Note shadcn is wired via `components.json` + an `@theme` alias
  layer (don't run a blind `init`).
- **`app_spec.txt`:** reword `<components>`'s "Recreate visually in app/" → the
  `.design-system` bundle is a visual/behavioral reference; components may be backed
  by shadcn/established libraries.

## Verification

- Per swap: `npx tsc --noEmit` clean, `npm test` 169 green, no new lint.
- Visual + behavioral: **Playwright WebKit (iPhone-emulated)** screenshots and the
  **preview deploy** — Vaul drag/scroll feel and Sonner stacking need real-engine
  checks, not Chromium.
- PR B additionally: record the production bundle-size delta from Recharts.

## Out of scope

- No replacement of `Button`/`Card`/`Input` (already migrated/clean).
- No replacement of native `<select>`/checkbox/date with Radix (native mobile UX
  wins).
- No `react-hook-form`/`zod` forms migration (separate decision, low priority).
- No change to domain logic in `lib/`.

## Risks

- **Recharts bundle (~100KB).** Quarantined in PR B; decision deferred until the
  measured delta is visible.
- **shadcn defaults (zinc/Geist/dark, new-york).** Overridden by the alias layer +
  existing fonts; verify nothing leaks (especially Sonner's default styling and any
  base tokens).
- **Sonner variant mapping.** Ensure `warning`/`info` map to sensible Sonner calls
  (`toast.warning`, `toast.info`) and keep the 4s/6s durations callers pass.
