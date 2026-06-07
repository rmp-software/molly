import React from 'react';

/* Bottom tab bar — thumb-reachable primary navigation, with an optional
   raised center action (the "Registrar crise" FAB). Fixed to the viewport
   bottom with safe-area padding. */
const CSS = `
.mds-tabbar{
  position:absolute; left:0; right:0; bottom:0; z-index:var(--z-tabbar);
  background:color-mix(in srgb, var(--surface) 88%, transparent);
  -webkit-backdrop-filter:saturate(1.4) blur(14px);
  backdrop-filter:saturate(1.4) blur(14px);
  border-top:1px solid var(--border);
  padding-bottom:var(--safe-bottom);
  font-family:var(--font-body);
}
.mds-tabbar--fixed{ position:fixed; }
.mds-tabbar__row{
  height:var(--tabbar-h); display:flex; align-items:stretch;
  max-width:var(--app-max); margin:0 auto;
}
.mds-tab{
  flex:1; background:none; border:0; cursor:pointer; min-width:var(--tap-min);
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px;
  color:var(--fg-muted); padding:6px 4px;
  -webkit-tap-highlight-color:transparent;
  transition:color var(--dur-fast) var(--ease-standard);
}
.mds-tab svg{ width:23px; height:23px; stroke-width:2; transition:transform var(--dur-fast) var(--ease-spring); }
.mds-tab__label{ font-size:11px; font-weight:var(--fw-semibold); letter-spacing:-0.01em; }
.mds-tab:focus-visible{ outline:none; }
.mds-tab:focus-visible .mds-tab__icon{ box-shadow:var(--focus-ring-shadow); border-radius:12px; }
.mds-tab--active{ color:var(--brand); }
.mds-tab--active svg{ stroke-width:2.5; transform:translateY(-1px); }

.mds-tab__center{ flex:none; width:78px; position:relative; }
.mds-fab{
  position:absolute; left:50%; top:-22px; transform:translateX(-50%);
  width:58px; height:58px; border-radius:var(--radius-pill);
  background:var(--brand); color:var(--brand-on); border:4px solid var(--surface);
  box-shadow:var(--shadow-brand); cursor:pointer; display:grid; place-items:center;
  transition:background var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-spring);
  -webkit-tap-highlight-color:transparent;
}
.mds-fab svg{ width:27px; height:27px; stroke-width:2.5; }
.mds-fab:hover{ background:var(--brand-hover); }
.mds-fab:active{ transform:translateX(-50%) scale(0.93); }
.mds-fab:focus-visible{ outline:none; box-shadow:var(--focus-ring-shadow), var(--shadow-brand); }
.mds-fab__label{ position:absolute; top:40px; left:50%; transform:translateX(-50%);
  font-size:10.5px; font-weight:var(--fw-bold); color:var(--brand); white-space:nowrap; }
`;

let injected = false;
function ensureCSS() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-mds', 'tabbar');
  el.textContent = CSS;
  document.head.appendChild(el);
}

export function TabBar({
  items = [],            // [{ id, label, icon, activeIcon? }]
  active,
  onChange = () => {},
  centerAction = null,   // { label, icon, onClick }
  fixed = false,
  className = '',
  ...rest
}) {
  ensureCSS();
  const mid = Math.ceil(items.length / 2);
  const left = centerAction ? items.slice(0, mid) : items;
  const right = centerAction ? items.slice(mid) : [];

  const renderTab = (it) => {
    const on = it.id === active;
    return (
      <button
        key={it.id}
        className={`mds-tab ${on ? 'mds-tab--active' : ''}`}
        aria-current={on ? 'page' : undefined}
        onClick={() => onChange(it.id)}
      >
        <span className="mds-tab__icon">{on && it.activeIcon ? it.activeIcon : it.icon}</span>
        <span className="mds-tab__label">{it.label}</span>
      </button>
    );
  };

  return (
    <nav className={`mds-tabbar ${fixed ? 'mds-tabbar--fixed' : ''} ${className}`} {...rest}>
      <div className="mds-tabbar__row">
        {left.map(renderTab)}
        {centerAction && (
          <div className="mds-tab__center">
            <button className="mds-fab" aria-label={centerAction.label} onClick={centerAction.onClick}>
              {centerAction.icon}
            </button>
            {centerAction.label && <span className="mds-fab__label">{centerAction.label}</span>}
          </div>
        )}
        {right.map(renderTab)}
      </div>
    </nav>
  );
}
