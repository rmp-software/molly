# Molly — App UI kit

High-fidelity, click-through recreation of the Molly mobile app (pt-BR, mobile-first, light mode). Built entirely from the design-system components and tokens — no bespoke styling beyond layout glue.

## Run it
Open `index.html`. It mounts an iPhone frame and a working prototype:
- **Início** — hero "time since last seizure" counter, the big **Registrar crise** action, next-dose reminder, and a compact frequency chart.
- **Registrar crise** — tap the center paw action (or the home button) to open the log sheet: duration stepper, seizure type, notes, save. Saving shows a warm confirmation toast.
- **Remédios** — stock overview strip + color-coded `MedStatusCard`s (OK / reabastecer / acabando) with "Pedir mais".
- **Tendências** — larger frequency chart with a dose-change annotation, headline stats, recent registros.
- **Molly** — a simple patient profile.

## Files
| File | Role |
|---|---|
| `index.html` | App shell — tab navigation, sheet, toast, device scaling. Tagged `@dsCard` (Molly App). |
| `ios-frame.jsx` | iPhone bezel + status bar (starter component). Exports `window.IOSDevice`. |
| `icons.jsx` | `I(name, opts)` Lucide helper → `window.I`. |
| `Home.jsx` | `window.MollyHome` — dashboard. |
| `Meds.jsx` | `window.MollyMeds` — medication list. |
| `Trends.jsx` | `window.MollyTrends` — history & patterns. |
| `LogSeizure.jsx` | `window.MollyLogSeizure` — the bottom sheet. |

## Components used
`Counter`, `Button`, `Card`, `BarChart`, `MedStatusCard`, `StatusPill`, `TabBar`, `Logo` — all from `window.MollyDesignSystem_790ab3`, loaded via the generated `_ds_bundle.js`. Icons are Lucide (outline).

## Conventions
- Sentence-case pt-BR copy; reassuring, never alarmist.
- Numbers in `IBM Plex Mono` with tabular figures and comma decimals (e.g. `29,4 kg`).
- Brand gold for chrome/actions; status amber kept visually distinct and always paired with an icon + label.
