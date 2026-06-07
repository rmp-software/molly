import React from 'react';

/* MedStatusCard — a single medication row for the stock list. Shows the med,
   dose, "days remaining" in tabular mono, a calm stock track, and a
   color+icon+label status. Status auto-derives from daysRemaining unless set.
   Self-contained (no cross-component imports) so it drops in anywhere. */
const CSS = `
.mds-med{ font-family:var(--font-body); background:var(--surface);
  border:1px solid var(--border); border-radius:var(--radius-lg);
  padding:16px 18px; box-shadow:var(--shadow-sm); display:flex; flex-direction:column; gap:12px; }
.mds-med--urgent{ border-color:var(--red-200); }
.mds-med__top{ display:flex; align-items:center; gap:12px; }
.mds-med__chip{ width:42px; height:42px; border-radius:12px; flex:none; display:grid; place-items:center; }
.mds-med__chip svg{ width:21px; height:21px; stroke-width:2.25; }
.mds-med__chip--ok{ background:var(--success-soft); color:var(--success); }
.mds-med__chip--reorder{ background:var(--warning-soft); color:var(--warning); }
.mds-med__chip--urgent{ background:var(--danger-soft); color:var(--danger); }
.mds-med__name{ font-family:var(--font-display); font-weight:600; font-size:18px; color:var(--fg); margin:0; }
.mds-med__dose{ font-size:13px; color:var(--fg-muted); margin:1px 0 0; }
.mds-med__days{ margin-left:auto; text-align:right; flex:none; }
.mds-med__daysnum{ font-family:var(--font-mono); font-feature-settings:var(--num-feat);
  font-weight:600; font-size:24px; line-height:1; color:var(--fg); }
.mds-med__daysnum--ok{ color:var(--success); }
.mds-med__daysnum--reorder{ color:var(--warning); }
.mds-med__daysnum--urgent{ color:var(--danger); }
.mds-med__dayslbl{ font-size:11px; color:var(--fg-muted); margin-top:2px; }
.mds-med__track{ height:7px; border-radius:999px; background:var(--chart-track); overflow:hidden; }
.mds-med__fill{ height:100%; border-radius:999px; transition:width var(--dur-slow) var(--ease-out); }
.mds-med__fill--ok{ background:var(--success); }
.mds-med__fill--reorder{ background:var(--warning-accent); }
.mds-med__fill--urgent{ background:var(--danger); }
.mds-med__foot{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
.mds-med__pill{ font-weight:var(--fw-semibold); font-size:12.5px; display:inline-flex; align-items:center; gap:6px;
  padding:5px 10px; border-radius:var(--radius-pill); border:1px solid transparent; }
.mds-med__pill svg{ width:14px; height:14px; stroke-width:2.5; }
.mds-med__pill--ok{ background:var(--success-soft); color:var(--success); border-color:var(--green-200); }
.mds-med__pill--reorder{ background:var(--warning-soft); color:var(--warning); border-color:var(--amber-300); }
.mds-med__pill--urgent{ background:var(--danger-soft); color:var(--danger); border-color:var(--red-200); }
.mds-med__reorder{ font-family:var(--font-body); font-weight:var(--fw-bold); font-size:13px;
  color:var(--brand); background:none; border:0; cursor:pointer; padding:6px 4px;
  display:inline-flex; align-items:center; gap:5px; -webkit-tap-highlight-color:transparent; }
.mds-med__reorder svg{ width:15px; height:15px; }
.mds-med__reorder:hover{ color:var(--brand-hover); }
`;

let injected = false;
function ensureCSS() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-mds', 'medcard');
  el.textContent = CSS;
  document.head.appendChild(el);
}

function deriveStatus(days) {
  if (days <= 4) return 'urgent';
  if (days <= 14) return 'reorder';
  return 'ok';
}

const PILL_LABEL = { ok: 'Estoque OK', reorder: 'Reabastecer em breve', urgent: 'Acabando' };

export function MedStatusCard({
  name,
  dose,                 // "97,5 mg · 2× ao dia"
  daysRemaining = 0,
  capacityDays = 30,    // full-stock reference for the track
  status,               // optional override: ok | reorder | urgent
  icon = null,          // status pill icon (Lucide)
  chipIcon = null,      // leading med icon (Lucide); defaults to nothing
  reorderIcon = null,
  pillLabel,
  onReorder = null,
  className = '',
  ...rest
}) {
  ensureCSS();
  const st = status || deriveStatus(daysRemaining);
  const pct = Math.max(4, Math.min(100, (daysRemaining / capacityDays) * 100));
  const label = pillLabel || PILL_LABEL[st];

  return (
    <div className={`mds-med mds-med--${st} ${className}`} {...rest}>
      <div className="mds-med__top">
        {chipIcon && <span className={`mds-med__chip mds-med__chip--${st}`}>{chipIcon}</span>}
        <div>
          <p className="mds-med__name">{name}</p>
          {dose && <p className="mds-med__dose">{dose}</p>}
        </div>
        <div className="mds-med__days">
          <div className={`mds-med__daysnum mds-med__daysnum--${st}`}>{daysRemaining}</div>
          <div className="mds-med__dayslbl">{daysRemaining === 1 ? 'dia restante' : 'dias restantes'}</div>
        </div>
      </div>
      <div className="mds-med__track">
        <div className={`mds-med__fill mds-med__fill--${st}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mds-med__foot">
        <span className={`mds-med__pill mds-med__pill--${st}`}>{icon}{label}</span>
        {onReorder && (
          <button className="mds-med__reorder" onClick={onReorder}>{reorderIcon}Pedir mais</button>
        )}
      </div>
    </div>
  );
}
