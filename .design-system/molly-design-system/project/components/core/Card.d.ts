import * as React from 'react';

/**
 * The core surface. Default (subtle shadow), flat, raised, and a
 * highlighted/active variant (brand-soft fill). Compose freely; pair with
 * `CardChip` for a tinted leading icon instead of a bare colored border.
 *
 * @startingPoint section="Core" subtitle="Surface card (default / raised / highlighted)" viewport="360x160"
 */
export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  /** @default "default" */
  variant?: 'default' | 'flat' | 'raised' | 'highlighted';
  /** Inner padding. @default "md" */
  padding?: 'sm' | 'md' | 'lg';
  /** Adds hover lift, press-scale, focus ring, and pointer cursor. */
  interactive?: boolean;
  /** Element/tag to render. @default "div" */
  as?: keyof JSX.IntrinsicElements;
  children?: React.ReactNode;
}

export function Card(props: CardProps): JSX.Element;

export interface CardChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Tint of the icon chip. @default "brand" */
  tone?: 'brand' | 'ok' | 'reorder' | 'urgent' | 'info';
  /** Lucide icon node. */
  icon?: React.ReactNode;
}

export function CardChip(props: CardChipProps): JSX.Element;
