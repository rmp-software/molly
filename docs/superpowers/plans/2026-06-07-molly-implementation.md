# Molly — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Molly — a private, mobile-first PWA to manage one dog's epilepsy: fast seizure logging + trends, and medication stock control with a daily restock email digest.

**Architecture:** Single Next.js 14 (App Router) project. Prisma + Postgres (Neon). NextAuth single seeded user; everything behind middleware. All health data carries `dog_id` and flows through a dog-scoped data layer (`lib/scope.ts`) so multi-dog/multi-user are additive later. Stock is a manual ledger (restock/adjustment) with consumption computed on read from the active schedule. Restock alerts via Vercel Cron + Resend. UI mirrors the committed design bundle at `.design-system/molly-design-system/`. pt-BR UI, English code/routes.

**Tech Stack:** Next.js 14, TypeScript, Tailwind, Prisma, PostgreSQL (Neon), NextAuth, Resend, Vitest, `ics` (npm) or hand-rolled VEVENT, Recharts (or the bundle's BarChart recreated), Lucide React. Fonts via next/font/google (Bricolage Grotesque, Hanken Grotesk, IBM Plex Mono).

**Source of truth:** `app_spec.txt` (functional + design system) and `.design-system/molly-design-system/project/` (tokens, component JSX, working prototype `ui_kits/molly_app/`).

---

## Linear tracking

Project: **Molly — Epilepsy App** (`rmp-tech`). Parent: **RMP-151 — Build Molly v1**.
Each task below = one sub-issue; move it through Backlog → In Progress → Done as you execute.

| Task | Linear |
|---|---|
| 1 Project foundation & tooling | RMP-152 |
| 2 Data model & migrations | RMP-153 |
| 3 Design tokens, fonts & base components | RMP-154 |
| 4 Auth, app shell & nav (+ scope layer) | RMP-155 |
| 5 pt-BR formatting + dosing helpers | RMP-156 |
| 6 Schedule, stock & stats engines | RMP-157 |
| 7 Dog profile + weight log + mg/kg | RMP-158 |
| 8 Seizure logging + episode detail | RMP-159 |
| 9 Trends dashboard | RMP-160 |
| 10 Medications + stock ledger | RMP-161 |
| 11 Google Calendar (.ics) | RMP-162 |
| 12 Home dashboard | RMP-163 |
| 13 Restock alerts (cron + Resend) | RMP-164 |
| 14 Vet report export | RMP-165 |
| 15 PWA, polish & a11y | RMP-166 |
| (deferred) Dose checklist + adherence | RMP-150 |

---

## File Structure

```
molly/
├─ app_spec.txt                      # spec (source of truth)
├─ docker-compose.yml                # local Postgres 16
├─ init.sh                           # setup: compose up, install, prisma gen/migrate/seed
├─ prisma/
│  ├─ schema.prisma                  # all models
│  └─ seed.ts                        # single user + Dog (Molly)
├─ lib/
│  ├─ db.ts                          # Prisma client singleton
│  ├─ auth.ts                        # NextAuth config (CredentialsProvider)
│  ├─ scope.ts                       # getActiveDogId() + dog-scoped accessors  ← multi-tenancy seam
│  ├─ stock.ts                       # current-stock + days-remaining + status (PURE, tested)
│  ├─ schedule.ts                    # daily consumption, next-dose, ICS recurrence helpers (PURE)
│  ├─ stats.ts                       # seizure aggregates: per week/month, streak, breakdowns (PURE)
│  ├─ ics.ts                         # build .ics VCALENDAR/VEVENT for a schedule (PURE)
│  ├─ dosing.ts                      # mg/kg computation (PURE)
│  ├─ format.ts                      # pt-BR number/date formatting (PURE)
│  └─ email.ts                       # Resend wrapper + digest template
├─ middleware.ts                     # protect all non-auth routes
├─ app/
│  ├─ globals.css                    # design tokens (from bundle) + base layer
│  ├─ layout.tsx                     # fonts, ToastProvider, html lang=pt-BR
│  ├─ (auth)/login/page.tsx
│  ├─ (app)/layout.tsx               # app shell: header + TabBar + log sheet host
│  ├─ (app)/page.tsx                 # Home (Início)
│  ├─ (app)/medications/page.tsx     # Remédios
│  ├─ (app)/trends/page.tsx          # Tendências
│  ├─ (app)/seizures/[id]/page.tsx   # episode detail/edit
│  ├─ (app)/profile/page.tsx         # Molly profile + weight log
│  ├─ (app)/profile/report/page.tsx  # vet report (print)
│  ├─ components/                    # design-system components (Button, Card, …)
│  └─ api/                           # route handlers (see spec api_endpoints_summary)
└─ ...
```

---

## Conventions for every task

- **TDD for logic:** `lib/*.ts` pure functions get Vitest tests first. UI tasks use behavioral acceptance criteria + a Playwright/manual check (dev server screenshot at 390px).
- **Verify gate per task:** `npx tsc --noEmit` clean, `npx vitest run` green (where tests exist), dev server boots with zero console errors. UI tasks: a screenshot at iPhone width (390×844) matching the bundle prototype.
- **Commits:** conventional, frequent; never commit to `main` (work on `feature/molly-<task>` or one integration branch `feature/molly-build`).
- **DB↔API naming:** Prisma snake_case `@@map`; API outputs camelCase (per-route `toCamel` helpers). Never leak snake_case to the client.
- **pt-BR copy:** use the exact strings in `app_spec.txt` `<ui_copy_examples>`. Numbers via `lib/format.ts` (comma decimals).

---

## Task 1: Project foundation & tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `.env.example`, `docker-compose.yml`, `init.sh`, `vitest.config.ts`, `lib/db.ts`
- Create: `app/layout.tsx`, `app/globals.css` (minimal first; tokens land in Task 3)

- [ ] **Step 1: Scaffold Next.js + TS + Tailwind**

Run: `npx create-next-app@latest . --typescript --tailwind --app --eslint --src-dir=false --import-alias "@/*" --no-turbopack`
Expected: project files created, `npm run dev` boots on :3000.

- [ ] **Step 2: Add dependencies**

Run:
```bash
npm i @prisma/client next-auth resend lucide-react
npm i -D prisma vitest @vitejs/plugin-react jsdom @types/node
```

- [ ] **Step 3: docker-compose for local Postgres 16**

Create `docker-compose.yml`:
```yaml
services:
  db:
    image: postgres:16
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: molly
      POSTGRES_PASSWORD: molly
      POSTGRES_DB: molly
    volumes: ["postgres-data:/var/lib/postgresql/data"]
volumes:
  postgres-data:
```

- [ ] **Step 4: .env.example + .env**

Create `.env.example` (and copy to `.env`):
```
DATABASE_URL="postgresql://molly:molly@localhost:5432/molly"
NEXTAUTH_SECRET="dev-secret-change-me"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_EMAIL="lucas.rmagalhaes@gmail.com"
ADMIN_PASSWORD="molly123"
RESEND_API_KEY=""
ALERT_EMAIL_TO="lucas.rmagalhaes@gmail.com"
ALERT_EMAIL_FROM="Molly <onboarding@resend.dev>"
CRON_SECRET="dev-cron-secret"
```

- [ ] **Step 5: Prisma client singleton**

Create `lib/db.ts`:
```ts
import { PrismaClient } from "@prisma/client";
const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
```

- [ ] **Step 6: Vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "node", include: ["lib/**/*.test.ts"] } });
```
Add `"test": "vitest run"` to package.json scripts.

- [ ] **Step 7: init.sh**

Create `init.sh` (chmod +x): `docker compose up -d`, wait for DB, `npm install`, `npx prisma generate`, `npx prisma migrate dev --name init`, `npx prisma db seed`.

- [ ] **Step 8: Verify & commit**

Run: `docker compose up -d && npm run dev` → boots clean. `npx tsc --noEmit` → clean.
Commit: `chore: project foundation (next, prisma, tailwind, docker, vitest)`

---

## Task 2: Data model & migrations

**Files:** Create `prisma/schema.prisma`, `prisma/seed.ts`. Modify `package.json` (prisma.seed).

- [ ] **Step 1: Write `prisma/schema.prisma`** — all models from `app_spec.txt` `<database_schema>`, snake_case columns, `@@map`. Enums: `SeizureType {tonic_clonic, focal, absence, other}`, `Severity {mild, moderate, severe}`, `MedCategory {continuous, otc, compounded}`, `MedForm {pill, capsule, tablet}`, `StockTxType {restock, adjustment, consumption}`. Models: `User`, `Dog`, `WeightEntry`, `SeizureEpisode`, `Medication`, `MedicationSchedule`, `StockTransaction`. (`DoseLog` is DEFERRED — do NOT add; tracked in RMP-150.) Decimals: `units_per_dose`, `quantity`, `strength_mg`, `weight_kg` → `Decimal @db.Decimal(8,2)` (weight `(5,2)`). `dose_times String[]`. Every health model has `dog_id` FK + index.

```prisma
model Dog {
  id        String   @id @default(uuid())
  name      String
  breed     String?
  birthdate DateTime? @db.Date
  diagnosis String?
  vetName   String?  @map("vet_name")
  emergencyContact String? @map("emergency_contact")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  weights      WeightEntry[]
  seizures     SeizureEpisode[]
  medications  Medication[]
  @@map("dogs")
}
```
(Define the remaining models analogously, matching the spec field lists exactly.)

- [ ] **Step 2: Run migration**

Run: `npx prisma migrate dev --name init`
Expected: migration created under `prisma/migrations/`, tables exist.

- [ ] **Step 3: Write `prisma/seed.ts`** — upsert one `User` (ADMIN_EMAIL, bcrypt/scrypt password hash) and one `Dog` (name "Molly", breed "Golden retriever", diagnosis "Epilepsia idiopática"). Idempotent.

- [ ] **Step 4: Seed & verify**

Run: `npx prisma db seed` then `npx prisma studio` → User + Dog rows exist.
Commit: `feat: prisma schema + seed (user, Molly)`

---

## Task 3: Design tokens, fonts & base components

**Files:** Modify `app/globals.css`, `tailwind.config.ts`, `app/layout.tsx`. Create `app/components/{Button,Card,Input,StatusPill,TabBar,Counter,BarChart,MedStatusCard,Sheet,Toast}.tsx`, `app/components/icons.ts`.

- [ ] **Step 1: Tokens into globals.css** — paste the CSS variables from `.design-system/molly-design-system/project/tokens/{colors,typography,spacing}.css` into `@layer base :root` (and `[data-theme="dark"]`). Keep variable names verbatim.

- [ ] **Step 2: Fonts** — in `app/layout.tsx` load via `next/font/google`: Bricolage Grotesque → `--font-display`, Hanken Grotesk → `--font-body`, IBM Plex Mono → `--font-mono`. Set `<html lang="pt-BR">`, body uses `--font-body`.

- [ ] **Step 3: Tailwind aliases** — in `tailwind.config.ts` map the semantic CSS vars to Tailwind colors (`brand`, `fg`, `bg`, `surface`, `success`, `warning`, `danger`, …) and fontFamily (`display`, `body`, `mono`), radii, shadows.

- [ ] **Step 4: Recreate base components** — port each from `.design-system/.../project/components/**` JSX to TSX in `app/components/`, using Tailwind/token classes. Match the bundle visually: `Button` (primary/secondary/ghost/destructive + lg), `Card` (raised/highlighted), `Input`/`Textarea`, `StatusPill` (ok/reorder/urgent labels), `TabBar` (4 items + center FAB), `Counter`, `BarChart` (gold bars + annotations), `MedStatusCard` (WITHOUT the "Pedir mais" action — reorder dropped), `Sheet` (bottom sheet), `Toast` + `ToastProvider`/`useToast`.

- [ ] **Step 5: Verify & commit** — build a throwaway `/styleguide` page rendering each component; screenshot at 390px; compare to `ui_kits/molly_app`. `npx tsc --noEmit` clean.
Commit: `feat: design tokens, fonts, base components`

---

## Task 4: Auth, app shell & navigation

**Files:** Create `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `middleware.ts`, `lib/scope.ts`, `app/(auth)/login/page.tsx`, `app/(app)/layout.tsx`. Modify `app/layout.tsx` (ToastProvider).

- [ ] **Step 1: NextAuth CredentialsProvider** — `lib/auth.ts`: authorize() looks up the seeded `User`, verifies password hash, returns `{id,email}`. JWT session.

- [ ] **Step 2: Middleware** — `middleware.ts` with `withAuth`; matcher protects everything except `/login` and `/api/auth/*` and `/api/cron/*` (cron uses its own secret).

- [ ] **Step 3: Scope layer (multi-tenancy seam)** — `lib/scope.ts`:
```ts
import { prisma } from "@/lib/db";
/** v1: the sole Dog. Later: the dog selected in the session. */
export async function getActiveDogId(): Promise<string> {
  const dog = await prisma.dog.findFirstOrThrow({ orderBy: { createdAt: "asc" } });
  return dog.id;
}
export async function getActiveDog() {
  return prisma.dog.findFirstOrThrow({ orderBy: { createdAt: "asc" } });
}
```
All data-reading code MUST resolve the dog through this, never assume a singleton inline.

- [ ] **Step 4: Login page** — pt-BR form (email + senha), calls `signIn`, redirects to `/`. Design-system styled.

- [ ] **Step 5: App shell** — `app/(app)/layout.tsx`: per-tab header (greeting + subtitle), scrollable main, `TabBar` (Início/Remédios/Tendências/Molly + center "Crise" FAB), and a client host that opens the `LogSeizure` sheet from anywhere (FAB + home button). Tab labels pt-BR, routes English.

- [ ] **Step 6: Verify & commit** — log in, land on `/`, tabs route to `/medications` `/trends` `/profile`; unauthenticated hits `/login`.
Commit: `feat: auth, middleware, scope layer, app shell + nav`

---

## Task 5: pt-BR formatting + dosing helpers (pure, tested)

**Files:** Create `lib/format.ts`, `lib/format.test.ts`, `lib/dosing.ts`, `lib/dosing.test.ts`.

- [ ] **Step 1: Write failing tests for `format.ts`**
```ts
import { fmtNum, fmtKg, fmtDuration, fmtDateTimePt } from "./format";
test("comma decimals", () => { expect(fmtNum(28.5)).toBe("28,5"); expect(fmtNum(30)).toBe("30"); });
test("kg", () => expect(fmtKg(29.4)).toBe("29,4 kg"));
test("duration", () => { expect(fmtDuration(95)).toBe("1min 35s"); expect(fmtDuration(55)).toBe("55s"); });
```
- [ ] **Step 2: Run → FAIL.** `npx vitest run lib/format.test.ts`
- [ ] **Step 3: Implement `format.ts`** — use `Intl.NumberFormat("pt-BR")`; whole numbers drop decimals; duration `Nmin SSs`/`SSs`; pt-BR datetime.
- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Tests + impl for `dosing.ts`** — `mgPerKg(unitsPerDay, strengthMg, weightKg) => number|null` (null if no strength/weight). Test: `mgPerKg(2, 97.5, 29.4)` ≈ `6.63`.
- [ ] **Step 6: Commit** `feat: pt-BR format + mg/kg helpers (tested)`

---

## Task 6: Schedule, stock & stats engines (pure, tested)

These are the correctness core. Full TDD.

**Files:** Create `lib/schedule.ts`(+test), `lib/stock.ts`(+test), `lib/stats.ts`(+test).

- [ ] **Step 1: `schedule.ts` tests** — `dailyConsumption(schedule)` = `dose_times.length * units_per_dose`; `nextDose(schedules, now)` → `{medName, at}` for the soonest upcoming dose across active schedules; `activeScheduleOn(schedules, date)` picks the row whose `[effective_from, effective_to)` contains date.
```ts
test("daily consumption", () =>
  expect(dailyConsumption({ doseTimes: ["08:00","20:00"], unitsPerDose: 0.5 })).toBe(1));
