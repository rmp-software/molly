"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
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

const badgeBase =
  "inline-flex items-center py-px px-[7px] rounded-pill text-[10px] font-bold font-body border uppercase tracking-wide";

export function RecentEpisodes({ episodes }: Props) {
  if (episodes.length === 0) {
    return (
      <p className="font-body text-sm text-fg-muted m-0 text-center py-2">
        Nenhum episódio registrado ainda.
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      {episodes.map((ep, i) => {
        const date = new Date(ep.occurredAt);
        const isEmergency = ep.durationSeconds !== null && ep.durationSeconds > 300;

        return (
          <Link
            key={ep.id}
            href={`/seizures/${ep.id}`}
            className={cn(
              "flex items-center gap-3 py-[11px] no-underline text-inherit",
              i !== 0 && "border-t border-border"
            )}
          >
            {/* Date/time column */}
            <div className="w-[72px] shrink-0 text-center font-mono text-xs font-semibold text-fg leading-[1.3]">
              {fmtDateTimePt(date)}
            </div>

            {/* Main info */}
            <div className="flex-1 min-w-0">
              <div className="text-[14.5px] font-semibold text-fg font-body mb-0.5">
                {typeLabelPt(ep.type)}
              </div>
              <div className="text-[12.5px] text-fg-muted font-mono">
                {ep.durationSeconds && ep.durationSeconds > 0
                  ? fmtDuration(ep.durationSeconds)
                  : "—"}
              </div>
              {/* Mini badges */}
              {(ep.isCluster || isEmergency) && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {ep.isCluster && (
                    <span
                      className={cn(
                        badgeBase,
                        "bg-warning-soft text-warning border-[var(--amber-300)]"
                      )}
                    >
                      Cluster
                    </span>
                  )}
                  {isEmergency && (
                    <span
                      className={cn(
                        badgeBase,
                        "bg-danger-soft text-danger border-[var(--red-200)]"
                      )}
                    >
                      Emergência
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Chevron */}
            <span className="text-fg-muted inline-flex shrink-0">
              <ChevronRight size={18} />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
