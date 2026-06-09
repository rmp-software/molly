---
slug: medication-edit-archive
status: planned
created: 2026-06-08
linear_project_id: e8a0cc19-bc1b-4780-a279-b976334a5291
linear_parent_issue: RMP-175
feature_branch: feature/medication-edit-archive
---

# Medication edit & archive — design

Date: 2026-06-08
Status: approved (brainstorming)

## Overview

The medications screen lets the owner add a med, manage stock (Repor / Corrigir),
and change the dose schedule (Agendamento), but there is **no way to edit the med's
own details** (name, concentration in mg, form, category, reorder lead time) and **no
way to retire a med** the vet has discontinued. The backend already supports both —
`PUT /api/medications/[id]` and a soft-delete `DELETE /api/medications/[id]` exist —
they're simply not wired into the UI.

This feature wires up editing and archiving, and takes the opportunity to **declutter
the med card**: today each card carries a row of 4–5 action buttons. We collapse all
per-med actions behind a single **⋯** button that opens an action drawer.

## Problem / motivation

- The owner's compounded med just had its **concentration (mg) changed by the vet** and
  there is no UI to update it. The displayed mg/dose and mg/kg/dia are now wrong.
- When the vet **discontinues** a med, the only options are to leave it cluttering the
  active list forever or lose it — there's no archive.
- The card's action row (Repor, Corrigir, Agendamento, Google Agenda) is already
  crowded; adding Editar + Arquivar inline would make it worse.

## Scope

**In scope:**
- Collapse all per-med actions into a single **⋯** → **action drawer** (a `Sheet`).
- **Fix the card subtitle wrap**: move the dose · times · mg/kg line to its own
  full-width line below the name+days header row so it stops wrapping mid-phrase.
- **Edit med** sheet: name, category, form, concentration (mg), reorder lead time →
  `PUT /api/medications/[id]`.
- **Archive med**: drawer action → confirm dialog → `DELETE /api/medications/[id]`,
  extended to also **close the open schedule** and stamp `archivedAt`.
- **Arquivados** collapsible section at the bottom of the list, with **Reativar**.
- **Report correctness**: archived meds still appear in the vet report when the dog was
  on them during the report range (current-meds list + dose-change list).
- Additive migration: `Medication.archivedAt`.

**Out of scope (explicit cuts):**
- Editing the dose / times — that already works via **Agendamento** and is untouched.
- Editing stock from the edit sheet — Repor / Corrigir own that.
- Hard delete — archive is soft only; there is no destroy-history path.
- Reactivating a med does **not** reopen its old schedule; the owner sets a fresh dose
  via Agendamento afterwards.
- Bulk actions / multi-select.

## Surfaces affected

- `app/(app)/medications/MedicationsClient.tsx` — modified: card loses its button row;
  add ⋯ trigger, action drawer, Arquivados section, edit/archive/reactivate wiring.
- `app/components/MedActionDrawer.tsx` — new: the per-med action sheet.
- `app/components/EditMedForm.tsx` — new: edit-details sheet (`PUT`).
- `app/components/MedForm.tsx` — modified: extract shared detail fields so create & edit
  don't drift.
- `app/components/MedStatusCard.tsx` — modified: host the ⋯ trigger; drop inline actions;
  move the dose subtitle to its own full-width line below the header row.
- `app/api/medications/[id]/route.ts` — modified: `DELETE` closes open schedule + stamps
  `archivedAt`; add reactivate path (see API surface).
- `app/api/medications/route.ts` — modified: support returning archived meds for the
  Arquivados section.
- `app/api/medications/enrich.ts` — modified: surface `isActive` / `archivedAt` on the
  enriched shape if not already present.
- `app/api/report/route.ts` — modified: include meds active during the range; drop the
  active-only filter on dose changes.
- `app/(app)/profile/report/page.tsx` — modified: render "Descontinuado em <data>".
- `prisma/schema.prisma` + migration — modified: add `archivedAt`.
- `lib/medications.ts` (or similar) — new/modified: pure `wasActiveDuring(med, from, to)`
  helper for the report filter (unit-tested).

