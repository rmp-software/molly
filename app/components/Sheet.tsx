"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // Only mount the portal after the first open (avoids SSR mismatch and
  // prevents the sheet DOM from appearing in the initial render / screenshots).
  const [everOpened, setEverOpened] = useState(false);

  useEffect(() => {
    if (open) setEverOpened(true);
  }, [open]);

  // Move focus to sheet panel when opened
  useEffect(() => {
    if (open && sheetRef.current) {
      sheetRef.current.focus();
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!everOpened) return null;

  return createPortal(
    <div
      aria-hidden={!open}
      className={cn(
        "fixed inset-0 z-[var(--z-sheet)]",
        open ? "pointer-events-auto visible" : "pointer-events-none invisible"
      )}
    >
      {/* Scrim */}
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-[var(--scrim)] transition-opacity duration-[220ms] ease-standard",
          open ? "opacity-100" : "opacity-0"
        )}
      />
      {/* Sheet panel */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal
        tabIndex={-1}
        {...(title ? { "aria-labelledby": titleId } : { "aria-label": "Sheet" })}
        className={cn(
          "absolute left-0 right-0 bottom-0 bg-surface rounded-t-xl pb-[var(--safe-bottom)] shadow-lg",
          "max-h-[90dvh] flex flex-col transition-transform duration-[220ms] ease-out",
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Grip handle */}
        <div className="flex justify-center pt-3 pb-1 flex-none">
          <span className="w-9 h-1 rounded-pill bg-border-strong" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between pt-2 px-5 pb-3 flex-none">
            <span
              id={titleId}
              className="font-display font-semibold text-xl text-fg"
            >
              {title}
            </span>
            <button
              aria-label="Fechar"
              onClick={onClose}
              className="bg-transparent border-none cursor-pointer text-fg-muted grid place-items-center p-3 rounded-sm [-webkit-tap-highlight-color:transparent]"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Content */}
        <div
          className={cn(
            "overflow-y-auto flex-1 px-5 pb-6",
            title ? "pt-0" : "pt-3"
          )}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
