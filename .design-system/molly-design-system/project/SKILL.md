---
name: molly-design
description: Use this skill to generate well-branded interfaces and assets for Molly (a warm, calm, mobile-first dog-epilepsy companion app), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick start
- Link `styles.css` for all tokens (colors, type, spacing, motion). Light mode is default; add `data-theme="dark"` on a root element for dark.
- Components live under `components/**` and are bundled to `_ds_bundle.js` on the global `window.MollyDesignSystem_790ab3`. Load React + Babel + the bundle, then `const { Button, Card, StatusPill, Counter, BarChart, MedStatusCard, TabBar, Logo } = window.MollyDesignSystem_790ab3`.
- Icons are **Lucide**, outline style. See `ui_kits/molly_app/icons.jsx` for the `I(name)` helper used in static HTML.
- See `ui_kits/molly_app/` for a full interactive example screen-by-screen.

## Non-negotiables
- **pt-BR**, sentence case, comma decimals (`28,5`), no emoji in product copy.
- Tone: calm, warm, reassuring — never clinical, alarmist, or playful.
- **Brand gold ≠ warning amber.** Use `--brand` for chrome/actions; use status amber only for "reabastecer", always with an icon + label.
- Color never alone — pair every status with an icon and label (WCAG AA).
- Mobile-first: ≥44px targets, thumb-reachable primary action, bottom tab bar, ~640px max column.
