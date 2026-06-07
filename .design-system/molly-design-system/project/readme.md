# Molly Design System

A warm, calm, mobile-first design system for **Molly** — a private web app to manage a dog's epilepsy. Named after a golden retriever, the brand leans into a honey-gold palette and a "trusted companion" tone for moments that are sometimes stressful or scary.

> **Sources:** This system was created from a written product brief only — no codebase, Figma, or screenshots were provided. All visual decisions (palette, type, components) are original to this brief. If you have an existing app build or Figma, share it and this system will be reconciled against it.

The app has two jobs:
1. **Seizure log & trends** — log a seizure fast (one-handed, in a stressful moment) and see frequency over time.
2. **Medication & stock control** — track meds, doses, and stock; see "days remaining" with color-coded status (OK / reabastecer / acabando), charts, and status cards.

Platform: mobile-first web (used on a phone ~99% of the time), centered column max-width **640px**, bottom tab bar, thumb-reachable primary actions. Language **pt-BR**, sentence case, comma decimals (`28,5`). **Light mode is the priority**; a dark theme ships as `[data-theme="dark"]`.

---

## Content fundamentals

**Voice:** a trusted companion sitting beside you — calm, warm, reassuring. Never clinical/cold, never alarmist, never playful/cartoonish.

- **Person & address:** speak *to* the owner informally ("você"), about Molly by name. "Você está cuidando bem dela."
- **Casing:** sentence case everywhere — buttons, titles, labels. Never ALL CAPS for emphasis (small overline labels may use uppercase as a *style*, not a shout).
- **Numbers:** comma decimals (`97,5 mg`, `29,4 kg`, `28,5`); 24h time as `20h` / `16h42`; dates `dd/mm`.
- **Emoji:** **not used** in product copy. Warmth comes from words and color, not emoji.
- **Tone in hard moments:** acknowledge feeling, then reassure and act. Logging a seizure → "Respire. Vou guardar tudo pra você." Save → "Anotado. Você cuidou bem da Molly."
- **Status copy:** gentle and actionable, never red-alert. Low stock → "O estoque de fenobarbital está acabando — que tal pedir mais?" not "ALERTA: nível crítico!".

