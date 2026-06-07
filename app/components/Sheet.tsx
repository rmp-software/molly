"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  // Only mount the portal after the first open (avoids SSR mismatch and
  // prevents the sheet DOM from appearing in the initial render / screenshots).
  const [everOpened, setEverOpened] = useState(false);

  useEffect(() => {
    if (open) setEverOpened(true);
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
      style={{
        position: "fixed",
        inset: 0,
        zIndex: "var(--z-sheet)" as unknown as number,
        pointerEvents: open ? "auto" : "none",
        visibility: open ? "visible" : "hidden",
      }}
    >
      {/* Scrim */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(42, 37, 29, 0.45)",
          opacity: open ? 1 : 0,
          transition: `opacity var(--dur-base) var(--ease-standard)`,
        }}
      />
      {/* Sheet panel */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal
        aria-label={title}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          background: "var(--surface)",
          borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
          paddingBottom: "var(--safe-bottom)",
          boxShadow: "var(--shadow-lg)",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: `transform var(--dur-base) var(--ease-out)`,
          maxHeight: "90dvh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Grip handle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: "12px",
            paddingBottom: "4px",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: "36px",
              height: "4px",
              borderRadius: "999px",
              background: "var(--border-strong)",
            }}
          />
        </div>

        {/* Header */}
        {title && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 20px 12px",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "var(--text-xl)",
                color: "var(--fg)",
              }}
            >
              {title}
            </span>
            <button
              aria-label="Fechar"
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--fg-muted)",
                display: "grid",
                placeItems: "center",
                padding: "8px",
                borderRadius: "var(--radius-sm)",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Content */}
        <div
          style={{
            padding: title ? "0 20px 24px" : "12px 20px 24px",
            overflowY: "auto",
            flex: 1,
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
