"use client";

import React from "react";
import { Toaster as SonnerToaster, toast } from "sonner";

export type ToastVariant = "success" | "warning" | "error" | "info";

/**
 * Thin shim over Sonner that preserves the original useToast() API
 * (`show(message, { variant, duration })`) so all call sites are unchanged.
 */
export function useToast() {
  return {
    show: (
      message: string,
      { variant = "info", duration }: { variant?: ToastVariant; duration?: number } = {}
    ) => {
      const fn =
        variant === "success"
          ? toast.success
          : variant === "error"
            ? toast.error
            : variant === "warning"
              ? toast.warning
              : toast.info;
      fn(message, duration ? { duration } : undefined);
    },
  };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SonnerToaster
        position="bottom-center"
        offset="calc(var(--tabbar-h) + var(--safe-bottom) + 12px)"
        toastOptions={{
          classNames: {
            toast:
              "!bg-surface !text-fg !border !border-border !rounded-md !shadow-md !font-body",
            title: "!font-medium",
            description: "!text-fg-muted",
            success: "!text-success",
            error: "!text-danger",
            warning: "!text-warning",
            info: "!text-info",
          },
        }}
      />
    </>
  );
}
