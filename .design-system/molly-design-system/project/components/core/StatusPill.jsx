import React from 'react';

/* Status pill — color + icon + label, never color alone. */
const CSS = `
.mds-pill{
  font-family:var(--font-body); font-weight:var(--fw-semibold);
  font-size:13px; line-height:1; display:inline-flex; align-items:center; gap:6px;
  padding:6px 11px 6px 9px; border-radius:var(--radius-pill);
  border:1px solid transparent; white-space:nowrap;
}
.mds-pill--sm{ font-size:11.5px; padding:4px 9px 4px 7px; gap:5px; }
.mds-pill__dot{ width:7px; height:7px; border-radius:50%; flex:none; }
.mds-pill__icon{ display:inline-flex; flex:none; }
.mds-pill__icon svg{ width:14px; height:14px; stroke-width:2.5; }

.mds-pill--ok{ background:var(--success-soft); color:var(--success); border-color:var(--green-200); }
.mds-pill--ok .mds-pill__dot{ background:var(--success); }
.mds-pill--reorder{ background:var(--warning-soft); color:var(--warning); border-color:var(--amber-300); }
.mds-pill--reorder .mds-pill__dot{ background:var(--warning-accent); }
.mds-pill--urgent{ background:var(--danger-soft); color:var(--danger); border-color:var(--red-200); }
.mds-pill--urgent .mds-pill__dot{ background:var(--danger); }
.mds-pill--info{ background:var(--info-soft); color:var(--info); border-color:var(--blue-200); }
.mds-pill--info .mds-pill__dot{ background:var(--info); }
.mds-pill--neutral{ background:var(--bg-2); color:var(--fg-2); border-color:var(--border); }
.mds-pill--neutral .mds-pill__dot{ background:var(--fg-muted); }

/* solid emphasis variant (for the strongest urgency) */
.mds-pill--solid.mds-pill--urgent{ background:var(--danger); color:#fff; border-color:transparent; }
.mds-pill--solid.mds-pill--urgent .mds-pill__dot{ background:#fff; }
`;

let injected = false;
function ensureCSS() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-mds', 'statuspill');
  el.textContent = CSS;
  document.head.appendChild(el);
}

export function StatusPill({
  status = 'ok',     // ok | reorder | urgent | info | neutral
  size = 'md',       // md | sm
  solid = false,
  icon = null,       // optional Lucide icon; replaces the dot when present
  children,
  className = '',
  ...rest
}) {
  ensureCSS();
  const classes = [
    'mds-pill',
    `mds-pill--${status}`,
    size === 'sm' ? 'mds-pill--sm' : '',
    solid ? 'mds-pill--solid' : '',
    className,
  ].filter(Boolean).join(' ');
  return (
    <span className={classes} {...rest}>
      {icon
        ? <span className="mds-pill__icon">{icon}</span>
        : <span className="mds-pill__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
