import * as React from 'react';

/**
 * Primary action button for Molly. Warm gold fill for the main action,
 * tonal secondary, quiet ghost, and a danger variant. Pill-shaped, large
 * tap targets, gentle press-scale. Pass Lucide icons via `icon`/`trailingIcon`.
 *
 * @startingPoint section="Core" subtitle="Primary / secondary / ghost / danger button" viewport="320x120"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. @default "primary" */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Size / tap target. @default "md" (48px) — lg is 56px for the hero action */
  size?: 'sm' | 'md' | 'lg';
  /** Stretch to fill the container width. */
  fullWidth?: boolean;
  /** Show a spinner and disable interaction. */
  loading?: boolean;
  /** Leading icon (e.g. a Lucide <PawPrint />). */
  icon?: React.ReactNode;
  /** Trailing icon. */
  trailingIcon?: React.ReactNode;
  /** Square icon-only button (still uses the size's height). */
  iconOnly?: boolean;
  children?: React.ReactNode;
}

export function Button(props: ButtonProps): JSX.Element;
