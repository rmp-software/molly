# shadcn Adoption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (phased inline execution with checkpoints). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adopt shadcn/ui (themed to the existing tokens via an alias layer) to replace the hand-rolled drawer, toasts, destructive-confirm, and charts with established libraries — without visual regression.

**Architecture:** Hand-wire `components.json` + an `@theme` alias block (no destructive `init`), then `shadcn add` the components. Wrap shadcn primitives behind the existing component APIs (`Sheet`, `useToast`, `FrequencyChart`) so call sites don't change. Ship in two PRs: A = drawer + toasts + alert-dialog + docs; B = charts (isolated for the Recharts bundle cost).

**Tech Stack:** Next.js 16, React 19, Tailwind v4, shadcn/ui (Radix base), Vaul, Sonner, Recharts, cn() (clsx + tailwind-merge).

**Verification model:** This is UI integration, not unit-testable logic — so each task verifies with `tsc --noEmit`, `npm test` (169 stay green), no new lint, and Playwright **WebKit (iPhone-emulated)** + preview screenshots. Commits happen at PR boundaries (repo rule: commit when the user asks).

**Reference:** `docs/superpowers/specs/2026-06-08-shadcn-adoption-design.md`.

---

## File structure

- Create: `components.json` (shadcn config)
- Create (via CLI): `app/components/ui/{drawer,sonner,alert-dialog,chart}.tsx`
- Modify: `app/globals.css` (alias tokens), `app/components/Sheet.tsx` (wrap Drawer),
  `app/components/Toast.tsx` (Sonner shim), `app/layout.tsx` (Toaster mount stays via ToastProvider),
  `app/components/WeightLog.tsx` + `app/(app)/seizures/[id]/SeizureDetailClient.tsx` (AlertDialog),
  `app/components/BarChart.tsx` (Recharts) — `FrequencyChart.tsx` unchanged (delegates to BarChart),
  `CLAUDE.md`, `app_spec.txt`.

---

## Phase A — Foundation + Drawer + Sonner + AlertDialog + docs

### Task A1: Foundation (config + tokens + components)

**Files:** Create `components.json`; Modify `app/globals.css`.

- [ ] **Step 1: Create `components.json`**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/app/components",
    "ui": "@/app/components/ui",
    "utils": "@/lib/cn",
    "lib": "@/lib",
    "hooks": "@/app/hooks"
  }
}
```

- [ ] **Step 2: Append the alias token block** inside the `@theme inline { … }` block in `app/globals.css` (after the easing tokens, before the closing `}`):

```css
  /* shadcn alias layer — map shadcn's semantic tokens to Molly's tokens */
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

- [ ] **Step 3: Add components**

Run: `npx shadcn@latest add drawer sonner alert-dialog chart`
Expected: installs `vaul`, `sonner`, `recharts`, `radix-ui`, `class-variance-authority`;
creates `app/components/ui/drawer.tsx`, `sonner.tsx`, `alert-dialog.tsx`, `chart.tsx`.
If it complains about `components.json`, confirm Step 1 is at repo root.

- [ ] **Step 4: Restart dev server clean** (globals.css changed → Turbopack cache)

Run: `lsof -tiTCP:3000 -sTCP:LISTEN | xargs -r kill; rm -rf .next; npm run dev` (background)
Then `curl --retry-connrefused --retry 30 --retry-delay 1 -s -o /dev/null -w "%{http_code}" localhost:3000` → 307.

- [ ] **Step 5: Verify aliases + generated files**

Run: `npx tsc --noEmit` → exit 0. `ls app/components/ui`.
Probe in browser: a `bg-primary` element resolves to the brand color (rgb(178,122,34))
and `bg-card` to white — confirming the alias layer compiled.

### Task A2: Drawer — wrap shadcn `Drawer` behind the existing `Sheet` API

**Files:** Modify `app/components/Sheet.tsx`. Inspect `app/components/ui/drawer.tsx`.

- [ ] **Step 1: Confirm the generated drawer exports**

Run: `grep -n "export" app/components/ui/drawer.tsx`
Expected: `Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription, DrawerClose` (Vaul-backed). Note exact names; adjust Step 2 if they differ.

- [ ] **Step 2: Rewrite `Sheet.tsx` to wrap the Drawer, keeping the `{open,onClose,title,children}` API**

```tsx
"use client";

import React from "react";
import { X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/app/components/ui/drawer";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent className="max-h-[90dvh] bg-surface">
        {/* DrawerContent already renders the grip handle */}
        {title ? (
          <DrawerHeader className="flex-row items-center justify-between pt-2 px-5 pb-3">
            <DrawerTitle className="font-display font-semibold text-xl text-fg">
              {title}
            </DrawerTitle>
            <DrawerClose
              aria-label="Fechar"
              className="text-fg-muted grid place-items-center p-3 rounded-sm [-webkit-tap-highlight-color:transparent]"
            >
              <X size={20} />
            </DrawerClose>
          </DrawerHeader>
        ) : null}
        <div className={`overflow-y-auto flex-1 px-5 pb-6 ${title ? "pt-0" : "pt-3"}`}>
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
```

