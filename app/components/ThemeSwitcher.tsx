"use client";

import React, { useSyncExternalStore } from "react";
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

  return (
    <div
      role="radiogroup"
      aria-label="Tema do app"
      className={cn(
        "inline-flex items-center rounded-pill border border-border bg-surface p-[3px] shadow-sm",
        className,
      )}
    >
      {OPTIONS.map(({ id, Icon, label }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={mounted && theme === id}
          aria-label={label}
          title={label}
          onClick={() => setTheme(id)}
          className="group grid h-10 w-11 place-items-center rounded-pill bg-transparent [-webkit-tap-highlight-color:transparent] focus-visible:outline-none"
        >
          <span
            className={cn(
              "flex h-[34px] w-10 items-center justify-center rounded-pill text-fg-muted",
              "transition-[background-color,color,transform] duration-[var(--dur-base)] ease-standard",
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
