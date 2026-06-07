# Molly — Design (Canine Epilepsy Management)

Date: 2026-06-07
Status: Approved (brainstorming complete)
Full implementation spec: ../../../app_spec.txt

## Problem

Manage one dog's (Molly's) epilepsy in two streams: (1) log seizures fast in stressful
moments and see whether frequency is trending up/down to inform vet conversations about
medication; (2) control medication stock so meds — especially a compounded med with ~1
week reorder lead time — never run out unexpectedly.

## Decisions & rationale

| Decision | Choice | Why |
|---|---|---|
| Stack | Next.js + Prisma + Postgres (Neon) + Vercel, mobile-first PWA | Mirrors the owner's existing Crema Arena stack; reuse conventions. |
| Repo | Standalone `molly` repo, own Vercel project + Neon DB | Unrelated to work projects; clean separation. |
| Locale | pt-BR UI + vet export; English code/DB | Matches owner + vet; same convention as Crema Arena. |
| Mobile | Hard mobile-first constraint, desktop secondary | App used on phone ~99% of the time; seizure logging is one-handed/urgent. |
| Episode fields | date/time, type, duration, severity, cluster, rescue-given, notes | All optional except time+type so "log now" stays fast. |
| Cluster/emergency | Auto-flag cluster (≤24h apart); flag >5 min episodes | Clinical emergency signals surfaced without extra input. |
| Stock model | Auto-decrement from schedule + manual restock/adjust (ledger) | Hybrid minus the checklist (deferred); low daily effort, auditable. |
| Stock storage | Ledger: current stock = SUM(transactions), Decimal | Fractional doses (½ pill) make stock fractional; recounts are adjustments. |
| Med forms | Pills/capsules/tablets, whole-unit stock, decimal doses | Owner's meds are pills; doses can be halves. |
| Alerts | Daily Vercel Cron → Resend email (amber/red only) + live dashboard | Reliable on any phone without PWA push; no notification noise. |
| Trends | Frequency over time + med-change markers + time-since-last + breakdowns | "Med-change markers" need a schedule-change history; that history is the data model. |
| Weight/dosing | Weight log + mg/kg + soft under-dose hint | Dog AED dosing is weight-based; informational, never prescriptive. |
| Vet export | Print-to-PDF HTML + episodes CSV | Dependency-light, mobile-friendly, vet-readable. |
| Google Calendar | .ics / add-link (no OAuth) | One-click add to any calendar; avoids OAuth surface/secrets. |
| Auth | Single seeded user, everything behind middleware | Personal, private; deployed on a public URL. |

## Explicitly cut from v1

- **Dose checklist + adherence (DoseLog)** — deferred to v2; tracked in Linear. Data model
  leaves room (`dose_logs` table sketched but not built).
- **Reorder / "Pedir mais" purchase reminder** — dropped. The daily email digest + the dashboard
  status already tell you when to reorder; a manual reminder is redundant. (The design-bundle
  MedStatusCard has a "Pedir mais" action — omit it when implementing.)
- **Cost tracking** on restocks — dropped.
- **Rescue-med-as-its-own-stock** — only a boolean `rescue_given` flag on episodes for v1.
- **Full Google Calendar API / OAuth** — using .ics instead.
- **Web push notifications** — using email digest instead.

## Design system (locked)

Handoff bundle from claude.ai/design committed at `.design-system/molly-design-system/` and
folded into `app_spec.txt`'s `design_system` section. Golden-retriever brand: deep bronze gold
(`#B27A22`) kept distinct from the brighter status amber (`#E5A50A`). Fonts: Bricolage Grotesque
(display) / Hanken Grotesk (body) / IBM Plex Mono (numbers). Working click-through prototype in
`.design-system/.../project/ui_kits/molly_app/` — implement against `app/`, mirror it visually.

Refinements the prototype introduced (now in the spec):
- **Four seizure types** — Tônico-clônica / Focal / Ausência / Outra (was generalized/focal).
- **Nav** — Início · Remédios · Tendências · Molly + center "Crise" paw FAB.
- **"Próxima dose"** card on home (derived from active schedules).
- **Richer dog profile** — breed, age, diagnosis, vet, emergency contact.
- **Status labels/thresholds** — Estoque OK / Reabastecer em breve / Acabando, driven by per-med
  lead time (prototype's fixed 4/14-day cutoffs were illustrative).

## Out of scope / non-goals

- Not a medical device; never prescribes. Multi-dog / multi-user not needed (modeled as a
  Dog entity so it's not painted into a corner, but single dog/user in practice).

## Next

1. Design system session in Claude design (fills the TBD `design_system` section).
2. writing-plans → implementation plan.
