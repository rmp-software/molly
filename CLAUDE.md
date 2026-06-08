# CLAUDE.md

Molly — a mobile-first PWA for managing a dog's epilepsy (seizure log, medication
stock/scheduling, weight, trends, vet report). Next.js 16 (App Router) · React 19 ·
Tailwind v4 · Prisma/Postgres · next-auth. Portuguese (pt-BR) UI.

The authoritative product + design spec is `app_spec.txt`. Read it before changing
user-facing copy, layout, or the design system.

## Commands

- `npm run dev` — start the dev server (Turbopack) on :3000
- `npm test` — Vitest unit tests (lib/**). Keep them green.
- `npx tsc --noEmit` — typecheck. Must be clean before committing.
- `npm run lint` — ESLint. There are pre-existing `react-hooks/set-state-in-effect`
  warnings; don't add new lint issues.

## Verifying UI changes (required)

**Unit/JS tests are necessary but never sufficient for UI work.** They don't prove a
component rendered, a chart drew, a layout held, or copy/contrast is right. Any change
that touches user-facing UI MUST also be verified by driving the running app:

- Use **Playwright** (the `playwright` MCP server is available) to load the affected
  route(s), assert the expected elements/text/state are actually present, and exercise
  the relevant interactions (range/filter toggles, forms, navigation).
- **Always test at a phone viewport** (e.g. iPhone ~390×844 / 393px wide) — NOT tablet
  or desktop. This is a mobile-first PWA; the phone is the real surface.
- **Capture screenshots and visually review them** for layout/overflow/contrast — a
  green assertion is not a passing render.
- **Visual jank is a blocker.** "Not broken but janky" — misalignment, overflow,
  clipped text, cramped spacing, bad wrapping, jumpy/unsettled charts — fails the gate
  even when the feature functionally works. Fix it before the change is considered done.
- Verify on **WebKit (iPhone-emulated)** as well as desktop (this is a mobile-first
  PWA; see the iOS native-date-input gotcha below — verify platform fixes on the real
  engine, not Chromium).
- Seed deterministic fixture data that covers the states the UI must show (empty,
  populated, edge/threshold cases) rather than relying on whatever is in the dev DB.
- Database: `./init.sh` (Docker Postgres on :5433 + Prisma migrate + seed), or
  `docker compose up -d` then `npx prisma migrate dev`. Admin login + DB creds are
  in `.env`.

## Styling rules (see `app_spec.txt` → `<styling_conventions>`)

- **Utility-first Tailwind v4.** The design tokens are the utility vocabulary, mapped
  in `app/globals.css` via `@theme inline` (e.g. `bg-surface`, `text-fg`, `rounded-md`,
  `text-2xs`, `shadow-brand`, `ease-standard`). Off-scale values use arbitrary syntax
  (`min-h-[44px]`).
- **No raw hex / no `var(--…)` in `style`.** Use semantic utilities. Raw palette tokens
  without a semantic name go via arbitrary values: `border-[var(--green-200)]`.
- **`cn()`** (`lib/cn.ts`, clsx + tailwind-merge) for conditional/variant classes —
  className lookups, not inline `style` ternaries. It's configured with the custom
  font-size/shadow groups so conflicting utilities dedupe by class order.
- **Primitives own their variants** (`Button`, `Card`, `Input`, …) via className maps.
- **Inline `style` is a last resort** — only for programmatic values (computed widths,
  per-render font sizes), SVG geometry, state-driven transforms, `@keyframes`
  animations, and `next/og` `ImageResponse` routes (Satori = inline only).

## Dependencies (build-vs-buy)

- **Buy commodity UI; build domain logic.** Before hand-rolling a *solved* problem
  (modals/drawers, toasts, dialogs, charts, focus traps, animations), reach for an
  established library. Keep domain logic (`lib/dosing`, `lib/stats`, `lib/schedule`,
  `lib/stock`) bespoke — that's the product.
- **shadcn/ui is the delivery mechanism for commodity UI.** Components live in
  `app/components/ui/` (you own/customize the source). Add with
  `npx shadcn@latest add <name>`. It's wired via `components.json` + an `@theme`
  **alias layer** in `globals.css` that maps shadcn's `--color-*` tokens to Molly's
  (`--bg`, `--fg`, `--brand`, …) so components inherit the warm theme.
  - **Do NOT run a blind `shadcn init`** — it rewrites `globals.css`. The config is
    already hand-wired; just `add`.
  - `utils` alias points at `@/lib/cn` (not the shadcn default `@/lib/utils`).
  - Currently in use: `drawer` (Vaul — backs `Sheet`), `sonner` (toasts — backs
    `Toast`/`useToast`), `alert-dialog` (destructive confirms), `chart` (Recharts).
- **Keep native form controls on mobile.** `<select>`, checkbox, and date/time inputs
  use the native OS pickers (better UX on iOS) — do not replace them with JS
  dropdowns.
- **Evaluate, don't reflex-install.** Judge a library on maintenance/adoption, bundle
  size, fit, a11y, and license; note the tradeoff. Recharts (~100KB) is the one heavy
  dep — justified by interactive charts.

## Gotchas

- **Tailwind Preflight sets `svg { display: block }`.** A bare lucide icon in a
  `text-center` container will NOT center (block elements ignore text-align). Center
  icons with `mx-auto` or a `grid place-items-center` wrapper.
- **Native date/time inputs overflow on iOS Safari.** The platform sizes them by the
  intrinsic width of `::-webkit-date-and-time-value`, ignoring `width`/`max-width`.
  Fix (in `globals.css`): on touch devices `@media (hover:none) and (pointer:coarse)`
  set `appearance: none`. `Input` also caps with `max-w-full min-w-0`. Desktop keeps
  its native picker. **This only reproduces on real iOS** — desktop Chromium AND desktop
  WebKit render a different, well-behaved widget.
- **Verify platform-specific fixes on the real engine/device, not a proxy.** For iOS
  rendering, use Playwright **WebKit** (iPhone-emulated) and/or a preview deploy — not
  Chromium.
- **Turbopack caches `globals.css` aggressively.** Editing it often won't hot-reload,
  and even a dev-server restart can serve stale CSS. Force a recompile with
  `rm -rf .next` then restart. (TSX changes hot-reload fine.) Custom `@theme` utilities
  are also JIT/content-scanned — they only generate once a class string appears in a
  scanned source file.

## Conventions

- Two `@theme` namespaces matter when adding tokens: define `--text-*`, `--shadow-*`,
  `--leading-*`, `--tracking-*`, `--ease-*` in the `@theme inline` block in
  `globals.css` so utilities generate. NOTE: this theme overrides some Tailwind
  defaults (e.g. `--radius-xl` is 28px, `text-xl` is 1.375rem) — check the value before
  assuming a default.
- Specs/design references live in `.design-system/` and `docs/superpowers/`.
