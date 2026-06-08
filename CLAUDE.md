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
