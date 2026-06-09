"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

// The static `viewport.themeColor` meta tags only track the OS prefers-color-scheme,
// so a manual in-app override (e.g. dark on a light phone) would leave the browser
// chrome mismatched. This syncs every `theme-color` meta to the *resolved* app theme.
// Programmatic hex (a <meta> content can't be a Tailwind utility), like the viewport
// metadata it mirrors.
const COLOR = { light: "#B27A22", dark: "#1A1712" } as const;

export function ThemeColorSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const color = resolvedTheme === "dark" ? COLOR.dark : COLOR.light;
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((m) => m.setAttribute("content", color));
  }, [resolvedTheme]);

  return null;
}
