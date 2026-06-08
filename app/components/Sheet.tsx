"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/app/components/ui/drawer";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}

// Thin themed wrapper over shadcn's Vaul-backed Drawer. Keeps the original
// Sheet API ({ open, onClose, title, children }) so all callers are unchanged,
// while gaining drag-to-dismiss, snap, focus trap, and scroll lock from Vaul.
export function Sheet({ open, onClose, title, children }: SheetProps) {
  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent
        className="bg-surface rounded-t-xl max-h-[90dvh]"
        aria-describedby={undefined}
      >
        {title ? (
          <DrawerHeader className="flex-row items-center justify-between pt-2 px-5 pb-3">
            <DrawerTitle className="font-display font-semibold text-xl text-fg">
              {title}
            </DrawerTitle>
            <DrawerClose
              aria-label="Fechar"
              className="text-fg-muted grid place-items-center p-3 rounded-sm [-webkit-tap-highlight-color:transparent]"
            >
              <X size={20} />
            </DrawerClose>
          </DrawerHeader>
        ) : (
          // Radix/Vaul requires a title for a11y; hide it visually when unused.
          <DrawerTitle className="sr-only">Painel</DrawerTitle>
        )}
        <div className={cn("overflow-y-auto px-5 pb-6", title ? "pt-0" : "pt-3")}>
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
