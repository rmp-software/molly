import React from 'react';

/* Inject component CSS once. Keeps :hover/:active/:focus-visible/:disabled
   states real (inline styles can't express them) while still reading
   every value from the design-system tokens. */
const CSS = `
.mds-btn{
  --_pad-y:12px; --_pad-x:18px; --_fs:16px; --_gap:8px; --_h:48px;
  font-family:var(--font-body); font-weight:var(--fw-bold);
  font-size:var(--_fs); line-height:1; letter-spacing:-0.005em;
  display:inline-flex; align-items:center; justify-content:center; gap:var(--_gap);
  min-height:var(--_h); padding:var(--_pad-y) var(--_pad-x);
  border-radius:var(--radius-pill); border:1.5px solid transparent;
  cursor:pointer; user-select:none; white-space:nowrap;
  transition:background var(--dur-fast) var(--ease-standard),
    border-color var(--dur-fast) var(--ease-standard),
    color var(--dur-fast) var(--ease-standard),
    transform var(--dur-fast) var(--ease-standard),
    box-shadow var(--dur-fast) var(--ease-standard);
  -webkit-tap-highlight-color:transparent;
}
.mds-btn:focus-visible{ outline:none; box-shadow:var(--focus-ring-shadow); }
.mds-btn:active{ transform:scale(0.97); }
.mds-btn[disabled]{ cursor:not-allowed; opacity:0.45; transform:none; box-shadow:none; }
.mds-btn--full{ width:100%; }

/* sizes */
.mds-btn--sm{ --_h:38px; --_pad-y:9px; --_pad-x:14px; --_fs:14px; --_gap:6px; }
.mds-btn--lg{ --_h:56px; --_pad-y:16px; --_pad-x:24px; --_fs:18px; --_gap:10px; }
.mds-btn--icon{ padding:0; width:var(--_h); aspect-ratio:1; }

/* primary */
.mds-btn--primary{ background:var(--brand); color:var(--brand-on); box-shadow:var(--shadow-sm); }
.mds-btn--primary:hover:not([disabled]){ background:var(--brand-hover); }
.mds-btn--primary:active:not([disabled]){ background:var(--brand-press); }

/* secondary — tonal, brand-soft */
.mds-btn--secondary{ background:var(--surface); color:var(--brand); border-color:var(--border-strong); }
.mds-btn--secondary:hover:not([disabled]){ background:var(--brand-soft); border-color:var(--brand); }
.mds-btn--secondary:active:not([disabled]){ background:var(--gold-200); }

/* ghost — text only */
.mds-btn--ghost{ background:transparent; color:var(--fg); }
.mds-btn--ghost:hover:not([disabled]){ background:var(--bg-2); }
.mds-btn--ghost:active:not([disabled]){ background:var(--neutral-200); }

/* danger */
.mds-btn--danger{ background:var(--danger); color:#fff; box-shadow:var(--shadow-sm); }
.mds-btn--danger:hover:not([disabled]){ background:var(--red-600); }
.mds-btn--danger:active:not([disabled]){ background:var(--red-700); }

.mds-btn__icon{ display:inline-flex; flex:none; }
.mds-btn__icon svg{ width:1.25em; height:1.25em; stroke-width:2.25; }
.mds-btn__spin{ width:1.15em; height:1.15em; border-radius:50%;
  border:2.5px solid currentColor; border-top-color:transparent;
  animation:mds-btn-spin 0.7s linear infinite; opacity:0.9; }
@keyframes mds-btn-spin{ to{ transform:rotate(360deg); } }
`;

let injected = false;
function ensureCSS() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-mds', 'button');
  el.textContent = CSS;
  document.head.appendChild(el);
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon = null,
  trailingIcon = null,
  iconOnly = false,
  className = '',
  children,
  ...rest
}) {
  ensureCSS();
  const classes = [
    'mds-btn',
    `mds-btn--${variant}`,
    size !== 'md' ? `mds-btn--${size}` : '',
    iconOnly ? 'mds-btn--icon' : '',
    fullWidth ? 'mds-btn--full' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <span className="mds-btn__spin" aria-hidden="true" />}
      {!loading && icon && <span className="mds-btn__icon">{icon}</span>}
      {!iconOnly && children}
      {!loading && trailingIcon && <span className="mds-btn__icon">{trailingIcon}</span>}
    </button>
  );
}
