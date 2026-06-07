# Task 7: Dog Profile + Weight Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the dog profile page with editable info fields and a weight log (add/delete entries with sparkline), backed by clean scoped API routes that establish the convention pattern for all future tasks.

**Architecture:** Three API routes (`/api/dog`, `/api/weight`, `/api/weight/[id]`) with a shared convention: requireSession + getActiveDog/Id + validate + serialize (Decimal→number, Date→string). The profile page is a server component that renders two client sub-components: `ProfileCard` (editable dog info) and `WeightLog` (CRUD weight entries with sparkline).

**Tech Stack:** Next.js 16 App Router, Prisma (PostgreSQL), NextAuth, React client components, existing design-system (Card, Button, Input, BarChart, useToast), Lucide icons, pt-BR formatting helpers.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `app/api/dog/route.ts` | Create | GET + PUT for active dog |
| `app/api/weight/route.ts` | Create | GET + POST weight entries |
| `app/api/weight/[id]/route.ts` | Create | DELETE weight entry (scope-checked) |
| `app/(app)/profile/page.tsx` | Replace | Server component — fetches dog + latest weight, renders profile |
| `app/components/WeightLog.tsx` | Create | Client component — weight list, add form, delete, sparkline |

---

### Task 1: API — GET/PUT /api/dog

**Files:**
- Create: `app/api/dog/route.ts`

- [ ] **Step 1: Create the dog API route**

```typescript
// app/api/dog/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getActiveDog } from "@/lib/scope";
import { prisma } from "@/lib/db";

function serializeDog(dog: {
  id: string;
  name: string;
  breed: string | null;
  birthdate: Date | null;
  diagnosis: string | null;
  vetName: string | null;
  emergencyContact: string | null;
}) {
  return {
    id: dog.id,
    name: dog.name,
    breed: dog.breed ?? null,
    birthdate: dog.birthdate ? dog.birthdate.toISOString().slice(0, 10) : null,
    diagnosis: dog.diagnosis ?? null,
    vetName: dog.vetName ?? null,
    emergencyContact: dog.emergencyContact ?? null,
  };
}

export async function GET() {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const dog = await getActiveDog();
  return NextResponse.json(serializeDog(dog));
}

export async function PUT(request: Request) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const dog = await getActiveDog();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const {
    name,
    breed,
    birthdate,
    diagnosis,
    vetName,
    emergencyContact,
  } = body as Record<string, unknown>;

  if (name !== undefined && (typeof name !== "string" || name.trim() === "")) {
    return NextResponse.json({ error: "name must be a non-empty string" }, { status: 400 });
  }

  // Validate birthdate if provided
  let parsedBirthdate: Date | null | undefined = undefined;
  if (birthdate !== undefined) {
    if (birthdate === null) {
      parsedBirthdate = null;
    } else if (typeof birthdate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
      const d = new Date(birthdate + "T00:00:00Z");
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "invalid birthdate" }, { status: 400 });
      }
      parsedBirthdate = d;
    } else {
      return NextResponse.json({ error: "birthdate must be YYYY-MM-DD or null" }, { status: 400 });
    }
  }

  const updated = await prisma.dog.update({
    where: { id: dog.id },
    data: {
      ...(name !== undefined ? { name: (name as string).trim() } : {}),
      ...(breed !== undefined ? { breed: breed === null ? null : String(breed).trim() || null } : {}),
      ...(parsedBirthdate !== undefined ? { birthdate: parsedBirthdate } : {}),
      ...(diagnosis !== undefined ? { diagnosis: diagnosis === null ? null : String(diagnosis).trim() || null } : {}),
      ...(vetName !== undefined ? { vetName: vetName === null ? null : String(vetName).trim() || null } : {}),
      ...(emergencyContact !== undefined ? { emergencyContact: emergencyContact === null ? null : String(emergencyContact).trim() || null } : {}),
    },
  });

  return NextResponse.json(serializeDog(updated));
}
```

---

### Task 2: API — GET/POST /api/weight

**Files:**
- Create: `app/api/weight/route.ts`

- [ ] **Step 1: Create weight list/create API route**

