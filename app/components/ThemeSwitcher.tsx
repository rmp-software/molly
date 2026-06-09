"use client";

import React, { useRef, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/cn";

// Client-mount detection without a setState-in-effect (hydration-safe): the server
// snapshot is `false`, so SSR + the hydration render agree, then it flips to `true`.
const subscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

// Icon-only segmented radiogroup: Claro / Escuro / Sistema.
// Ported 1:1 from docs/specs/dark-mode-design/theme-switcher.html.
const OPTIONS = [
  { id: "light", Icon: Sun, label: "Claro" },
  { id: "dark", Icon: Moon, label: "Escuro" },
  { id: "system", Icon: Monitor, label: "Sistema" },
] as const;

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  // next-themes resolves on the client; gate the selected state until mounted so
  // the server render (no selection) and the hydration render match.
  const mounted = useMounted();
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Index that owns the tab stop (roving tabindex per the WAI-ARIA radiogroup
  // pattern). Pre-mount, or if the stored value is unknown, the first segment.
  const selectedIdx = mounted ? OPTIONS.findIndex((o) => o.id === theme) : 0;
  const tabbableIdx = selectedIdx < 0 ? 0 : selectedIdx;

  // Arrow keys move selection + focus across the group (Left/Up = prev,
  // Right/Down = next, wrapping). Home/End jump to the ends.
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      next = (tabbableIdx + 1) % OPTIONS.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      next = (tabbableIdx - 1 + OPTIONS.length) % OPTIONS.length;
    } else if (e.key === "Home") {
      next = 0;
    } else if (e.key === "End") {
      next = OPTIONS.length - 1;
    }
    if (next === null) return;
    e.preventDefault();
    setTheme(OPTIONS[next].id);
    btnRefs.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label="Tema do app"
      onKeyDown={onKeyDown}
      className={cn(
        "inline-flex items-center rounded-pill border border-border bg-surface p-[3px] shadow-sm",
        className,
      )}
    >
      {OPTIONS.map(({ id, Icon, label }, i) => (
        <button
          key={id}
          ref={(el) => {
            btnRefs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={mounted && theme === id}
          aria-label={label}
          title={label}
          tabIndex={i === tabbableIdx ? 0 : -1}
          onClick={() => setTheme(id)}
          className="group grid h-10 w-11 place-items-center rounded-pill bg-transparent [-webkit-tap-highlight-color:transparent] focus-visible:outline-none"
        >
          <span
            className={cn(
              "flex h-[34px] w-10 items-center justify-center rounded-pill text-fg-muted",
              // bg/color animate at dur-base, the press-scale at dur-fast (per design).
              // NB Tailwind v4 `scale-*` sets the independent `scale` property, not
              // `transform` — so the transition must name `scale` to ease the press.
              "[transition:background-color_var(--dur-base)_var(--ease-standard),color_var(--dur-base)_var(--ease-standard),scale_var(--dur-fast)_var(--ease-standard)]",
              "group-hover:text-fg-2 group-active:scale-[0.92]",
              "group-aria-checked:bg-brand-soft group-aria-checked:text-brand",
              "group-focus-visible:shadow-focus",
            )}
          >
            <Icon size={18} strokeWidth={2.25} aria-hidden="true" />
          </span>
        </button>
      ))}
    </div>
  );
}
