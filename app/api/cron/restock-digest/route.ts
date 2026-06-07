/**
 * GET /api/cron/restock-digest
 *
 * Daily restock digest cron job.
 * Secured by CRON_SECRET (Vercel Cron injects this via Authorization header).
 * Auth is NOT delegated to next-auth middleware — see middleware.ts matcher.
 *
 * Structure note: resolveRecipient(dog) is a seam for future per-dog/per-user
 * recipients. Today it reads ALERT_EMAIL_TO from the environment.
 */

import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enrichMed } from "@/app/api/medications/enrich";
import { buildDigest, sendDigestEmail } from "@/lib/email";

// ─── recipient seam ────────────────────────────────────────────────────────

/**
 * Resolve the alert recipient email for a given dog.
 *
 * v1: reads ALERT_EMAIL_TO from env (one shared recipient for all dogs).
 * Future: look up the dog owner's email via `dog.userId` or a preferences
 * table so each user gets alerts about their own dog.
 */
function resolveRecipient(_dog: { id: string; name: string }): string | null {
  return process.env.ALERT_EMAIL_TO ?? null;
}

// ─── GET handler ──────────────────────────────────────────────────────────

export async function GET(request: Request) {
  // 1. Authenticate via CRON_SECRET (fail-closed: missing secret → 500)
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "misconfigured" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${cronSecret}`;
  const a = Buffer.from(authHeader);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // 2. Load all dogs (v1: one dog)
    const dogs = await prisma.dog.findMany({ orderBy: { createdAt: "asc" } });

    if (dogs.length === 0) {
      return NextResponse.json({ processed: 0, sentCount: 0, results: [] });
    }

    // 3–6. Process each dog independently; one failure must not abort others
    const results: { dog: string; sent: boolean; count: number }[] = [];
    let sentCount = 0;

    for (const dog of dogs) {
      try {
        // Load active medications with relations + latest weight
        const [meds, latestWeightEntry] = await Promise.all([
          prisma.medication.findMany({
            where: { dogId: dog.id, isActive: true },
            include: {
              schedules: { orderBy: { effectiveFrom: "asc" } },
              stockTransactions: { orderBy: { occurredAt: "asc" } },
            },
            orderBy: { createdAt: "asc" },
          }),
          prisma.weightEntry.findFirst({
            where: { dogId: dog.id },
            orderBy: { measuredOn: "desc" },
            select: { weightKg: true },
          }),
        ]);

        const latestWeightKg = latestWeightEntry
          ? latestWeightEntry.weightKg.toNumber()
          : null;

        // Enrich each med (reuses the same engine as the dashboard)
        const enriched = meds.map((med) => enrichMed(med, now, latestWeightKg));

        // Build digest
        const digest = buildDigest(enriched);
        if (!digest) {
          results.push({ dog: dog.name, sent: false, count: 0 });
          continue;
        }

        // Resolve recipient and send
        const recipient = resolveRecipient(dog);
        if (!recipient) {
          results.push({ dog: dog.name, sent: false, count: 0 });
          continue;
        }

        const emailResult = await sendDigestEmail(
          recipient,
          digest.subject,
          digest.body,
          digest.html
        );

        const alertCount = enriched.filter(
          (m) => m.status === "reorder" || m.status === "urgent"
        ).length;

        if (emailResult.sent) sentCount++;
        results.push({ dog: dog.name, sent: emailResult.sent, count: alertCount });
      } catch (dogErr) {
        console.error(`[restock-digest] error processing dog ${dog.id}:`, dogErr);
        results.push({ dog: dog.name, sent: false, count: 0 });
      }
    }

    return NextResponse.json({
      processed: dogs.length,
      sentCount,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