```typescript
// app/api/weight/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getActiveDogId } from "@/lib/scope";
import { prisma } from "@/lib/db";

function serializeEntry(e: {
  id: string;
  measuredOn: Date;
  weightKg: { toNumber(): number };
}) {
  return {
    id: e.id,
    measuredOn: e.measuredOn.toISOString().slice(0, 10),
    weightKg: e.weightKg.toNumber(),
  };
}

export async function GET() {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const dogId = await getActiveDogId();
  const entries = await prisma.weightEntry.findMany({
    where: { dogId },
    orderBy: { measuredOn: "desc" },
  });

  return NextResponse.json(entries.map(serializeEntry));
}

export async function POST(request: Request) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const dogId = await getActiveDogId();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const { measuredOn, weightKg } = body as Record<string, unknown>;

  if (typeof measuredOn !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(measuredOn)) {
    return NextResponse.json({ error: "measuredOn must be YYYY-MM-DD" }, { status: 400 });
  }
  const dateVal = new Date(measuredOn + "T00:00:00Z");
  if (isNaN(dateVal.getTime())) {
    return NextResponse.json({ error: "invalid measuredOn date" }, { status: 400 });
  }

  const kgNum = Number(weightKg);
  if (!Number.isFinite(kgNum) || kgNum <= 0) {
    return NextResponse.json({ error: "weightKg must be a positive number" }, { status: 400 });
  }

  const entry = await prisma.weightEntry.create({
    data: {
      dogId,
      measuredOn: dateVal,
      weightKg: kgNum,
    },
  });

  return NextResponse.json(serializeEntry(entry), { status: 201 });
}
```

---

### Task 3: API — DELETE /api/weight/[id]

**Files:**
- Create: `app/api/weight/[id]/route.ts`

- [ ] **Step 1: Create weight delete route**

```typescript
// app/api/weight/[id]/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getActiveDogId } from "@/lib/scope";
import { prisma } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const dogId = await getActiveDogId();

  const entry = await prisma.weightEntry.findFirst({
    where: { id, dogId },
  });

  if (!entry) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await prisma.weightEntry.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
```

---

### Task 4: WeightLog client component

**Files:**
- Create: `app/components/WeightLog.tsx`

- [ ] **Step 1: Create the WeightLog component**