Note: keep the title-less branch padding (`pt-3`) to match the old Sheet. Remove the old
portal/scrim/focus/scroll-lock code entirely (Vaul handles all of it).

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` → 0. In WebKit (iPhone-emulated), open the Crise sheet
(center paw), the schedule sheet, and a stock dialog: each opens with the grip,
title+close, content scrolls, **drag-down dismisses**, Escape closes, backdrop closes.
Screenshot the Crise sheet — visually matches the prior bottom sheet.

### Task A3: Toasts — Sonner behind `useToast`

**Files:** Modify `app/components/Toast.tsx`. Inspect `app/components/ui/sonner.tsx`.

- [ ] **Step 1: Replace `Toast.tsx` internals with a Sonner shim** (keep `useToast` + `ToastProvider` exports so `app/layout.tsx` is unchanged)

```tsx
"use client";

import React from "react";
import { Toaster as SonnerToaster, toast } from "sonner";

export type ToastVariant = "success" | "warning" | "error" | "info";

export function useToast() {
  return {
    show: (
      message: string,
      { variant = "info", duration }: { variant?: ToastVariant; duration?: number } = {}
    ) => {
      const fn =
        variant === "success" ? toast.success
        : variant === "error" ? toast.error
        : variant === "warning" ? toast.warning
        : toast.info;
      fn(message, duration ? { duration } : undefined);
    },
  };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SonnerToaster
        position="bottom-center"
        offset={{ bottom: "calc(var(--tabbar-h) + var(--safe-bottom) + 12px)" }}
        toastOptions={{
          classNames: {
            toast:
              "!bg-surface !text-fg !border !border-border !rounded-md !shadow-md font-body",
            description: "!text-fg-muted",
            success: "!text-success",
            error: "!text-danger",
            warning: "!text-warning",
            info: "!text-info",
          },
        }}
      />
    </>
  );
}
```

Note: if the generated `app/components/ui/sonner.tsx` exports a pre-themed `Toaster`,
prefer importing that instead of raw `sonner` — check `grep export app/components/ui/sonner.tsx`
and adapt. Keep the `!` important prefixes only where Sonner's defaults would otherwise win.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` → 0. Trigger each variant (add a weight = success; submit empty
weight = error). Toast appears bottom-center above the tab bar, themed, auto-dismisses.
Old keyframe `molly-toast-in` is now unused — leave it (harmless) or remove from globals.css.

### Task A4: AlertDialog for destructive confirms

**Files:** Modify `app/components/WeightLog.tsx`, `app/(app)/seizures/[id]/SeizureDetailClient.tsx`. Inspect `app/components/ui/alert-dialog.tsx`.

- [ ] **Step 1: WeightLog — replace the two-tap delete with AlertDialog**

Remove `deleteConfirm` state + timer. Wrap the per-row delete button:

```tsx
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction,
} from "@/app/components/ui/alert-dialog";

// in the row, replacing the existing delete <Button>:
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="ghost" size="sm" iconOnly icon={<Trash2 size={16} />} aria-label="Remover peso" />
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Remover este peso?</AlertDialogTitle>
      <AlertDialogDescription>
        {fmtKg(entry.weightKg)} · {fmtDatePtBR(entry.measuredOn)}. Esta ação não pode ser desfeita.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction
        className="bg-danger text-[var(--neutral-0)]"
        onClick={() => doDelete(entry.id)}
      >
        Remover
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

Rename the existing `handleDelete` to a direct `doDelete(id)` that performs the fetch
(no confirm branch). Delete `deleteConfirm`, `deleteConfirmTimerRef`, and their effect.

- [ ] **Step 2: SeizureDetailClient — same pattern** for the "Excluir" button. Remove
  `deleteConfirm`/timer state; make the Excluir button an `AlertDialogTrigger asChild`;
  confirm action calls the existing delete fetch. Keep `deleting` loading state on the action.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` → 0; `npm test` → 169 pass. In the browser: deleting a weight
and an episode each opens a themed confirm dialog; Cancelar aborts, Remover/Excluir
performs the delete + toast. Focus is trapped and Escape cancels.

### Task A5: Docs

**Files:** Modify `CLAUDE.md`, `app_spec.txt`.

- [ ] **Step 1: `CLAUDE.md`** — add a `## Dependencies (build-vs-buy)` section:
  prefer established libraries for commodity UI (drawer/toast/dialog/charts via
  shadcn — `app/components/ui/`); keep native `<select>`/checkbox/date on mobile;
  keep domain logic in `lib/` bespoke; justify any from-scratch UI. shadcn is wired
  via `components.json` + an `@theme` alias layer — do NOT run a blind `shadcn init`
  (it rewrites globals.css). Add components with `npx shadcn@latest add <name>`.