## Data model

```prisma
model Medication {
  // … existing fields …
  isActive   Boolean   @default(true) @map("is_active")
  archivedAt DateTime? @db.Timestamptz(6) @map("archived_at")  // NEW
}
```

Additive migration, no backfill: existing rows stay `isActive = true`, `archivedAt =
null`. `isActive` remains the cheap query flag; `archivedAt` records the discontinuation
date used by the report and the Arquivados section. On archive both are set; on
reactivate `isActive = true` and `archivedAt = null`.

## API surface

```
DELETE /api/medications/:id            (archive — existing route, extended)
  → in one transaction:
      medication.update { isActive: false, archivedAt: now }
      close open schedule: medicationSchedule where effectiveTo=null → effectiveTo = today
  Response: { success: true }
  Errors: 401 unauth, 404 if not found / already archived

POST /api/medications/:id/reactivate   (NEW)
  → medication.update { isActive: true, archivedAt: null }
  Response: enriched med
  Errors: 401, 404. Does NOT reopen the closed schedule.

GET /api/medications?archived=1        (existing route, extended)
  → returns archived meds (isActive=false) for the Arquivados section.
  Default (no param) still returns active meds only.

PUT /api/medications/:id               (edit — existing, unchanged)
  Body: { name?, category?, form?, strengthMg?, reorderLeadTimeDays?, notes? }
```

## UI / Copy

Card collapses to info + a single **⋯** (top-right of the card header). Tapping it opens
an action drawer titled with the med name:

```
┌─ Fenobarbital ──────────────┐   ⋯ → ╔══════════════════════════╗
│ 97,5 mg · 2× ao dia         │      ║ Fenobarbital             ║
│ [███████░░] 12 dias       ⋯ │      ╠══════════════════════════╣
└─────────────────────────────┘      ║ Repor estoque            ║
                                     ║ Corrigir estoque         ║
                                     ║ Agendamento              ║
                                     ║ Adicionar ao Google Agenda║
                                     ║ Editar remédio           ║
                                     ║ Arquivar remédio   (danger)║
                                     ╚══════════════════════════╝
```

Selecting a row closes the action drawer and opens the matching flow (StockDialog /
ScheduleForm / EditMedForm), triggers the `.ics` download, or opens the archive confirm.

**Subtitle layout.** Today `200 mg/dose · 2× ao dia · 16,67 mg/kg/dia` sits in the
cramped middle column of the header row and wraps mid-phrase every time. Move it to its
own full-width line below the header so it gets the full card width.

**Days-remaining placement (updated from review, RMP-184).** With the inline action row
gone, the large header days block looked out of place, so it moves **below the stock bar**
into the bar's hierarchy — smaller, on the footer row beside the status pill (number keeps
the status color as the urgency cue). The header is now just icon · name · ⋯:

```
┌──────────────────────────────────┐
│ 💊  Fenobarbital              ⋯   │   header row: icon · name · ⋯
│ 200 mg/dose · 2× ao dia · 16,67 mg/kg/dia │  ← full-width subtitle (one line)
│ [████████████████████]            │   stock bar
│ (Estoque OK)            25 dias restantes │  footer: status pill · days-remaining
└──────────────────────────────────┘
```

Spacing requirement (explicit, from review): the subtitle must stay **visually tied to
the name** — tight intentional gap below the header, with clearly more separation before
the stock bar. The days number keeps `font-mono` + tabular figures (app_spec typography).
Verify the gap + footer alignment at phone width via screenshot before done.

Copy (pt-BR):
- Drawer rows: `Repor estoque`, `Corrigir estoque`, `Agendamento`,
  `Adicionar ao Google Agenda`, `Editar remédio`, `Arquivar remédio`.