Examples (do → don't):
- ✓ "Faz 14 dias desde a última crise. Continue assim." — ✕ "Registro de evento convulsivo salvo."
- ✓ "Reabastecer em breve" — ✕ "WARNING: STOCK LOW"

---

## Visual foundations

**Palette.** Golden-retriever **honey gold** (`--brand #B27A22`) is the identity color — deep, bronzed, warm. It owns all chrome: the primary button, the "Registrar crise" action, the active tab, accents. Status colors are green (OK), **amber** (reabastecer), red (acabando/urgente), and a calm slate-blue (info). The amber warning is deliberately **brighter and yellower** than the brand gold so the two never read as "everything is a warning" — the one real trap in this brand. Color never carries meaning alone: every status pairs a hue with an icon and a pt-BR label (WCAG AA, color-blind safe). Neutrals are a **warm gray** with a faint gold/brown undertone — never cold or clinical.

**Backgrounds.** Solid warm cream canvas (`--bg #F7F3EC`); no photographic full-bleeds, no busy patterns, no gradients as decoration. Surfaces are plain white cards that float on the cream with soft shadows. Calm and uncluttered — the content (a number, a status, a chart) is the focus.

**Type.** Display = **Bricolage Grotesque** (warm, characterful headings & hero numbers). Body/UI = **Hanken Grotesk** (humanist, friendly, highly legible). Numbers = **IBM Plex Mono** with tabular figures + slashed zero, so counts, days, mg/kg, dates and the hero counter never jitter as values change. Tight letter-spacing on display, generous line-height (1.5) on body.

**Shape & depth.** Generous corner radii — cards `20px`, inputs `14px`, and **pill** (`999px`) for every button, status pill, FAB and avatar (soft, friendly, never sharp). Shadows are warm-tinted (toward the neutral brown), soft and layered — cards feel gently lifted, not boxed; a dedicated gold glow sits under the primary FAB. Borders are hairline warm-gray, used sparingly.

**Motion.** Calm and quick. Durations 80–360 ms; standard easing `cubic-bezier(.2,0,0,1)`, a gentle settle `out`, and a subtle `spring` for press pops. Buttons scale to `0.97` on press; the tab FAB pops slightly. Sheets slide up on `--dur-slow`. Honors `prefers-reduced-motion`. No infinite/looping decorative animation.

**Interaction states.** Hover deepens the fill (primary → `--brand-hover` → `--brand-press`); secondary fills with `--brand-soft`; ghost picks up a warm `--bg-2` wash. Focus is a high-contrast gold ring (`--focus-ring-shadow`, 3px). Disabled drops to 45% opacity. Tap targets are ≥44px; the primary action is large (`56px`) and thumb-reachable.

**Imagery.** Minimal. The mark is a paw print; the patient "avatar" is a paw glyph in a soft gold disc (swap for the owner's photo of Molly when available). No stock photography in the system.

---

## Iconography

- **Library:** [Lucide](https://lucide.dev) — **outline** style, ~2px stroke, rounded caps. Matches the warm, soft, approachable tone without being cartoonish. In React use `lucide-react`; in static HTML/specimen cards it's loaded from the Lucide UMD CDN and rendered via the `I(name)` helper (see `ui_kits/molly_app/icons.jsx`).
- **Why Lucide:** the brief specifies it. Components keep icons as **slots** (`icon` / `chipIcon` props take any ReactNode), so the system stays icon-library agnostic if you ever switch.
- **Common glyphs:** `paw-print` (brand mark, Molly, log action), `pill` (meds), `house`, `chart-column` (trends), `heart-pulse` (counter), `check` / `clock` / `alert-triangle` (status), `shopping-cart` (reorder), `plus` / `minus` (steppers).
- **Sizing:** 14–16px inline with text, 18–23px for tab/standalone, stroke 2–2.5. Status icons always accompany a label.
- **Emoji / unicode as icons:** not used. (A few specimen cards use ✓/✕ glyphs purely as do/don't ticks — never in product UI.)
- **Assets:** no custom SVG/PNG icon set is shipped — Lucide covers everything. The brand mark is composed from Lucide's `paw-print`, so there's no separate logo file to copy. See `guidelines/cards/brand-logo.html` for the lockup.

---

## Tokens
`styles.css` (root) is the single entry consumers link; it only `@import`s:
- `tokens/fonts.css` — Google Fonts (`Bricolage Grotesque`, `Hanken Grotesk`, `IBM Plex Mono`).
- `tokens/colors.css` — raw scales (`--gold/green/amber/red/blue/neutral-50…900`) + semantic aliases (`--bg`, `--surface`, `--fg`, `--border`, `--brand*`, `--success/warning/danger/info` + `-soft`, `--focus-ring`, chart tokens) + `[data-theme="dark"]`.
- `tokens/typography.css` — families, weights, type scale, line-heights, tracking, tabular `--num-feat`.
- `tokens/spacing.css` — 4px spacing scale, radii, warm shadows, motion (durations/easings), layout (`--app-max`, `--tabbar-h`, `--tap-min`), z-index.

---

## Index / manifest

**Root**
- `styles.css` — global entry (imports only)
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`
- `readme.md` — this file · `SKILL.md` — Agent-Skill wrapper

**Components** (`window.MollyDesignSystem_790ab3`, via `_ds_bundle.js`)
- `components/core/` — **Button**, **Card** (+ `CardChip`), **StatusPill**, **Logo**
- `components/navigation/` — **TabBar** (bottom nav + center FAB)
- `components/data/` — **Counter** (time-since), **BarChart** (seizure frequency)
- `components/patterns/` — **MedStatusCard** (medication stock)

Each component dir has `<Name>.jsx`, `<Name>.d.ts`, `<Name>.prompt.md`, and a `@dsCard` HTML.

**Design System tab cards** (`guidelines/cards/`)
- Colors: gold scale, status scales, neutral, brand-vs-warning, semantic surfaces, semantic status, **3 gold directions**
- Type: display, body, mono/tabular, scale
- Spacing: scale, radii, shadows, motion
- Brand: logo, voice & tone

**UI kit**
- `ui_kits/molly_app/` — interactive app prototype (`index.html`) + screens. See its `README.md`.

**Starting points:** Button, Card, StatusPill (Core); Counter (Data); MedStatusCard (Patterns).
