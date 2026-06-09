---
slug: dark-mode
status: draft
created: 2026-06-09
linear_project_id:
linear_parent_issue:
feature_branch:
---

<feature_specification>

  <feature_name>Dark mode activation</feature_name>

  <overview>
    Molly already ships a complete dark color system — a full set of semantic tokens
    lives under `[data-theme="dark"]` in `app/globals.css` (bg, fg, brand, status,
    focus ring, chart ramps, scrim), and `next-themes` is in `package.json`. None of it
    is wired up: nothing ever sets `data-theme` on `<html>`, `next-themes` is never
    imported, and there is no control to choose a theme. The dark block is dead CSS.

    This feature activates it. The app follows the phone's OS appearance by default
    (`prefers-color-scheme`), and the owner can override to a fixed Claro / Escuro /
    Sistema choice from the Perfil page. The choice persists across reloads and PWA
    relaunches, and there is no flash of the wrong theme on first paint.
  </overview>

  <problem>
    The dark palette was designed and committed (see `app_spec.txt` &rarr;
    `<color_tokens>`: "Dark mode … lives under `[data-theme="dark"]`") but was never
    turned on. Molly is a mobile-first PWA used at stressful moments, often at night —
    a phone in system dark mode still shows a bright cream surface. The work to make it
    dark is already done in CSS; only the activation layer is missing.
  </problem>

  <scope>
    <in_scope>
      - Mount `next-themes` `ThemeProvider` (in `app/components/Providers.tsx`) with
        `attribute="data-theme"`, `defaultTheme="system"`, `enableSystem`.
      - Add `suppressHydrationWarning` to `<html>` in `app/layout.tsx` (next-themes
        mutates the attribute client-side; without this React warns on every load).
      - No-FOUC: rely on next-themes' blocking pre-hydration script so the correct
        theme is applied before first paint.
      - A small, icon-only theme control on the Perfil page, built 1:1 from the Claude
        Design output in `docs/specs/dark-mode-design/` (`theme-switcher.html` +
        screenshots). It sits in the page **header row, right of the "Molly / Perfil e
        saúde" title** — a rounded pill `radiogroup` of 3 segments: sun (Claro) / moon
        (Escuro) / monitor (Sistema). Reflects and updates the active theme.
      - `color-scheme` CSS so native controls (date/time pickers, scrollbars, form
        widgets) render in the matching mode — `light` on `:root`, `dark` under
        `[data-theme="dark"]`.
      - Make the PWA browser-chrome color (`themeColor`) theme-aware (dark surface in
        dark mode) instead of the single fixed gold.
    </in_scope>
    <out_of_scope>
      - Redesigning or retuning the dark token values — they're treated as correct as
        committed. (Contrast issues found during verification are fixed as bugs, not a
        redesign.)
      - A per-feature or scheduled (time-of-day) auto-switch beyond what the OS provides.
      - Theming the auth/login route specially, the styleguide page, or the `next/og`
        report image routes (Satori renders its own fixed palette).
      - Animating the light&harr;dark transition.
    </out_of_scope>
  </scope>

  <surfaces_affected>
    - `app/components/Providers.tsx` — modified (wrap children in `ThemeProvider`)
    - `app/layout.tsx` — modified (`suppressHydrationWarning` on `<html>`; theme-aware
      `viewport.themeColor`)
    - `app/globals.css` — modified (`color-scheme` on `:root` and `[data-theme="dark"]`)
    - `app/components/AppShell.tsx` — modified (the page header currently renders only
      the greet/sub title; add a right-aligned slot and mount the theme control there
      **on the `/profile` route only**, matching the design's "right of the title"
      placement). The `<header>` becomes a flex row: title block on the left, control
      pinned right.
    - `app/components/ThemeSwitcher.tsx` — new (the icon-only pill radiogroup; a client
      component using `next-themes` `useTheme`, gated on a `mounted` flag to avoid
      hydration mismatch). Ported 1:1 from `docs/specs/dark-mode-design/theme-switcher.html`.
  </surfaces_affected>

  <ui_copy>
    <!-- Icon-only control — no visible text labels. Build 1:1 from
         docs/specs/dark-mode-design/theme-switcher.html (the `.theme-switch` /
         `.theme-seg` markup) and screenshot 01-on-profile.png. pt-BR strings below are
         accessible names only, per app_spec.txt <voice>. -->
    Three lucide icons, left→right: `Sun` → Claro (`light`), `Moon` → Escuro (`dark`),
    `Monitor` → Sistema (`system`).

    Layout — in the Perfil page header row, right of the title:

        ┌─────────────────────────────────────────────┐
        │  Molly                          ┌─────────┐  │
        │  Perfil e saúde                 │ ☀  🌙  🖥 │  │  ← pill, top-right
        │                                 └─────────┘  │
        └─────────────────────────────────────────────┘

    Exact spec from the design (map to our tokens / Tailwind utilities):
      - Container: `inline-flex`, padding 3px, `bg-surface`, 1px `border-border`,
        `rounded-pill`, `shadow-sm`.
      - Segment: 44×40px button (`--seg-w` 44 / `--seg-h` 40), transparent, grid-centered.
      - Segment inner: 40×34px, `rounded-pill`, icon 18px stroke-width 2.25, color
        `fg-muted`; hover → `fg-2`; active → `scale(0.92)`; transitions on
        bg/color (`dur-base ease-standard`) and transform (`dur-fast`).
      - Selected (`aria-checked="true"`) inner: `bg-brand-soft` + `text-brand`
        ("Suave" variant — the committed default; not solid/ring).
      - Focus-visible: `focus-ring-shadow` on the inner (outline none).

    Selection reflects the stored preference, not the resolved theme — Sistema/monitor
    stays selected even while the resolved theme is dark.

    Accessibility (matches the design markup): the group is `role="radiogroup"`
    `aria-label="Tema do app"`; each segment is a `role="radio"` button with
    `aria-checked` and an `aria-label` "Claro" / "Escuro" / "Sistema"; the icon is
    `aria-hidden`. The 44px segment meets `--tap-min`.
  </ui_copy>

  <acceptance_criteria>
    - [ ] Given a phone whose OS is in dark mode and a fresh visitor (no stored
      preference), when the app loads, then `<html>` has `data-theme="dark"` and the UI
      renders with the dark surface (`--bg #1A1712`) — verified on WebKit (iPhone-emulated).
    - [ ] Given a phone whose OS is in light mode and no stored preference, when the app
      loads, then the UI renders light (no `data-theme="dark"`).
    - [ ] Given the Perfil page, when the owner taps the moon (Escuro) icon, then the
      app switches to dark immediately and the moon button shows the selected state.
    - [ ] Given the owner picked "Escuro", when they reload the page (and when they
      relaunch the installed PWA), then the app is still dark — the choice persisted.
    - [ ] Given the owner picked Sistema (monitor), when the OS appearance changes, then
      the app follows the OS without a reload, and the monitor button stays selected.
    - [ ] On first paint there is no flash of the light theme before dark is applied
      (no FOUC), on a hard reload with dark active.
    - [ ] In dark mode, native date/time inputs (e.g. on the seizure log) render with a
      dark widget — `color-scheme: dark` is in effect — verified on WebKit.
    - [ ] `npx tsc --noEmit` is clean and `npm test` stays green.
    - [ ] No new ESLint warnings beyond the pre-existing `react-hooks/set-state-in-effect`.
  </acceptance_criteria>

  <risks>
    - **Hydration mismatch / FOUC.** The segmented control must not render
      theme-dependent state until mounted, and `<html>` must carry
      `suppressHydrationWarning`. Both are standard next-themes requirements; missing
      either shows as a console error or a first-paint flash. Verify the no-FOUC
      criterion on a real hard reload, not just an SPA navigation.
    - **Turbopack caches `globals.css`.** Per CLAUDE.md, the `color-scheme` edit may need
      `rm -rf .next` + restart to take effect during dev.
    - **Contrast.** The dark tokens are assumed correct but were never rendered. Capture
      phone-viewport screenshots of home, trends (charts), medications, and the seizure
      log in dark mode and review for contrast/legibility per the CLAUDE.md UI gate.
      Any failure is fixed as a token/usage bug within this feature, not a redesign.
    - **`themeColor` as array.** Next.js `viewport.themeColor` accepts a
      media-qualified array; confirm the PWA status-bar color actually flips on iOS
      (it may need the right `media` form), and don't regress the installed-icon work.
  </risks>

  <breakdown_sketch>
    - Wire ThemeProvider + `suppressHydrationWarning` + `color-scheme` (core activation,
      no UI) — verify system-driven dark renders with no FOUC.
    - `ThemeSwitcher` component (port `theme-switcher.html` 1:1) + mount in AppShell
      header on `/profile` (right of title) + persistence + theme-aware `themeColor`.
    - Dark-mode visual QA pass across home / trends / medications / seizure log;
      fix any contrast bugs.
  </breakdown_sketch>

</feature_specification>
