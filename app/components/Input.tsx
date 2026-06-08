"use client";

import React from "react";
import { cn } from "@/lib/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

const labelCls = "block text-sm font-semibold text-fg-2 mb-1.5 font-body";

// max-w-full + min-w-0 keep native date/time inputs from overflowing on iOS Safari.
const inputBase =
  "block w-full max-w-full min-w-0 min-h-12 px-3.5 py-3 text-base font-body text-fg " +
  "bg-surface border-[1.5px] border-border-strong rounded-md outline-none " +
  "transition-[border-color,box-shadow] duration-[140ms] ease-standard " +
  "[-webkit-tap-highlight-color:transparent] " +
  "focus:border-brand focus:shadow-focus";

const errorCls = "border-danger focus:border-danger";
const hintCls = "text-xs text-fg-muted mt-[5px] font-body";
const errorTextCls = "text-xs text-danger mt-[5px] font-body";

function useFieldIds(id: string | undefined, label: string | undefined) {
  const inputId =
    id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  const errorId = inputId ? `${inputId}-error` : undefined;
  const hintId = inputId ? `${inputId}-hint` : undefined;
  return { inputId, errorId, hintId };
}

export function Input({
  label,
  hint,
  error,
  leadingIcon,
  trailingIcon,
  className,
  id,
  ...rest
}: InputProps) {
  const { inputId, errorId, hintId } = useFieldIds(id, label);
  const describedBy =
    [error && errorId, !error && hint && hintId].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="flex flex-col">
      {label && (
        <label htmlFor={inputId} className={labelCls}>
          {label}
        </label>
      )}
      <div className="relative">
        {leadingIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted inline-flex pointer-events-none">
            {leadingIcon}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            inputBase,
            leadingIcon && "pl-10",
            trailingIcon && "pr-10",
            error && errorCls,
            className
          )}
          {...rest}
        />
        {trailingIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted inline-flex pointer-events-none">
            {trailingIcon}
          </span>
        )}
      </div>
      {error && (
        <span id={errorId} role="alert" className={errorTextCls}>
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={hintId} className={hintCls}>
          {hint}
        </span>
      )}
    </div>
  );
}

export function Textarea({
  label,
  hint,
  error,
  className,
  id,
  rows = 4,
  ...rest
}: TextareaProps) {
  const { inputId, errorId, hintId } = useFieldIds(id, label);
  const describedBy =
    [error && errorId, !error && hint && hintId].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="flex flex-col">
      {label && (
        <label htmlFor={inputId} className={labelCls}>
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          inputBase,
          "min-h-0 resize-y leading-normal",
          error && errorCls,
          className
        )}
        {...rest}
      />
      {error && (
        <span id={errorId} role="alert" className={errorTextCls}>
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={hintId} className={hintCls}>
          {hint}
        </span>
      )}
    </div>
  );
}
