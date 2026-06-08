"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

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
  className,
}: TabBarProps) {
  const mid = Math.ceil(items.length / 2);
  const left = centerAction ? items.slice(0, mid) : items;
  const right = centerAction ? items.slice(mid) : [];

  const renderTab = (item: TabItem) => {
    const isActive = item.id === active;
    return (
      <Link
        key={item.id}
        href={item.id}
        aria-current={isActive ? "page" : undefined}
        aria-label={item.label}
        prefetch
        className={cn(
          "flex-1 flex flex-col items-center justify-center gap-[3px] py-1.5 px-1 no-underline",
          "min-w-[var(--tap-min)] min-h-[var(--tap-min)]",
          "transition-colors duration-[140ms] ease-standard [-webkit-tap-highlight-color:transparent]",
          isActive ? "text-brand" : "text-fg-muted"
        )}
      >
        <span
          className={cn(
            "inline-flex transition-transform duration-[140ms] ease-spring",
            isActive && "-translate-y-px"
          )}
        >
          {isActive && item.activeIcon ? item.activeIcon : item.icon}
        </span>
        <span className="text-[11px] font-semibold tracking-[-0.01em]">
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <nav
      className={cn(
        fixed ? "fixed" : "absolute",
        "left-0 right-0 bottom-0 z-[var(--z-tabbar)] font-body",
        "border-t border-border pb-[var(--safe-bottom)]",
        "bg-[color-mix(in_srgb,var(--surface)_88%,transparent)]",
        "[backdrop-filter:saturate(1.4)_blur(14px)] [-webkit-backdrop-filter:saturate(1.4)_blur(14px)]",
        className
      )}
    >
      <div className="h-[var(--tabbar-h)] flex items-stretch max-w-[var(--app-max)] mx-auto">
        {left.map(renderTab)}
        {centerAction && (
          <div className="flex-none w-[78px] relative">
            <button
              aria-label={centerAction.label}
              onClick={centerAction.onClick}
              className={cn(
                "absolute left-1/2 -top-[22px] -translate-x-1/2 w-[58px] h-[58px] rounded-pill",
                "bg-brand text-brand-on border-4 border-surface shadow-brand cursor-pointer grid place-items-center",
                "transition-[background,transform] duration-[140ms] ease-spring [-webkit-tap-highlight-color:transparent]"
              )}
            >
              {centerAction.icon}
            </button>
            <span className="absolute top-10 left-1/2 -translate-x-1/2 text-[10.5px] font-bold text-brand whitespace-nowrap">
              {centerAction.label}
            </span>
          </div>
        )}
        {right.map(renderTab)}
      </div>
    </nav>
  );
}
