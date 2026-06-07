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

const variantStyle: Record<ToastVariant, React.CSSProperties> = {
  success: {
    background: "var(--success-soft)",
    color: "var(--success)",
    borderColor: "var(--green-200)",
  },
  warning: {
    background: "var(--warning-soft)",
    color: "var(--warning)",
    borderColor: "var(--amber-300)",
  },
  error: {
    background: "var(--danger-soft)",
    color: "var(--danger)",
    borderColor: "var(--red-200)",
  },
  info: {
    background: "var(--info-soft)",
    color: "var(--info)",
    borderColor: "var(--blue-200)",
  },
};

const VariantIcon = ({ variant }: { variant: ToastVariant }) => {
  const style = { width: "18px", height: "18px", flex: "none" };
  switch (variant) {
    case "success":
      return <CheckCircle style={style} />;
    case "warning":
      return <AlertTriangle style={style} />;
    case "error":
      return <XCircle style={style} />;
    default:
      return <Info style={style} />;
  }
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const variant = toast.variant ?? "info";
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "12px 14px",
        borderRadius: "var(--radius-md)",
        border: "1px solid transparent",
        boxShadow: "var(--shadow-md)",
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-sm)",
        fontWeight: "var(--fw-medium)" as unknown as number,
        minWidth: "240px",
        maxWidth: "360px",
        animation: "molly-toast-in 220ms var(--ease-out) both",
        ...variantStyle[variant],
      }}
    >
      <VariantIcon variant={variant} />
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        aria-label="Fechar"
        onClick={() => onDismiss(toast.id)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "currentColor",
          opacity: 0.6,
          display: "grid",
          placeItems: "center",
          padding: "2px",
          borderRadius: "4px",
          flexShrink: 0,
        }}
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
          <>
            <style>{`
              @keyframes molly-toast-in {
                from { opacity: 0; transform: translateY(8px) scale(0.97); }
                to   { opacity: 1; transform: translateY(0) scale(1); }
              }
              @keyframes molly-spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
            <div
              aria-label="Notificações"
              style={{
                position: "fixed",
                bottom: "calc(var(--tabbar-h) + var(--safe-bottom) + 12px)",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: "var(--z-toast)" as unknown as number,
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                alignItems: "center",
                pointerEvents: toasts.length > 0 ? "auto" : "none",
              }}
            >
              {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
              ))}
            </div>
          </>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