```
- [ ] **Step 2: Run → FAIL → implement → PASS.**
- [ ] **Step 3: `stock.ts` tests** — given manual txns (restock/adjustment) + schedule history, compute:
  - `currentStock(txns, schedules, asOf)` = baseline since last restock/adjustment − consumed since that row (sum daily consumption per day using the schedule active each day). Fractional ok.
  - `daysRemaining(stock, dailyConsumption)` = `floor(stock / daily)` (Infinity/`null` if daily 0).
  - `reorderByDate(asOf, daysRemaining, leadTimeDays)`.
  - `status(daysRemaining, leadTimeDays, bufferDays=7)` → `"ok"|"reorder"|"urgent"` per spec thresholds (urgent ≤ lead; reorder ≤ lead+buffer; else ok).
```ts
test("status thresholds", () => {
  expect(status(3, 7)).toBe("urgent");
  expect(status(10, 7)).toBe("reorder");
  expect(status(30, 7)).toBe("ok");
});
test("recount adjustment resets baseline", () => { /* restock +30 day0, adjust →20 day5, daily 1 → stock day10 = 15 */ });
```
- [ ] **Step 4: Run → FAIL → implement → PASS.**
- [ ] **Step 5: `stats.ts` tests** — `perPeriod(episodes, "week"|"month", range)` buckets counts; `timeSinceLast(episodes, now)`; `longestGap(episodes)`; `breakdown(episodes)` by type/severity/hour; `markCluster(occurredAt, existing)` (≤24h). Use fixed input dates (no `Date.now()` in tests).
- [ ] **Step 6: Run → FAIL → implement → PASS.**
- [ ] **Step 7: Commit** `feat: schedule/stock/stats engines (tested)`

---

## Task 7: Dog profile + weight log + mg/kg surfacing

**Files:** Create `app/(app)/profile/page.tsx`, `app/api/dog/route.ts`, `app/api/weight/route.ts`, `app/api/weight/[id]/route.ts`, `app/components/WeightLog.tsx`.

- [ ] **Step 1: API** — `GET/PUT /api/dog` (scoped via `getActiveDog`), `GET/POST /api/weight`, `DELETE /api/weight/[id]`. camelCase output.
- [ ] **Step 2: Profile page** — profile card (paw avatar, name, "Golden retriever · N anos" from birthdate), info rows (Peso latest, Veterinária, Diagnóstico, Emergência), editable; weight log list + add + sparkline (Counter/BarChart-style); logout.
- [ ] **Step 3: Acceptance** — add a weight → appears, sparkline updates; latest weight feeds mg/kg later.
- [ ] **Step 4: Verify & commit** — screenshot 390px matches `MollyProfile` prototype. `feat: dog profile + weight log`

---

## Task 8: Seizure logging (sheet) + episode detail/edit

**Files:** Create `app/components/LogSeizure.tsx`, `app/api/seizures/route.ts`, `app/api/seizures/[id]/route.ts`, `app/(app)/seizures/[id]/page.tsx`. Modify `app/(app)/layout.tsx` (host the sheet).

- [ ] **Step 1: API** — `POST /api/seizures` (scoped; on create set `is_cluster` via `markCluster` against prior 24h); `GET /api/seizures?from=&to=`; `PUT`/`DELETE /api/seizures/[id]`. camelCase.
- [ ] **Step 2: LogSeizure sheet** — port `ui_kits/molly_app/LogSeizure.jsx`: grip + scrim, lead "Respire…", "Agora" time row (editable), duration stepper (±5s), type chips (Tônico-clônica/Focal/Ausência/Outra), notes, Cancelar / "Salvar registro". On save POST → close → toast "Anotado. Você cuidou bem da Molly."
- [ ] **Step 3: Episode detail/edit** — `/seizures/[id]`: show all fields, edit (severity, rescue-given, notes, duration, time, type), delete (ConfirmationModal). Emergency badge if duration > 5min; cluster badge.
- [ ] **Step 4: Acceptance** — log with 2 taps; second episode within 24h flags cluster; >5min shows emergência.
- [ ] **Step 5: Verify & commit** `feat: seizure logging sheet + episode detail`

---

## Task 9: Trends dashboard

**Files:** Create `app/(app)/trends/page.tsx`, `app/api/seizures/stats/route.ts`, `app/components/FrequencyChart.tsx`, `app/components/RecentEpisodes.tsx`. Reuse `lib/stats.ts`.

- [ ] **Step 1: Stats API** — `GET /api/seizures/stats?from=&to=&bucket=week|month` returns per-period counts, headline stats (média/mês, maior intervalo, total no ano, tempo desde a última), breakdowns, and medication-change markers (from `MedicationSchedule.effective_from` with change labels).
- [ ] **Step 2: Page** — "Frequência de crises" BarChart with med-change annotations ("Dose ajustada"), range chips (3m/6m/12m/Tudo, week/month toggle), 3 stat cards, "Registros recentes" list (→ `/seizures/[id]`).
- [ ] **Step 3: Acceptance** — changing a med schedule (Task 10) later shows a marker here; range filter recomputes.
- [ ] **Step 4: Verify & commit** `feat: trends dashboard`

---

## Task 10: Medications + stock ledger

**Files:** Create `app/(app)/medications/page.tsx`, `app/api/medications/route.ts`, `app/api/medications/[id]/route.ts`, `.../[id]/schedule/route.ts`, `.../[id]/restock/route.ts`, `.../[id]/adjust/route.ts`. Create `app/components/{MedForm,ScheduleForm,StockDialog,MedOverviewStrip}.tsx`. Reuse `lib/stock.ts`, `lib/schedule.ts`.

- [ ] **Step 1: API — CRUD + status** — `GET /api/medications` returns each active med with computed `currentStock`, `daysRemaining`, `reorderByDate`, `status`, active schedule, mg/kg (via latest weight). `POST` create (med + initial schedule + starting stock as first `restock` txn). `PUT/DELETE [id]`.
- [ ] **Step 2: API — schedule/stock** — `POST [id]/schedule` (close prior row `effective_to`, open new — drives trends markers + ics); `POST [id]/restock` (+N txn); `POST [id]/adjust` (recount → adjustment txn snapping to counted number).
- [ ] **Step 3: Page** — overview strip (em dia/reabastecer/acabando counts), `MedStatusCard` per med, "Adicionar remédio", per-card actions Repor estoque / Corrigir estoque / Editar agendamento (+ Google Agenda from Task 11).
- [ ] **Step 4: Acceptance** — create med (½×2/day, stock 30) → daysRemaining 30, status ok; advance/adjust → stock decrements fractionally; status colors at thresholds.
- [ ] **Step 5: Verify & commit** `feat: medications + stock ledger`

---

## Task 11: Google Calendar (.ics)

**Files:** Create `lib/ics.ts`(+test), `app/api/medications/[id]/calendar.ics/route.ts`. Modify medication card (add "Adicionar ao Google Agenda" + schedule-change re-add reminder).

- [ ] **Step 1: `ics.ts` tests** — `buildDoseIcs({medName, doseTimes, from})` → string with one `VEVENT` per dose time, `RRULE:FREQ=DAILY`, correct `DTSTART` (local time), valid `VCALENDAR` wrapper, CRLF line endings. Assert it contains each time + `FREQ=DAILY`.
- [ ] **Step 2: Run → FAIL → implement → PASS.**
- [ ] **Step 3: Route** — `GET /api/medications/[id]/calendar.ics` returns `text/calendar` attachment for the active schedule.
- [ ] **Step 4: UI** — "Adicionar ao Google Agenda" downloads the .ics; on schedule change, remind to remove the old event.
- [ ] **Step 5: Verify & commit** — import the .ics into Google Calendar manually; recurring events appear. `feat: dose .ics export`

---

## Task 12: Home dashboard

**Files:** Create `app/(app)/page.tsx`, `app/components/NextDoseCard.tsx`, `app/api/home/route.ts` (or compose from existing endpoints). Reuse `lib/schedule.ts` (nextDose), `lib/stats.ts` (timeSinceLast).

- [ ] **Step 1: Data** — resolve: time-since-last-seizure, next dose (nextDose across active schedules), mini "Crises por mês" series + trend hint, meds-needing-attention count.
- [ ] **Step 2: Page** — hero Counter ("14 dias" + "Você está cuidando bem dela."), "Registrar crise" primary (opens sheet) + caption, "Próxima dose" highlighted card ("Fenobarbital · hoje, 20h" + "em 3h"), "Crises por mês" mini chart.
- [ ] **Step 3: Acceptance** — matches `MollyHome` prototype; FAB + hero both open the log sheet.
- [ ] **Step 4: Verify & commit** `feat: home dashboard`

---

## Task 13: Restock alerts (Vercel Cron + Resend)

**Files:** Create `lib/email.ts`, `app/api/cron/restock-digest/route.ts`, `vercel.json` (cron schedule).

- [ ] **Step 1: Digest builder test** — pure `buildDigest(meds)` → returns `null` when nothing is amber/red, else a pt-BR subject+body listing each with "repor até" date. Test both branches.
- [ ] **Step 2: Run → FAIL → implement → PASS.**
- [ ] **Step 3: Cron route** — `GET /api/cron/restock-digest` checks `Authorization: Bearer $CRON_SECRET`; for each active med compute status; if any amber/red, send one Resend email to `ALERT_EMAIL_TO` (recipient resolved so it can move to per-user later). No email when all OK.
- [ ] **Step 4: vercel.json** — daily cron `0 12 * * *` → `/api/cron/restock-digest`.
- [ ] **Step 5: Verify & commit** — curl with the secret triggers/skips correctly. `feat: daily restock digest (cron + resend)`

---

## Task 14: Vet report export (PDF + CSV)

**Files:** Create `app/(app)/profile/report/page.tsx`, `app/api/report/route.ts`, `app/api/report/episodes.csv/route.ts`.

- [ ] **Step 1: API** — `GET /api/report?from=&to=` returns dog info + latest weight + episodes + summary stats + meds + schedule-change history in range. `GET /api/report/episodes.csv?from=&to=` returns CSV (pt-BR headers, comma-decimal-safe via `;` or quoting).
- [ ] **Step 2: Print page** — date-range picker → print-friendly pt-BR layout (`@media print`), "Salvar como PDF" guidance, CSV download button.
- [ ] **Step 3: Acceptance** — report renders for a range; CSV opens in a spreadsheet.
- [ ] **Step 4: Verify & commit** `feat: vet report export (pdf/csv)`

---

## Task 15: PWA, polish & a11y

**Files:** Create `app/manifest.ts`, app icons in `public/`. Modify components for states.

- [ ] **Step 1: PWA manifest + icons** — installable, mobile-first, theme color = brand.
- [ ] **Step 2: States** — empty states (no seizures/meds/weight) with calm pt-BR copy; loading skeletons; error toasts.
- [ ] **Step 3: A11y** — focus rings (`--focus-ring`), aria-labels on icon buttons, 44px targets, color never sole signal (icon+label on status).
- [ ] **Step 4: Design audit** — sweep every screen vs `.design-system` bundle + `app_spec.txt`; verify 390px and a desktop ≤640px centered.
- [ ] **Step 5: Verify & commit** `feat: pwa + polish + a11y`

---

## Deferred (NOT in this plan — tracked separately)

- **Dose checklist + adherence (DoseLog)** → Linear **RMP-150**.

---

## Self-review notes

- **Spec coverage:** auth(T4) · home(T12) · seizure log+flags(T8) · trends+markers(T9,T10) · meds+stock ledger(T10) · weight/mg-kg(T5,T7) · vet export(T14) · .ics(T11) · alerts(T13) · design system(T3) · multi-tenancy seam(T4 scope.ts) · PWA(T1,T15). DoseLog intentionally deferred.
- **Pure logic is TDD-first** (T5, T6, T11, T13); UI tasks use prototype-match acceptance + screenshots.
- **Type consistency:** `status()` returns `"ok"|"reorder"|"urgent"` used by `MedStatusCard` (T3) and meds API (T10); `getActiveDogId`/`getActiveDog` (T4) used by all scoped routes.
