"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { PawPrint, Pencil, Check, X, FileText } from "lucide-react";
import { Card } from "@/app/components/Card";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";
import { WeightLog, WeightEntry } from "@/app/components/WeightLog";
import { useToast } from "@/app/components/Toast";
import { fmtKg } from "@/lib/format";

export interface DogData {
  id: string;
  name: string;
  breed: string | null;
  birthdate: string | null; // "YYYY-MM-DD" or null
  diagnosis: string | null;
  vetName: string | null;
  emergencyContact: string | null;
}

interface Props {
  dog: DogData;
  initialWeights: WeightEntry[];
}

function computeAge(birthdate: string | null): string | null {
  if (!birthdate) return null;
  const birth = new Date(birthdate + "T00:00:00Z");
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const mDiff = now.getMonth() - birth.getMonth();
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < birth.getDate())) {
    years--;
  }
  if (years < 0) return null;
  return years === 1 ? "1 ano" : `${years} anos`;
}

function dogSubtitle(dog: DogData): string | null {
  const age = computeAge(dog.birthdate);
  if (dog.breed && age) return `${dog.breed} · ${age}`;
  if (dog.breed) return dog.breed;
  if (age) return age;
  return null;
}

interface InfoRowProps {
  label: string;
  value: string;
  editing: boolean;
  editValue: string;
  onChange: (v: string) => void;
  inputType?: string;
}

function InfoRow({
  label,
  value,
  editing,
  editValue,
  onChange,
  inputType = "text",
}: InfoRowProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        padding: "10px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {editing ? (
        <Input
          label={label}
          type={inputType}
          value={editValue}
          onChange={(e) => onChange(e.target.value)}
          style={{
            minHeight: "36px",
            padding: "6px 10px",
            fontSize: "var(--text-sm)",
          }}
        />
      ) : (
        <>
          <span
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--fg-muted)",
              fontFamily: "var(--font-body)",
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontSize: "var(--text-base)",
              color: value ? "var(--fg)" : "var(--fg-muted)",
              fontFamily: "var(--font-body)",
            }}
          >
            {value || "—"}
          </span>
        </>
      )}
    </div>
  );
}

export function ProfileClient({ dog: initialDog, initialWeights }: Props) {
  const router = useRouter();
  const { show } = useToast();
  const [dog, setDog] = useState<DogData>(initialDog);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: initialDog.name,
    vetName: initialDog.vetName ?? "",
    diagnosis: initialDog.diagnosis ?? "",
    emergencyContact: initialDog.emergencyContact ?? "",
    breed: initialDog.breed ?? "",
    birthdate: initialDog.birthdate ?? "",
  });

  // Latest weight is the first in the list (sorted desc by measuredOn)
  const latestWeight = initialWeights[0]?.weightKg ?? null;
  const subtitle = dogSubtitle(dog);

  function startEdit() {
    setForm({
      name: dog.name,
      vetName: dog.vetName ?? "",
      diagnosis: dog.diagnosis ?? "",
      emergencyContact: dog.emergencyContact ?? "",
      breed: dog.breed ?? "",
      birthdate: dog.birthdate ?? "",
    });
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  async function saveEdit() {
    setSaving(true);
    try {
      const res = await fetch("/api/dog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim() || undefined,
          breed: form.breed.trim() || null,
          birthdate: form.birthdate || null,
          diagnosis: form.diagnosis.trim() || null,
          vetName: form.vetName.trim() || null,
          emergencyContact: form.emergencyContact.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Erro ao salvar");
      }
      const updated: DogData = await res.json();
      setDog(updated);
      setEditing(false);
      show("Perfil atualizado", { variant: "success" });
      router.refresh();
    } catch (err) {
      show(
        err instanceof Error ? err.message : "Erro ao salvar",
        { variant: "error" }
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        padding: "0 20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Avatar card */}
      <Card variant="highlighted" style={{ textAlign: "center" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "var(--brand-soft)",
              display: "grid",
              placeItems: "center",
              color: "var(--brand)",
            }}
          >
            <PawPrint size={36} />
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-2xl)",
                fontWeight: 700,
                color: "var(--fg)",
                letterSpacing: "-0.02em",
              }}
            >
              {dog.name}
            </h2>
            {subtitle && (
              <p
                style={{
                  margin: "4px 0 0",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
                  color: "var(--fg-muted)",
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Info card */}
      <Card>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Header row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "4px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: "var(--fw-semibold)" as unknown as number,
                fontSize: "var(--text-base)",
                color: "var(--fg)",
              }}
            >
              Informações
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              {editing ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    icon={<X size={16} />}
                    aria-label="Cancelar edição"
                    onClick={cancelEdit}
                    disabled={saving}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    iconOnly
                    icon={<Check size={16} />}
                    aria-label="Salvar"
                    onClick={saveEdit}
                    loading={saving}
                  />
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  icon={<Pencil size={16} />}
                  aria-label="Editar"
                  onClick={startEdit}
                />
              )}
            </div>
          </div>

          {/* Peso row — read-only, sourced from weight log */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              padding: "10px 0",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--fg-muted)",
                fontFamily: "var(--font-body)",
              }}
            >
              Peso
            </span>
            <span
              style={{
                fontSize: "var(--text-base)",
                color:
                  latestWeight !== null ? "var(--fg)" : "var(--fg-muted)",
                fontFamily: "var(--font-body)",
              }}
            >
              {latestWeight !== null ? fmtKg(latestWeight) : "—"}
            </span>
          </div>

          <InfoRow
            label="Nome"
            value={dog.name}
            editing={editing}
            editValue={form.name}
            onChange={(v) => setForm((f) => ({ ...f, name: v }))}
          />
          <InfoRow
            label="Raça"
            value={dog.breed ?? ""}
            editing={editing}
            editValue={form.breed}
            onChange={(v) => setForm((f) => ({ ...f, breed: v }))}
          />
          <InfoRow
            label="Nascimento"
            value={dog.birthdate ?? ""}
            editing={editing}
            editValue={form.birthdate}
            onChange={(v) => setForm((f) => ({ ...f, birthdate: v }))}
            inputType="date"
          />
          <InfoRow
            label="Veterinária"
            value={dog.vetName ?? ""}
            editing={editing}
            editValue={form.vetName}
            onChange={(v) => setForm((f) => ({ ...f, vetName: v }))}
          />
          <InfoRow
            label="Diagnóstico"
            value={dog.diagnosis ?? ""}
            editing={editing}
            editValue={form.diagnosis}
            onChange={(v) => setForm((f) => ({ ...f, diagnosis: v }))}
          />
          <InfoRow
            label="Emergência"
            value={dog.emergencyContact ?? ""}
            editing={editing}
            editValue={form.emergencyContact}
            onChange={(v) => setForm((f) => ({ ...f, emergencyContact: v }))}
          />
        </div>
      </Card>

      {/* Weight log */}
      <WeightLog initialEntries={initialWeights} />

      {/* Report link */}
      <Button
        variant="secondary"
        fullWidth
        icon={<FileText size={16} />}
        onClick={() => router.push("/profile/report")}
      >
        Relatório para a veterinária
      </Button>

      {/* Logout */}
      <Button
        variant="destructive"
        fullWidth
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        Sair
      </Button>
    </div>
  );
}
