"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { fmtDateTimePt, fmtDuration } from "@/lib/format";
import { typeLabelPt, type SeizureType, type Severity } from "@/lib/seizure-types";

export interface RecentEpisodeData {
  id: string;
  occurredAt: string; // ISO
  type: SeizureType;
  durationSeconds: number | null;
  severity: Severity | null;
  isCluster: boolean;
  rescueGiven: boolean;
  notes: string | null;
}

interface Props {
  episodes: RecentEpisodeData[];
}

export function RecentEpisodes({ episodes }: Props) {
  if (episodes.length === 0) {
    return (
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-sm)",
          color: "var(--fg-muted)",
          margin: 0,
          textAlign: "center",
          padding: "8px 0",
        }}
      >
        Nenhum episódio registrado ainda.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {episodes.map((ep, i) => {
        const date = new Date(ep.occurredAt);
        const isEmergency = ep.durationSeconds !== null && ep.durationSeconds > 300;

        return (
          <Link
            key={ep.id}
            href={`/seizures/${ep.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "11px 0",
              borderTop: i !== 0 ? "1px solid var(--border)" : "none",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            {/* Date/time column */}
            <div
              style={{
                width: "72px",
                flexShrink: 0,
                textAlign: "center",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--fg)",
                lineHeight: 1.3,
              }}
            >
              {fmtDateTimePt(date)}
            </div>

            {/* Main info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "14.5px",
                  fontWeight: 600,
                  color: "var(--fg)",
                  fontFamily: "var(--font-body)",
                  marginBottom: "2px",
                }}
              >
                {typeLabelPt(ep.type)}
              </div>
              <div
                style={{
                  fontSize: "12.5px",
                  color: "var(--fg-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {ep.durationSeconds && ep.durationSeconds > 0
                  ? fmtDuration(ep.durationSeconds)
                  : "—"}
              </div>
              {/* Mini badges */}
              {(ep.isCluster || isEmergency) && (
                <div style={{ display: "flex", gap: "4px", marginTop: "4px", flexWrap: "wrap" }}>
                  {ep.isCluster && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "1px 7px",
                        borderRadius: "999px",
                        fontSize: "10px",
                        fontWeight: 700,
                        fontFamily: "var(--font-body)",
                        background: "var(--warning-soft, #fef3c7)",
                        color: "var(--warning, #d97706)",
                        border: "1px solid var(--amber-300, #fcd34d)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      Cluster
                    </span>
                  )}
                  {isEmergency && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "1px 7px",
                        borderRadius: "999px",
                        fontSize: "10px",
                        fontWeight: 700,
                        fontFamily: "var(--font-body)",
                        background: "var(--danger-soft, #fee2e2)",
                        color: "var(--danger, #dc2626)",
                        border: "1px solid var(--red-200, #fecaca)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      Emergência
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Chevron */}
            <span style={{ color: "var(--fg-muted)", display: "inline-flex", flexShrink: 0 }}>
              <ChevronRight size={18} />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
