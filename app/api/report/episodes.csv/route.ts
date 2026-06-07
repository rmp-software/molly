import { requireSession } from "@/lib/auth";
import { getActiveDogId } from "@/lib/scope";
import { prisma } from "@/lib/db";
import { typeLabelPt } from "@/lib/seizure-types";
import { fmtDuration, fmtDateTimePt } from "@/lib/format";
import { NextResponse } from "next/server";

function defaultRange(): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date(to);
  from.setMonth(from.getMonth() - 6);
  return { from, to };
}

/**
 * Quote a CSV field using `;`-delimited pt-BR convention.
 * Fields containing `;`, `"`, or newlines are wrapped in double-quotes.
 * Inner double-quotes are doubled ("").
 */
function csvField(value: string): string {
  if (value.includes(";") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const SEVERITY_PT: Record<string, string> = {
  mild: "Leve",
  moderate: "Moderada",
  severe: "Grave",
};

export async function GET(request: Request) {
  try {
    await requireSession();
  } catch {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const dogId = await getActiveDogId();
  const url = new URL(request.url);
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");

  let from: Date;
  let to: Date;

  if (fromStr || toStr) {
    const defaults = defaultRange();
    if (fromStr) {
      const d = new Date(fromStr);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "invalid from date" }, { status: 400 });
      }
      from = d;
    } else {
      from = defaults.from;
    }
    if (toStr) {
      const d = new Date(toStr);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "invalid to date" }, { status: 400 });
      }
      to = d;
    } else {
      to = defaults.to;
    }
  } else {
    const defaults = defaultRange();
    from = defaults.from;
    to = defaults.to;
  }

  const episodes = await prisma.seizureEpisode.findMany({
    where: {
      dogId,
      occurredAt: { gte: from, lte: to },
    },
    orderBy: { occurredAt: "desc" },
  });

  // Build filename based on range
  const fromLabel = from.toISOString().slice(0, 10);
  const toLabel = to.toISOString().slice(0, 10);
  const filename = `molly-crises-${fromLabel}-${toLabel}.csv`;

  // UTF-8 BOM for Excel pt-BR compatibility
  const BOM = "﻿";
  const DELIM = ";";

  const headerRow = [
    "Data",
    "Hora",
    "Tipo",
    "Duração",
    "Severidade",
    "Cluster",
    "Resgate",
    "Observações",
  ]
    .map(csvField)
    .join(DELIM);

  const rows = episodes.map((e) => {
    const dateTime = fmtDateTimePt(e.occurredAt);
    // fmtDateTimePt returns "DD/MM/YYYY, HH:MM" — split on ", "
    const parts = dateTime.split(", ");
    const datePart = csvField(parts[0] ?? dateTime);
    const timePart = csvField(parts[1] ?? "");

    const tipo = csvField(typeLabelPt(e.type));
    const duracao = csvField(e.durationSeconds != null ? fmtDuration(e.durationSeconds) : "—");
    const severidade = csvField(e.severity ? (SEVERITY_PT[e.severity] ?? e.severity) : "—");
    const cluster = csvField(e.isCluster ? "Sim" : "Não");
    const resgate = csvField(e.rescueGiven ? "Sim" : "Não");
    const obs = csvField(e.notes ?? "");

    return [datePart, timePart, tipo, duracao, severidade, cluster, resgate, obs].join(DELIM);
  });

  const csvBody = [BOM + headerRow, ...rows].join("\r\n");

  return new Response(csvBody, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
