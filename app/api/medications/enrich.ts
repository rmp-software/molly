/**
 * Shared enrichment helper — maps Prisma medication rows to the enriched API shape.
 * Called by both GET /api/medications and GET /api/medications/[id].
 */

import type { Prisma } from "@prisma/client";
import { activeScheduleOn, dailyConsumption } from "@/lib/schedule";
import {
  currentStock,
  daysRemaining,
  reorderByDate as computeReorderByDate,
  stockStatus,
} from "@/lib/stock";
import { mgPerKg } from "@/lib/dosing";
import { dbDateToLocalMidnight, dbDateToLocalMidnightNullable } from "@/lib/dates";

// Prisma row types (narrow shapes we need)
type PrismaMedRow = {
  id: string;
  name: string;
  category: string;
  form: string;
  strengthMg: Prisma.Decimal | null;
  reorderLeadTimeDays: number;
  notes: string | null;
  schedules: Array<{
    id: string;
    doseTimes: string[];
    unitsPerDose: Prisma.Decimal;
    effectiveFrom: Date;
    effectiveTo: Date | null;
  }>;
  stockTransactions: Array<{
    type: string;
    quantity: Prisma.Decimal;
    occurredAt: Date;
  }>;
};

export interface EnrichedMed {
  id: string;
  name: string;
  category: string;
  form: string;
  strengthMg: number | null;
  reorderLeadTimeDays: number;
  notes: string | null;
  activeSchedule: {
    id: string;
    doseTimes: string[];
    unitsPerDose: number;
    effectiveFrom: string;
  } | null;
  scheduleHistory: Array<{
    id: string;
    doseTimes: string[];
    unitsPerDose: number;
    effectiveFrom: string;
    effectiveTo: string | null;
  }>;
  dailyConsumption: number;
  currentStock: number;
  daysRemaining: number | null;
  reorderByDate: string | null;
  status: "ok" | "reorder" | "urgent";
  mgPerKg: number | null;
}

export function enrichMed(
  med: PrismaMedRow,
  now: Date,
  latestWeightKg: number | null
): EnrichedMed {
  const strengthMgNum = med.strengthMg ? med.strengthMg.toNumber() : null;
  const leadTime = med.reorderLeadTimeDays;

  // Map Prisma schedule rows to engine Schedule shape.
  // effectiveFrom / effectiveTo are @db.Date columns that come back as UTC-midnight
  // Date objects; dbDateToLocalMidnight() converts them to LOCAL-midnight so that
  // the schedule engine's local-getter date-only comparisons land on the right day.
  const scheduleShapes = med.schedules.map((s) => ({
    doseTimes: s.doseTimes,
    unitsPerDose: s.unitsPerDose.toNumber(),
    effectiveFrom: dbDateToLocalMidnight(s.effectiveFrom),
    effectiveTo: dbDateToLocalMidnightNullable(s.effectiveTo),
  }));

  // Map Prisma stock transaction rows to engine StockTx shape
  const txShapes = med.stockTransactions.map((t) => ({
    type: t.type as "restock" | "adjustment" | "consumption",
    quantity: t.quantity.toNumber(),
    occurredAt: t.occurredAt instanceof Date ? t.occurredAt : new Date(t.occurredAt),
  }));

  // Engine calls
  const active = activeScheduleOn(scheduleShapes, now);
  const daily = active ? dailyConsumption(active) : 0;
  const stock = currentStock(txShapes, scheduleShapes, now);
  const dr = daysRemaining(stock, daily);
  const reorderDate =
    dr != null ? computeReorderByDate(now, dr, leadTime) : null;
  const status = stockStatus(dr, leadTime);
  const mgPerKgVal = mgPerKg(daily, strengthMgNum, latestWeightKg);

  // Find the active schedule row by matching effectiveFrom + effectiveTo.
  // Use dbDateToLocalMidnight so the comparison is against the same local-midnight
  // Date that was used when building scheduleShapes above.
  const activeSchedRow = active
    ? med.schedules.find(
        (s) =>
          s.doseTimes.join(",") === active.doseTimes.join(",") &&
          s.unitsPerDose.toNumber() === active.unitsPerDose &&
          dbDateToLocalMidnight(s.effectiveFrom).getTime() === active.effectiveFrom.getTime()
      ) ?? null
    : null;

  return {
    id: med.id,
    name: med.name,
    category: med.category,
    form: med.form,
    strengthMg: strengthMgNum,
    reorderLeadTimeDays: leadTime,
    notes: med.notes,
    activeSchedule: activeSchedRow
      ? {
          id: activeSchedRow.id,
          doseTimes: activeSchedRow.doseTimes,
          unitsPerDose: activeSchedRow.unitsPerDose.toNumber(),
          effectiveFrom: (activeSchedRow.effectiveFrom instanceof Date
            ? activeSchedRow.effectiveFrom
            : new Date(activeSchedRow.effectiveFrom)
          ).toISOString().slice(0, 10),
        }
      : null,
    scheduleHistory: med.schedules.map((s) => ({
      id: s.id,
      doseTimes: s.doseTimes,
      unitsPerDose: s.unitsPerDose.toNumber(),
      effectiveFrom: (s.effectiveFrom instanceof Date ? s.effectiveFrom : new Date(s.effectiveFrom))
        .toISOString()
        .slice(0, 10),
      effectiveTo: s.effectiveTo
        ? (s.effectiveTo instanceof Date ? s.effectiveTo : new Date(s.effectiveTo as string))
            .toISOString()
            .slice(0, 10)
        : null,
    })),
    dailyConsumption: daily,
    currentStock: stock,
    daysRemaining: dr,
    reorderByDate: reorderDate ? reorderDate.toISOString().slice(0, 10) : null,
    status,
    mgPerKg: mgPerKgVal,
  };
}