- Edit sheet title: `Editar remédio`. Reuses Add-form field labels (Nome, Categoria,
  Forma, `Concentração (mg)`, `Dias de antecedência para reabastecer`).
- Archive confirm (alert-dialog): title `Arquivar Fenobarbital?` / body
  `O histórico é mantido e você pode reativar depois. O agendamento atual será encerrado
  hoje.` / confirm `Arquivar` / cancel `Cancelar`.
- Arquivados section header: `Arquivados` (collapsed by default; hidden if none). Each
  row: med name · `Descontinuado em <data>` · `Reativar`.
- Report: discontinued med shows `Descontinuado em <data>` under its name.

## Acceptance criteria

- [ ] Given any med card at phone width (~393px), when it renders, then the dose · times ·
      mg/kg subtitle sits on its own full-width line and does NOT wrap mid-phrase, with the
      subtitle visually grouped under the name (tight gap above, clear gap before the bar).
- [ ] Given a med card, when the owner taps ⋯, then an action drawer opens listing
      Repor, Corrigir, Agendamento, Adicionar ao Google Agenda, Editar, Arquivar.
- [ ] Given the action drawer, when the owner taps a row, then the drawer closes and the
      matching flow opens (or the `.ics` downloads / archive confirm opens).
- [ ] Given the edit sheet pre-filled from a med, when the owner changes the concentration
      and saves, then `PUT` succeeds and the card's mg/dose + mg/kg/dia reflect the new
      value.
- [ ] Given an active med, when the owner archives it and confirms, then it leaves the
      active list, its open schedule is closed with `effectiveTo = today`, and `archivedAt`
      is set.
- [ ] Given an archived med, when the owner opens Arquivados and taps Reativar, then the
      med returns to the active list with no open schedule (card shows "Sem agendamento
      ativo").
- [ ] Given a med that was active during a report range but later archived, when the report
      is generated, then the med still appears under Medicamentos atuais marked
      "Descontinuado em <data>", and its dose changes within range still appear under
      Alterações de dose no período.
- [ ] Given a never-archived med, when the report is generated, then its rendering is
      unchanged (no regression).
- [ ] `npx tsc --noEmit` clean; `npm test` green (incl. new `wasActiveDuring` unit tests);
      Playwright @ iPhone viewport verifies the drawer, edit, archive→Arquivados,
      reactivate, and report flows with screenshots reviewed for jank.

## Risks / open questions

- **Two-tap stock.** Repor/Corrigir go from one tap to two (via the drawer). Accepted by
  the owner in brainstorming in exchange for a clean card.
- **Concentration edit is retroactive.** `strengthMg` is a property of the med, not
  time-versioned, so editing it re-computes mg for *all* past schedules' display. Accepted
  for a single-dog home app; revisit only if historical mg accuracy ever matters.
- **Report "active during range" filter.** Must include meds archived mid-range without
  double-counting active ones; covered by the `wasActiveDuring` unit tests.
- **iOS drawer-over-drawer.** Opening a `Sheet` (target flow) right as the action `Sheet`
  closes can race on Vaul. Verify on WebKit (iPhone-emulated) per CLAUDE.md; sequence
  close→open if needed.

## Breakdown sketch

1. Schema migration + types: add `Medication.archivedAt`; surface `isActive`/`archivedAt`
   on the enriched shape.
2. API: extend `DELETE` (close schedule + stamp `archivedAt`); add
   `POST /api/medications/:id/reactivate`; `GET ?archived=1`.
3. `lib` pure helper `wasActiveDuring(med, from, to)` + unit tests.
4. Card refactor: ⋯ trigger + `MedActionDrawer`; move all actions into it; move the dose
   subtitle to a full-width line (fix the wrap + spacing).
5. `EditMedForm` + shared-field extraction from `MedForm`.
6. Archive confirm (alert-dialog) + Arquivados section + Reativar wiring.
7. Report correctness (`api/report` query + `report/page.tsx` "Descontinuado em").
8. Playwright e2e @ iPhone viewport + screenshot review.