- [ ] **Step 2: `app_spec.txt`** — in `<components>`, change the comment
  `<!-- Specs + JSX reference in .design-system/.../project/components/**. Recreate visually in app/. -->`
  to: `<!-- .design-system/** is a visual/behavioral reference. Components may be backed by
  shadcn/established libraries (see CLAUDE.md → Dependencies); match the spec's look/behavior. -->`

### Phase A checkpoint

Run `npx tsc --noEmit` (0), `npm test` (169), `npx eslint app` (no new issues),
`grep -rn "style={{" app --include=*.tsx | grep -v ui/` to confirm no regressions.
WebKit + preview screenshots of: Crise sheet (drag), a toast, a delete confirm.
**Commit (2 commits: feat shadcn drawer/toast/dialog; docs) + push + open PR A. Pause for review.**

---

## Phase B — Charts → Recharts

### Task B1: BarChart → shadcn chart (Recharts)

**Files:** Modify `app/components/BarChart.tsx`. Inspect `app/components/ui/chart.tsx`.
`FrequencyChart.tsx` unchanged (it only forwards `data`/`annotations` to `BarChart`).

- [ ] **Step 1: Confirm chart exports** — `grep -n export app/components/ui/chart.tsx`
  (expect `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartConfig`).

- [ ] **Step 2: Rewrite `BarChart.tsx`** keeping its props (`data`, `height`,
  `showValues`, `gridLines`, `annotations`, `ariaLabel`, `className`) using Recharts:

```tsx
"use client";
import React from "react";
import { Bar, BarChart as RBarChart, CartesianGrid, XAxis, YAxis, ReferenceLine, Cell, LabelList } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/app/components/ui/chart";
import { cn } from "@/lib/cn";

export interface BarChartDataPoint { label: string; value: number; highlight?: boolean }
export interface BarChartAnnotation { index: number; label: string }
export interface BarChartProps {
  data?: BarChartDataPoint[]; height?: number; showValues?: boolean;
  gridLines?: number; annotations?: BarChartAnnotation[]; ariaLabel?: string;
  className?: string; style?: React.CSSProperties;
}

const config: ChartConfig = { value: { label: "Crises", color: "var(--chart-bar)" } };

export function BarChart({
  data = [], height = 160, annotations = [],
  ariaLabel = "Frequência de crises ao longo do tempo", className, style,
}: BarChartProps) {
  return (
    <ChartContainer
      config={config}
      className={cn("w-full", className)}
      style={{ height, ...style }}
      aria-label={ariaLabel}
    >
      <RBarChart data={data} margin={{ top: 16, right: 4, bottom: 4, left: 4 }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false}
          tick={{ fill: "var(--fg-muted)", fontSize: 11 }} />
        <YAxis hide />
        {annotations.map((a) => (
          <ReferenceLine key={a.index} x={data[a.index]?.label}
            stroke="var(--info)" strokeDasharray="3 3"
            label={{ value: a.label, fill: "var(--info)", fontSize: 10, position: "top" }} />
        ))}
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" radius={5}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.highlight ? "var(--chart-bar-strong)" : "var(--chart-bar)"} />
          ))}
        </Bar>
      </RBarChart>
    </ChartContainer>
  );
}
```

- [ ] **Step 3: Verify** — `npx tsc --noEmit` → 0. Home mini-chart and Trends chart
  render with bars, grid, month labels, the highlighted last bar, med-change annotation
  lines, and tap tooltips. Screenshot both at 390px.

### Phase B checkpoint

`npx tsc --noEmit` (0), `npm test` (169), lint clean. **Measure bundle delta:**
`npm run build` before/after and compare the route First Load JS for `/` and `/trends`
(report the kB added by Recharts). **Commit + push + open PR B with the bundle number. Pause for review.**

---

## Self-Review

- **Spec coverage:** alias layer = A1; scope (drawer/toast/alertdialog/charts) = A2/A3/A4/B1;
  keep Button/Card/Input + native controls = untouched (not in any task) ✓; no destructive init
  = A1 (hand-wired components.json) ✓; 2-PR split = checkpoints ✓; docs = A5 ✓;
  verification incl. WebKit + bundle delta = checkpoints ✓. All spec sections mapped.
- **Placeholder scan:** generated shadcn component internals are intentionally produced by the
  CLI (not placeholders); every task we author shows full code or exact commands. The two
  "check generated exports then adapt" steps are explicit verification, not vague TODOs. ✓
- **Type consistency:** `Sheet {open,onClose,title,children}`, `useToast().show(msg, {variant,duration})`,
  `BarChart`/`FrequencyChart` prop names all preserved from current code → call sites unchanged. ✓
