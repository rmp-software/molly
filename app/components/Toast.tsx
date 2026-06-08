"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { CheckCircle, AlertTriangle, Info, XCircle, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type ToastVariant = "success" | "warning" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  show: (message: string, options?: { variant?: ToastVariant; duration?: number }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const variantClass: Record<ToastVariant, string> = {
  success: "bg-success-soft text-success border-[var(--green-200)]",
  warning: "bg-warning-soft text-warning border-[var(--amber-300)]",
  error: "bg-danger-soft text-danger border-[var(--red-200)]",
  info: "bg-info-soft text-info border-[var(--blue-200)]",
};

const VariantIcon = ({ variant }: { variant: ToastVariant }) => {
  switch (variant) {
    case "success":
      return <CheckCircle size={18} className="flex-none" />;
    case "warning":
      return <AlertTriangle size={18} className="flex-none" />;
    case "error":
      return <XCircle size={18} className="flex-none" />;
    default:
      return <Info size={18} className="flex-none" />;
  }
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const variant = toast.variant ?? "info";
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-2.5 py-3 px-3.5 rounded-md border border-transparent shadow-md",
        "font-body text-sm font-medium min-w-[240px] max-w-[360px]",
        variantClass[variant]
      )}
      // keyframe entry animation stays inline (no utility for @keyframes)
      style={{ animation: "molly-toast-in 220ms var(--ease-out) both" }}
    >
      <VariantIcon variant={variant} />
      <span className="flex-1">{toast.message}</span>
      <button
        aria-label="Fechar"
        onClick={() => onDismiss(toast.id)}
        className="bg-transparent border-0 cursor-pointer text-current opacity-60 grid place-items-center p-3 rounded-[4px] flex-none"
      >
        <X size={15} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (
      message: string,
      { variant = "info", duration = 4000 }: { variant?: ToastVariant; duration?: number } = {}
    ) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const toast: Toast = { id, message, variant, duration };
      setToasts((prev) => [...prev, toast]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {mounted &&
        createPortal(
          <div
            aria-label="Notificações"
            className={cn(
              "fixed bottom-[calc(var(--tabbar-h)+var(--safe-bottom)+12px)] left-1/2 -translate-x-1/2 z-[var(--z-toast)]",
              "flex flex-col gap-2 items-center",
              toasts.length > 0 ? "pointer-events-auto" : "pointer-events-none"
            )}
          >
            {toasts.map((t) => (
              <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
