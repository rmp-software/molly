"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { ThemeColorSync } from "./ThemeColorSync";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
      <ThemeColorSync />
      <SessionProvider>{children}</SessionProvider>
    </ThemeProvider>
  );
}
