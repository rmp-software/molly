# Molly — Design brief (prompt for Claude design)

Paste the block below into Claude design (claude.ai/design) to generate the design system.
The output fills the `design_system` section of `../app_spec.txt`.

Context: Molly is a golden retriever — the brand leans into a warm golden palette. Key trap to
avoid: brand-gold colliding with status-amber (reorder warnings). They must read differently
side by side.

---

```
I'm building a personal mobile-first web app called "Molly" and need a complete design system.

## What the app is
Molly is a private app to manage my dog's epilepsy. It's named after her — she's a golden
retriever — so I'd love the brand to lean into a warm golden palette. The app has two jobs:

1. Seizure log & trends — I log a seizure (often fast, one-handed, in a stressful moment) and
   see a dashboard of how often they're happening over time.
2. Medication & stock control — track meds, doses, and stock; see "days remaining" and color-coded
   status (OK / reorder soon / urgent), with charts and status cards.

## Tone & constraints (please honor these)
- Emotional register: calm, warm, reassuring. This app is used in stressful, sometimes scary
  moments. NOT clinical/cold, NOT alarmist, NOT playful/cartoonish. Think "trusted companion."
- Brand color: golden / warm amber (golden retriever), but it must NOT collide with the
  status-amber used for warnings. Give me a brand gold AND a distinct warning amber that read
  differently side by side. Status semantics needed: success/OK (green), warning/reorder-soon
  (amber), urgent/danger (red), plus a neutral/info.
- Mobile-first is a hard requirement (used on a phone ~99% of the time): large tap targets,
  thumb-reachable primary actions, a bottom tab bar, one-handed use. Desktop is secondary
  (centered, max-width ~640px). Design for mobile first.
- Language is Brazilian Portuguese (pt-BR). Sentence case everywhere (no Title Case, no ALL CAPS
  for emphasis). Numbers use comma decimals ("28,5"). Address the user as "você".
- Light mode is the priority; a dark mode is a nice-to-have if it's cheap.
- Accessibility: all text/status colors must meet WCAG AA contrast; status must never rely on
  color alone (pair with icon/label).

## What I need you to produce
A full design system, delivered as something I can drop into a Next.js + Tailwind app. Specifically:

1. Color tokens as CSS custom properties (:root variables), including a raw palette (named scales
   like gold-50…900, plus green/amber/red/neutral scales) AND semantic aliases:
   --bg, --bg-2, --surface, --surface-raised, --fg, --fg-2, --fg-muted, --border, --border-strong,
   --brand, --brand-hover, --brand-press, --brand-soft, --success, --warning, --danger (each with a
   -soft variant), --focus-ring. Show the hex values.
2. Typography: font choices (Google Fonts or system, free for commercial use), a type scale, weights,
   and rules for display/headings, body/UI, and a monospace/tabular face for numbers (stock counts,
   days, dates, mg/kg — these need tabular figures).
3. Radii, shadows, spacing scale, and motion tokens (durations + easing curves).
4. Component specs (with the token references above): buttons (primary/secondary/destructive/ghost +
   press/focus/disabled states), cards (incl. a highlighted/active variant), inputs, badges/status
   pills (OK/reorder/urgent), bottom tab bar, the big "Registrar crise" primary action, and a chart
   style (bar chart for seizure frequency over time, with subtle vertical markers for medication
   changes).
5. Iconography guidance (I'll use Lucide React — outline style).
6. A couple of mobile screen mockups to show it working: (a) the home dashboard — big "time since
   last seizure" counter + a "Registrar crise" button + a compact medication-status strip; and
   (b) the medication list with color-coded status cards.

Please present the color tokens and component specs in a copy-pasteable form (CSS variables +
plain descriptions), and show me 2–3 palette directions for the golden brand before committing to
one, so I can pick. Keep all sample copy in pt-BR.
```
