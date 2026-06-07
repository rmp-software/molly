"use client";

import React from "react";

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

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "var(--text-sm)",
  fontWeight: "var(--fw-semibold)" as unknown as number,
  color: "var(--fg-2)",
  marginBottom: "6px",
  fontFamily: "var(--font-body)",
};

const inputBaseStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  minHeight: "48px",
  padding: "12px 14px",
  fontSize: "var(--text-base)",
  fontFamily: "var(--font-body)",
  color: "var(--fg)",
  background: "var(--surface)",
  border: "1.5px solid var(--border-strong)",
  borderRadius: "var(--radius-md)",
  outline: "none",
  transition: `border-color var(--dur-fast) var(--ease-standard),
    box-shadow var(--dur-fast) var(--ease-standard)`,
  WebkitTapHighlightColor: "transparent",
  boxSizing: "border-box",
};

const hintStyle: React.CSSProperties = {
  fontSize: "var(--text-xs)",
  color: "var(--fg-muted)",
  marginTop: "5px",
  fontFamily: "var(--font-body)",
};

const errorStyle: React.CSSProperties = {
  ...hintStyle,
  color: "var(--danger)",
};

export function Input({
  label,
  hint,
  error,
  leadingIcon,
  trailingIcon,
  className = "",
  style,
  id,
  ...rest
}: InputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  const errorId = inputId ? `${inputId}-error` : undefined;
  const hintId = inputId ? `${inputId}-hint` : undefined;
  const describedBy =
    [error && errorId, !error && hint && hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {label && (
        <label htmlFor={inputId} style={labelStyle}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        {leadingIcon && (
          <span
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--fg-muted)",
              display: "inline-flex",
              pointerEvents: "none",
            }}
          >
            {leadingIcon}
          </span>
        )}
        <input
          id={inputId}
          className={className}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          style={{
            ...inputBaseStyle,
            ...(leadingIcon ? { paddingLeft: "40px" } : {}),
            ...(trailingIcon ? { paddingRight: "40px" } : {}),
            ...(error ? { borderColor: "var(--danger)" } : {}),
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--brand)";
            e.currentTarget.style.boxShadow = "var(--focus-ring-shadow)";
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error
              ? "var(--danger)"
              : "var(--border-strong)";
            e.currentTarget.style.boxShadow = "none";
            rest.onBlur?.(e);
          }}
          {...rest}
        />
        {trailingIcon && (
          <span
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--fg-muted)",
              display: "inline-flex",
              pointerEvents: "none",
            }}
          >
            {trailingIcon}
          </span>
        )}
      </div>
      {error && (
        <span id={errorId} role="alert" style={errorStyle}>
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={hintId} style={hintStyle}>
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
  className = "",
  style,
  id,
  rows = 4,
  ...rest
}: TextareaProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  const errorId = inputId ? `${inputId}-error` : undefined;
  const hintId = inputId ? `${inputId}-hint` : undefined;
  const describedBy =
    [error && errorId, !error && hint && hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {label && (
        <label htmlFor={inputId} style={labelStyle}>
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        className={className}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        style={{
          ...inputBaseStyle,
          minHeight: "unset",
          resize: "vertical",
          lineHeight: "var(--lh-normal)",
          ...(error ? { borderColor: "var(--danger)" } : {}),
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--brand)";
          e.currentTarget.style.boxShadow = "var(--focus-ring-shadow)";
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error
            ? "var(--danger)"
            : "var(--border-strong)";
          e.currentTarget.style.boxShadow = "none";
          rest.onBlur?.(e);
        }}
        {...rest}
      />
      {error && (
        <span id={errorId} role="alert" style={errorStyle}>
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={hintId} style={hintStyle}>
          {hint}
        </span>
      )}
    </div>
  );
}
