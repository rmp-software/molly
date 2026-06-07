"use client";

import React from "react";
import Link from "next/link";

export interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
}

export interface CenterAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export interface TabBarProps {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  centerAction?: CenterAction;
  fixed?: boolean;
  className?: string;
}

export function TabBar({
  items,
  active,
  onChange,
  centerAction,
  fixed = false,
  className = "",
}: TabBarProps) {
  const mid = Math.ceil(items.length / 2);
  const left = centerAction ? items.slice(0, mid) : items;
  const right = centerAction ? items.slice(mid) : [];

  const navStyle: React.CSSProperties = {
    position: fixed ? "fixed" : "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: "var(--z-tabbar)" as unknown as number,
    background: "color-mix(in srgb, var(--surface) 88%, transparent)",
    WebkitBackdropFilter: "saturate(1.4) blur(14px)",
    backdropFilter: "saturate(1.4) blur(14px)",
    borderTop: "1px solid var(--border)",
    paddingBottom: "var(--safe-bottom)",
    fontFamily: "var(--font-body)",
  };

  const rowStyle: React.CSSProperties = {
    height: "var(--tabbar-h)",
    display: "flex",
    alignItems: "stretch",
    maxWidth: "var(--app-max)",
    margin: "0 auto",
  };

  const renderTab = (item: TabItem) => {
    const isActive = item.id === active;
    const tabStyle: React.CSSProperties = {
      flex: 1,
      background: "none",
      border: 0,
      cursor: "pointer",
      minWidth: "var(--tap-min)",
      minHeight: "var(--tap-min)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "3px",
      color: isActive ? "var(--brand)" : "var(--fg-muted)",
      padding: "6px 4px",
      WebkitTapHighlightColor: "transparent",
      transition: `color var(--dur-fast) var(--ease-standard)`,
      textDecoration: "none",
    };
    const inner = (
      <>
        <span
          style={{
            display: "inline-flex",
            transition: `transform var(--dur-fast) var(--ease-spring)`,
            transform: isActive ? "translateY(-1px)" : "none",
          }}
        >
          {isActive && item.activeIcon ? item.activeIcon : item.icon}
        </span>
        <span
          style={{
            fontSize: "11px",
            fontWeight: "var(--fw-semibold)" as unknown as number,
            letterSpacing: "-0.01em",
          }}
        >
          {item.label}
        </span>
      </>
    );
    return (
      <Link
        key={item.id}
        href={item.id}
        aria-current={isActive ? "page" : undefined}
        aria-label={item.label}
        prefetch
        style={tabStyle}
        onClick={() => onChange(item.id)}
      >
        {inner}
      </Link>
    );
  };

  return (
    <nav className={className} style={navStyle}>
      <div style={rowStyle}>
        {left.map(renderTab)}
        {centerAction && (
          <div
            style={{
              flex: "none",
              width: "78px",
              position: "relative",
            }}
          >
            <button
              aria-label={centerAction.label}
              onClick={centerAction.onClick}
              style={{
                position: "absolute",
                left: "50%",
                top: "-22px",
                transform: "translateX(-50%)",
                width: "58px",
                height: "58px",
                borderRadius: "var(--radius-pill)",
                background: "var(--brand)",
                color: "var(--brand-on)",
                border: "4px solid var(--surface)",
                boxShadow: "var(--shadow-brand)",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                transition: `background var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-spring)`,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {centerAction.icon}
            </button>
            <span
              style={{
                position: "absolute",
                top: "40px",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: "10.5px",
                fontWeight: "var(--fw-bold)" as unknown as number,
                color: "var(--brand)",
                whiteSpace: "nowrap",
              }}
            >
              {centerAction.label}
            </span>
          </div>
        )}
        {right.map(renderTab)}
      </div>
    </nav>
  );
}