```tsx
// app/components/WeightLog.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Card } from "@/app/components/Card";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";
import { useToast } from "@/app/components/Toast";
import { fmtKg } from "@/lib/format";

export interface WeightEntry {
  id: string;
  measuredOn: string; // "YYYY-MM-DD"
  weightKg: number;
}

interface Props {
  initialEntries: WeightEntry[];
}

function fmtDatePtBR(iso: string): string {
  // iso is "YYYY-MM-DD"
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Tiny SVG sparkline for weight trend
function Sparkline({ entries }: { entries: WeightEntry[] }) {
  if (entries.length < 2) return null;

  const sorted = [...entries].sort((a, b) => a.measuredOn.localeCompare(b.measuredOn));
  const values = sorted.map((e) => e.weightKg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const W = 120;
  const H = 36;
  const padX = 4;
  const padY = 4;
  const plotW = W - padX * 2;
  const plotH = H - padY * 2;

  const pts = sorted.map((e, i) => {
    const x = padX + (i / (sorted.length - 1)) * plotW;
    const y = padY + plotH - ((e.weightKg - min) / range) * plotH;
    return `${x},${y}`;
  });

  const polyline = pts.join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <polyline
        points={polyline}
        fill="none"
        stroke="var(--brand)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {sorted.map((e, i) => {
        const [x, y] = pts[i].split(",").map(Number);
        return (
          <circle
            key={e.id}
            cx={x}
            cy={y}
            r={2.5}
            fill="var(--brand)"
            opacity={0.85}
          />
        );
      })}
    </svg>
  );
}

export function WeightLog({ initialEntries }: Props) {
  const router = useRouter();
  const { show } = useToast();
  const [entries, setEntries] = useState<WeightEntry[]>(initialEntries);
  const [dateVal, setDateVal] = useState("");
  const [kgVal, setKgVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Only set today's date on the client (avoid SSR mismatch)
  useEffect(() => {
    setDateVal(getTodayIso());
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const kg = parseFloat(kgVal.replace(",", "."));
    if (!dateVal || isNaN(kg) || kg <= 0) {
      show("Preencha a data e o peso (positivo).", { variant: "error" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ measuredOn: dateVal, weightKg: kg }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erro ao registrar");
      }
      const created: WeightEntry = await res.json();
      setEntries((prev) => [created, ...prev]);
      setKgVal("");
      setDateVal(getTodayIso());
      show("Peso registrado", { variant: "success" });
      router.refresh();
    } catch (err) {
      show(err instanceof Error ? err.message : "Erro ao registrar", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    setDeleteConfirm(null);
    try {
      const res = await fetch(`/api/weight/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover");
      setEntries((prev) => prev.filter((e) => e.id !== id));
      show("Removido", { variant: "success" });
      router.refresh();
    } catch {
      show("Erro ao remover", { variant: "error" });
    }
  }

  return (
    <Card>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Header with sparkline */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
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
            Peso
          </span>
          {entries.length >= 2 && <Sparkline entries={entries} />}
        </div>

        {/* Entry list */}
        {entries.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {entries.map((entry) => (
              <div
                key={entry.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  background: "var(--bg)",
                  borderRadius: "var(--radius-md)",
                  fontFamily: "var(--font-body)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span
                    style={{
                      fontSize: "var(--text-base)",
                      fontWeight: "var(--fw-semibold)" as unknown as number,
                      color: "var(--fg)",
                    }}
                  >
                    {fmtKg(entry.weightKg)}
                  </span>
                  <span
                    style={{ fontSize: "var(--text-xs)", color: "var(--fg-muted)" }}
                  >
                    {fmtDatePtBR(entry.measuredOn)}
                  </span>
                </div>
                <Button
                  variant={deleteConfirm === entry.id ? "destructive" : "ghost"}
                  size="sm"
                  iconOnly
                  icon={<Trash2 size={16} />}
                  aria-label={
                    deleteConfirm === entry.id
                      ? "Confirmar remoção"
                      : "Remover peso"
                  }
                  onClick={() => handleDelete(entry.id)}
                  title={
                    deleteConfirm === entry.id
                      ? "Clique para confirmar a remoção"
                      : "Remover"
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <p
            style={{
              color: "var(--fg-muted)",
              fontSize: "var(--text-sm)",
              fontFamily: "var(--font-body)",
              margin: 0,
            }}
          >
            Nenhum peso registrado.
          </p>
        )}

        {/* Add form */}
        <form
          onSubmit={handleAdd}
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ flex: 1 }}>
              <Input
                type="date"
                label="Data"
                value={dateVal}
                onChange={(e) => setDateVal(e.target.value)}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <Input
                type="text"
                inputMode="decimal"
                label="Peso (kg)"
                placeholder="29,4"
                value={kgVal}
                onChange={(e) => setKgVal(e.target.value)}
                required
              />
            </div>
          </div>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            fullWidth
            loading={loading}
          >
            Adicionar peso
          </Button>
        </form>
      </div>
    </Card>
  );
}
```

---

### Task 5: Profile page (server component + client ProfileCard)

**Files:**
- Replace: `app/(app)/profile/page.tsx`

- [ ] **Step 1: Replace the profile page**

The page is a server component that fetches the dog and latest weight, then renders:
1. An avatar Card (paw icon in brand-soft circle + dog name + subtitle)
2. A ProfileCard client component (editable info rows)
3. The WeightLog component
4. A logout Button (must be client — wrap in a small LogoutButton component inline)

```tsx
// app/(app)/profile/page.tsx
import React from "react";
import { getActiveDog } from "@/lib/scope";
import { prisma } from "@/lib/db";
import { fmtKg } from "@/lib/format";
import { ProfileClient } from "./ProfileClient";

export default async function ProfilePage() {
  const dog = await getActiveDog();

  // Serialize dog for client
  const dogData = {
    id: dog.id,
    name: dog.name,
    breed: dog.breed ?? null,
    birthdate: dog.birthdate ? dog.birthdate.toISOString().slice(0, 10) : null,
    diagnosis: dog.diagnosis ?? null,
    vetName: dog.vetName ?? null,
    emergencyContact: dog.emergencyContact ?? null,
  };

  // Fetch weight entries for initial render
  const weightEntries = await prisma.weightEntry.findMany({
    where: { dogId: dog.id },
    orderBy: { measuredOn: "desc" },
  });

  const serializedWeights = weightEntries.map((e) => ({
    id: e.id,
    measuredOn: e.measuredOn.toISOString().slice(0, 10),
    weightKg: e.weightKg.toNumber(),
  }));

  return (
    <ProfileClient
      dog={dogData}
      initialWeights={serializedWeights}
    />
  );
}
```

- [ ] **Step 2: Create the ProfileClient component**

```tsx
// app/(app)/profile/ProfileClient.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { PawPrint, Pencil, Check, X } from "lucide-react";
import { Card, CardChip } from "@/app/components/Card";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";
import { WeightLog, WeightEntry } from "@/app/components/WeightLog";
import { useToast } from "@/app/components/Toast";
import { fmtKg } from "@/lib/format";

interface DogData {
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

function InfoRow({
  label,
  value,
  editing,
  editValue,
  onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  editValue: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2px",
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
        {label}
      </span>
      {editing ? (
        <Input
          value={editValue}
          onChange={(e) => onChange(e.target.value)}
          style={{ minHeight: "36px", padding: "6px 10px", fontSize: "var(--text-sm)" }}
        />
      ) : (
        <span
          style={{
            fontSize: "var(--text-base)",
            color: value ? "var(--fg)" : "var(--fg-muted)",
            fontFamily: "var(--font-body)",
          }}
        >
          {value || "—"}
        </span>
      )}
    </div>
  );
}

export function ProfileClient({ dog: initialDog, initialWeights }: Props) {
  const router = useRouter();
  const { show } = useToast();
  const [dog, setDog] = useState(initialDog);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    vetName: initialDog.vetName ?? "",
    diagnosis: initialDog.diagnosis ?? "",
    emergencyContact: initialDog.emergencyContact ?? "",
    breed: initialDog.breed ?? "",
    birthdate: initialDog.birthdate ?? "",
  });

  const latestWeight = initialWeights[0]?.weightKg ?? null;
  const subtitle = dogSubtitle(dog);

  function startEdit() {
    setForm({
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
          breed: form.breed.trim() || null,
          birthdate: form.birthdate || null,
          diagnosis: form.diagnosis.trim() || null,
          vetName: form.vetName.trim() || null,
          emergencyContact: form.emergencyContact.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erro ao salvar");
      }
      const updated = await res.json();
      setDog(updated);
      setEditing(false);
      show("Perfil atualizado", { variant: "success" });
      router.refresh();
    } catch (err) {
      show(err instanceof Error ? err.message : "Erro ao salvar", { variant: "error" });
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

          {/* Peso row (read-only from weight log) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "2px",
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
                color: latestWeight ? "var(--fg)" : "var(--fg-muted)",
                fontFamily: "var(--font-body)",
              }}
            >
              {latestWeight !== null ? fmtKg(latestWeight) : "—"}
            </span>
          </div>

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
```

---

### Task 6: Verify — tsc + Playwright

- [ ] **Step 1: Run tsc**

```bash
cd /Users/lucas/dev/molly && npx tsc --noEmit
```
Expected: no output (zero errors)

- [ ] **Step 2: Start DB if not running**

```bash
cd /Users/lucas/dev/molly && docker compose up -d
```

- [ ] **Step 3: Start dev server if not running**

```bash
cd /Users/lucas/dev/molly && npm run dev
```

- [ ] **Step 4: Playwright flow**

1. Navigate to `http://localhost:3000/login`
2. Fill email `lucas.rmagalhaes@gmail.com`, password `molly123`, submit
3. Navigate to `/profile`
4. Add weight entry (2026-06-01, 29.4)
5. Confirm it appears in the list and sparkline updates
6. Edit "Veterinária" field to "Dra. Helena", save
7. Reload page — value persists
8. Delete the weight entry
9. Save screenshot to `.playwright-mcp/task7-profile-390.png` at 390px width
10. Report any console errors

- [ ] **Step 5: Commit**

```bash
cd /Users/lucas/dev/molly && git add -A && git commit -m "feat: dog profile + weight log (scoped API conventions)"
```
