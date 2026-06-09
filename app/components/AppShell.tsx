"use client";

import React, { createContext, useContext, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TabBar } from "@/app/components/TabBar";
import { Sheet } from "@/app/components/Sheet";
import { Home, Pill, TrendingUp, PawPrint } from "lucide-react";
import { LogSeizure } from "@/app/components/LogSeizure";
import { ThemeSwitcher } from "@/app/components/ThemeSwitcher";

// Context so child pages (e.g. Home) can open the log sheet without prop-drilling
export interface LogSheetContextValue {
  openLog: () => void;
}

export const LogSheetContext = createContext<LogSheetContextValue>({
  openLog: () => {}, // safe no-op default
});

export function useLogSheet() {
  return useContext(LogSheetContext);
}

const routeMeta: Record<string, { greet: string; sub: string }> = {
  "/": { greet: "Olá", sub: "Está tudo bem com a Molly hoje" },
  "/medications": { greet: "Remédios", sub: "Estoque e doses" },
  "/trends": { greet: "Tendências", sub: "Histórico e padrões" },
  "/profile": { greet: "Molly", sub: "Perfil e saúde" },
};

const tabItems = [
  {
    id: "/",
    label: "Início",
    icon: <Home size={22} />,
  },
  {
    id: "/medications",
    label: "Remédios",
    icon: <Pill size={22} />,
  },
  {
    id: "/trends",
    label: "Tendências",
    icon: <TrendingUp size={22} />,
  },
  {
    id: "/profile",
    label: "Molly",
    icon: <PawPrint size={22} />,
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [logOpen, setLogOpen] = useState(false);

  const meta =
    routeMeta[pathname] ??
    Object.entries(routeMeta).find(([k]) => k !== "/" && pathname.startsWith(k))?.[1] ??
    routeMeta["/"];

  // Resolve the active tab: exact match for "/", prefix match for all others.
  const activeTab =
    tabItems.find((t) => t.id !== "/" && pathname.startsWith(t.id))?.id ??
    (pathname === "/" ? "/" : tabItems[0].id);

  return (
    <div className="relative min-h-[100dvh] bg-bg flex flex-col">
      {/* Header */}
      <header className="no-print pt-5 px-5 pb-3 font-display max-w-[var(--app-max)] w-full mx-auto box-border flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="m-0 text-2xl font-bold tracking-tight text-fg leading-[1.1]">
            {meta.greet}
          </h1>
          <p className="mt-1 mb-0 text-sm text-fg-muted font-body">{meta.sub}</p>
        </div>
        {pathname === "/profile" && <ThemeSwitcher />}
      </header>

      {/* Main scrollable area */}
      <main
        aria-label="Conteúdo principal"
        className="flex-1 overflow-y-auto pb-[calc(var(--tabbar-h)+var(--safe-bottom)+24px)] max-w-[var(--app-max)] w-full mx-auto box-border"
      >
        <LogSheetContext.Provider value={{ openLog: () => setLogOpen(true) }}>
          {children}
        </LogSheetContext.Provider>
      </main>

      {/* TabBar */}
      <TabBar
        className="no-print"
        items={tabItems}
        active={activeTab}
        onChange={(id) => router.push(id)}
        fixed
        centerAction={{
          label: "Crise",
          icon: <PawPrint size={24} />,
          onClick: () => setLogOpen(true),
        }}
      />

      {/* Log seizure sheet */}
      <Sheet
        open={logOpen}
        onClose={() => setLogOpen(false)}
        title="Registrar crise"
      >
        <LogSeizure open={logOpen} onClose={() => setLogOpen(false)} />
      </Sheet>
    </div>
  );
}
