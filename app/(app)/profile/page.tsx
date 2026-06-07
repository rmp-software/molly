"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/app/components/Button";

export default function ProfilePage() {
  return (
    <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: "24px" }}>
      <p
        style={{
          color: "var(--fg-muted)",
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-base)",
        }}
      >
        Perfil em breve.
      </p>
      <Button
        variant="destructive"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        Sair
      </Button>
    </div>
  );
}
