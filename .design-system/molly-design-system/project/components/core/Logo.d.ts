import * as React from 'react';

/**
 * Molly wordmark (Bricolage Grotesque) with a paw-print mark slot. Pass a
 * Lucide <PawPrint /> as `mark`; use `badge` for the app-icon lockup or
 * `markOnly` for a compact mark.
 */
export interface LogoProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The mark node, e.g. a Lucide <PawPrint />. */
  mark?: React.ReactNode;
  /** @default "md" */
  size?: 'sm' | 'md' | 'lg';
  /** Render the mark inside a gold rounded-square badge (app-icon style). */
  badge?: boolean;
  /** Hide the wordmark, show only the mark. */
  markOnly?: boolean;
  /** Wordmark text. @default "Molly" */
  word?: string;
}

export function Logo(props: LogoProps): JSX.Element;
