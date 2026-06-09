"use client";

import React from "react";
import { Package, RefreshCw, Calendar, CalendarPlus } from "lucide-react";
import { Sheet } from "@/app/components/Sheet";
import { cn } from "@/lib/cn";
import type { EnrichedMed } from "@/app/api/medications/enrich";

interface Props {
  open: boolean;
  onClose: () => void;
  med: EnrichedMed | null;
  onRestock: (med: EnrichedMed) => void;
  onAdjust: (med: EnrichedMed) => void;
  onSchedule: (med: EnrichedMed) => void;
}

// A single row in the action drawer. Either a tappable button (runs an action)
// or, for the Google Agenda .ics download, an anchor.
type ActionRow =
  | {
      kind: "button";
      key: string;
      label: string;
      icon: React.ReactNode;
      onSelect: (med: EnrichedMed) => void;
      tone?: "default" | "danger";
    }
  | {
      kind: "download";
      key: string;
      label: string;
      icon: React.ReactNode;
      href: (med: EnrichedMed) => string;
      ariaLabel: (med: EnrichedMed) => string;
    };

const rowBase =
  "w-full min-h-11 flex items-center gap-3 py-3 px-1 text-left " +
  "font-body text-base text-fg no-underline cursor-pointer " +
  "rounded-md transition-colors duration-[140ms] ease-standard " +
  "active:bg-bg [-webkit-tap-highlight-color:transparent]";

export function MedActionDrawer({
  open,
  onClose,
  med,
  onRestock,
  onAdjust,
  onSchedule,
}: Props) {
  // Typed list — RMP-180/181 append "Editar remédio" / "Arquivar remédio" here.
  const rows: ActionRow[] = [
    {
      kind: "button",
      key: "restock",
      label: "Repor estoque",
      icon: <Package size={20} />,
      onSelect: onRestock,
    },
    {
      kind: "button",
      key: "adjust",
      label: "Corrigir estoque",
      icon: <RefreshCw size={20} />,
      onSelect: onAdjust,
    },
    {
      kind: "button",
      key: "schedule",
      label: "Agendamento",
      icon: <Calendar size={20} />,
      onSelect: onSchedule,
    },
  ];

  // Google Agenda (.ics) only when the med has an active schedule.
  if (med?.activeSchedule) {
    rows.push({
      kind: "download",
      key: "calendar",
      label: "Adicionar ao Google Agenda",
      icon: <CalendarPlus size={20} />,
      href: (m) => `/api/medications/${m.id}/calendar.ics`,
      ariaLabel: (m) =>
        `Adicionar ${m.name} ao Google Agenda (baixar .ics)`,
    });
  }

  // Sequence close → run flow to avoid Vaul drawer-over-drawer races on iOS.
  function runAfterClose(fn: (med: EnrichedMed) => void) {
    if (!med) return;
    const target = med;
    onClose();
    setTimeout(() => fn(target), 250);
  }

  return (
    <Sheet open={open} onClose={onClose} title={med?.name}>
      {med && (
        <div className="flex flex-col gap-0.5">
          {rows.map((row) => {
            const danger = row.kind === "button" && row.tone === "danger";
            const iconCls = danger ? "text-danger" : "text-fg-muted";
            const labelCls = danger ? "text-danger" : "";

            if (row.kind === "download") {
              return (
                <a
                  key={row.key}
                  href={row.href(med)}
                  download
                  aria-label={row.ariaLabel(med)}
                  onClick={onClose}
                  className={rowBase}
                >
                  <span className={cn("grid place-items-center", iconCls)}>
                    {row.icon}
                  </span>
                  <span>{row.label}</span>
                </a>
              );
            }

            return (
              <button
                key={row.key}
                type="button"
                onClick={() => runAfterClose(row.onSelect)}
                className={cn(rowBase, labelCls)}
              >
                <span className={cn("grid place-items-center", iconCls)}>
                  {row.icon}
                </span>
                <span>{row.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </Sheet>
  );
}
