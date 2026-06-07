import React from 'react';

/* Logo — Molly wordmark with a paw-print mark slot. Pass a Lucide
   <PawPrint /> as `mark` (kept as a slot so the DS stays icon-library
   agnostic). */
const CSS = `
.mds-logo{ display:inline-flex; align-items:center; gap:9px; font-family:var(--font-display);
  font-weight:var(--fw-bold); letter-spacing:-0.02em; color:var(--fg); line-height:1; }
.mds-logo__mark{ display:grid; place-items:center; color:var(--brand); }
.mds-logo__mark svg{ width:1.05em; height:1.05em; stroke-width:2.25; }
.mds-logo--badge .mds-logo__mark{ background:var(--brand); color:var(--brand-on);
  border-radius:28%; padding:0.26em; }
.mds-logo--badge .mds-logo__mark svg{ stroke-width:2.5; }
.mds-logo--sm{ font-size:18px; }
.mds-logo--md{ font-size:24px; }
.mds-logo--lg{ font-size:32px; }
.mds-logo--markOnly .mds-logo__word{ display:none; }
`;

let injected = false;
function ensureCSS() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-mds', 'logo');
  el.textContent = CSS;
  document.head.appendChild(el);
}

export function Logo({
  mark = null,           // Lucide <PawPrint />
  size = 'md',           // sm | md | lg
  badge = false,         // mark inside a gold rounded square
  markOnly = false,
  word = 'Molly',
  className = '',
  ...rest
}) {
  ensureCSS();
  const classes = [
    'mds-logo', `mds-logo--${size}`,
    badge ? 'mds-logo--badge' : '',
    markOnly ? 'mds-logo--markOnly' : '',
    className,
  ].filter(Boolean).join(' ');
  return (
    <span className={classes} {...rest}>
      {mark && <span className="mds-logo__mark">{mark}</span>}
      <span className="mds-logo__word">{word}</span>
    </span>
  );
}
