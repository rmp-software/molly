"use client";

import React, { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Logo } from "@/app/components/Logo";
import { Input } from "@/app/components/Input";
import { Button } from "@/app/components/Button";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect to home if already authenticated
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  // Avoid form flash while session is loading or redirect is pending
  if (status === "loading" || status === "authenticated") return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Email ou senha incorretos");
      } else {
        router.push("/");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[380px] flex flex-col gap-8">
        <div className="flex justify-center">
          <Logo size="lg" badge />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Senha"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p role="alert" className="text-danger text-sm font-body m-0">
              {error}
            </p>
          )}

          <Button type="submit" fullWidth loading={loading}>
            Entrar
          </Button>
        </form>
      </div>
    </main>
  );
}
