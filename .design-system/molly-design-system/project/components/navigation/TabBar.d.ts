import * as React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  /** Optional filled/heavier icon shown when active. */
  activeIcon?: React.ReactNode;
}

export interface TabCenterAction {
  label?: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

/**
 * Bottom tab bar — Molly's primary navigation. Thumb-reachable, large targets,
 * translucent blur over content, with an optional raised center FAB for the
 * "Registrar crise" action. Place inside the phone frame; use `fixed` for a
 * real viewport-pinned bar.
 *
 * @startingPoint section="Navigation" subtitle="Bottom tab bar with center action" viewport="390x96"
 */
export interface TabBarProps extends React.HTMLAttributes<HTMLElement> {
  items: TabItem[];
  /** id of the active tab. */
  active?: string;
  onChange?: (id: string) => void;
  /** Optional raised center action button. */
  centerAction?: TabCenterAction | null;
  /** position:fixed instead of absolute. @default false */
  fixed?: boolean;
}

export function TabBar(props: TabBarProps): JSX.Element;
