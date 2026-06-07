"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TabBar } from "@/app/components/TabBar";
import { Sheet } from "@/app/components/Sheet";
import { Button } from "@/app/components/Button";
import { Home, Pill, TrendingUp, PawPrint } from "lucide-react";

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

  const meta = routeMeta[pathname] ?? routeMeta["/"];

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100dvh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "20px 20px 12px",
          fontFamily: "var(--font-display)",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "var(--text-2xl)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--fg)",
            lineHeight: 1.1,
          }}
        >
          {meta.greet}
        </h1>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: "var(--text-sm)",
            color: "var(--fg-muted)",
            fontFamily: "var(--font-body)",
          }}
        >
          {meta.sub}
        </p>
      </header>

      {/* Main scrollable area */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          paddingBottom: "calc(var(--tabbar-h) + var(--safe-bottom) + 24px)",
        }}
      >
        {children}
      </main>

      {/* TabBar */}
      <TabBar
        items={tabItems}
        active={pathname}
        onChange={(id) => router.push(id)}
        fixed
        centerAction={{
          label: "Crise",
          icon: <PawPrint size={24} />,
          onClick: () => setLogOpen(true),
        }}
      />

      {/* Log seizure sheet — placeholder until Task 8 */}
      <Sheet
        open={logOpen}
        onClose={() => setLogOpen(false)}
        title="Registrar crise"
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            alignItems: "center",
            padding: "8px 0",
          }}
        >
          <p
            style={{
              color: "var(--fg-muted)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-base)",
              textAlign: "center",
              margin: 0,
            }}
          >
            Em breve — o formulário de registro de crise estará disponível aqui.
          </p>
          <Button variant="secondary" onClick={() => setLogOpen(false)}>
            Fechar
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
