import React from 'react';

/* Card — the core surface. Default, raised, and a highlighted/active
   variant (brand-soft). Optional accent renders a tinted icon chip, NOT a
   bare colored left border. */
const CSS = `
.mds-card{
  --_pad:20px;
  background:var(--surface); border:1px solid var(--border);
  border-radius:var(--radius-lg); padding:var(--_pad);
  box-shadow:var(--shadow-sm); color:var(--fg);
  font-family:var(--font-body);
  transition:box-shadow var(--dur-base) var(--ease-standard),
    transform var(--dur-fast) var(--ease-standard),
    border-color var(--dur-base) var(--ease-standard);
}
.mds-card--flat{ box-shadow:none; }
.mds-card--raised{ box-shadow:var(--shadow-md); border-color:transparent; }
.mds-card--highlighted{ background:var(--brand-soft); border-color:var(--gold-300); box-shadow:none; }
.mds-card--pad-sm{ --_pad:14px; }
.mds-card--pad-lg{ --_pad:24px; }
.mds-card--interactive{ cursor:pointer; -webkit-tap-highlight-color:transparent; }
.mds-card--interactive:hover{ box-shadow:var(--shadow-md); }
.mds-card--interactive:active{ transform:scale(0.99); }
.mds-card--interactive:focus-visible{ outline:none; box-shadow:var(--focus-ring-shadow); }

.mds-card__head{ display:flex; align-items:center; gap:12px; }
.mds-card__chip{ width:40px; height:40px; border-radius:12px; flex:none;
  display:grid; place-items:center; }
.mds-card__chip svg{ width:20px; height:20px; stroke-width:2.25; }
.mds-card__chip--brand{ background:var(--brand-soft); color:var(--brand); }
.mds-card__chip--ok{ background:var(--success-soft); color:var(--success); }
.mds-card__chip--reorder{ background:var(--warning-soft); color:var(--warning); }
.mds-card__chip--urgent{ background:var(--danger-soft); color:var(--danger); }
.mds-card__chip--info{ background:var(--info-soft); color:var(--info); }
`;

let injected = false;
function ensureCSS() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-mds', 'card');
  el.textContent = CSS;
  document.head.appendChild(el);
}

export function Card({
  variant = 'default',  // default | flat | raised | highlighted
  padding = 'md',       // sm | md | lg
  interactive = false,
  as = 'div',
  className = '',
  children,
  ...rest
}) {
  ensureCSS();
  const Tag = as;
  const classes = [
    'mds-card',
    variant !== 'default' ? `mds-card--${variant}` : '',
    padding !== 'md' ? `mds-card--pad-${padding}` : '',
    interactive ? 'mds-card--interactive' : '',
    className,
  ].filter(Boolean).join(' ');
  return (
    <Tag className={classes} tabIndex={interactive ? 0 : undefined} {...rest}>
      {children}
    </Tag>
  );
}

/* Tinted leading icon chip for status/section cards. */
export function CardChip({ tone = 'brand', icon = null, className = '', ...rest }) {
  ensureCSS();
  return (
    <span className={`mds-card__chip mds-card__chip--${tone} ${className}`} {...rest}>
      {icon}
    </span>
  );
}
