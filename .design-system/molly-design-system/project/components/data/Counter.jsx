import React from 'react';

/* Counter — the home hero. "Time since the last seizure", a calm, reassuring
   focal point. Big tabular mono numerals, units in soft text. */
const CSS = `
.mds-counter{ font-family:var(--font-body); text-align:center; }
.mds-counter__eyebrow{ font-size:13px; font-weight:var(--fw-semibold); color:var(--fg-2);
  letter-spacing:.01em; margin:0 0 6px; display:inline-flex; align-items:center; gap:6px; }
.mds-counter__eyebrow svg{ width:16px; height:16px; color:var(--brand); }
.mds-counter__value{ font-family:var(--font-mono); font-feature-settings:var(--num-feat);
  font-weight:600; color:var(--fg); line-height:1; letter-spacing:-0.03em;
  display:flex; align-items:baseline; justify-content:center; gap:4px; flex-wrap:wrap; }
.mds-counter__num{ font-size:var(--_size, 56px); }
.mds-counter__unit{ font-family:var(--font-body); font-size:0.34em; font-weight:500;
  color:var(--fg-muted); letter-spacing:0; margin-right:8px; }
.mds-counter--sm .mds-counter__num{ font-size:34px; }
.mds-counter__sub{ font-size:13px; color:var(--fg-muted); margin:8px 0 0; }
`;

let injected = false;
function ensureCSS() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-mds', 'counter');
  el.textContent = CSS;
  document.head.appendChild(el);
}

function diffParts(since, now) {
  let ms = Math.max(0, now - since);
  const day = 86400000, hour = 3600000, min = 60000;
  const days = Math.floor(ms / day); ms -= days * day;
  const hours = Math.floor(ms / hour); ms -= hours * hour;
  const mins = Math.floor(ms / min);
  return { days, hours, mins };
}

export function Counter({
  since,                       // Date | ISO string — last seizure timestamp
  eyebrow = 'Desde a última crise',
  icon = null,
  sub = null,                  // reassuring caption, e.g. "Continue assim 💛" (pass without emoji per brand)
  size = 'md',                 // md | sm
  live = true,                 // tick every minute
  className = '',
  ...rest
}) {
  ensureCSS();
  const start = React.useMemo(() => (since instanceof Date ? since : new Date(since)), [since]);
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, [live]);

  const { days, hours, mins } = diffParts(start.getTime(), now);
  const pad = (x) => String(x).padStart(2, '0');

  return (
    <div className={`mds-counter mds-counter--${size} ${className}`} {...rest}>
      {eyebrow && <p className="mds-counter__eyebrow">{icon}{eyebrow}</p>}
      <div className="mds-counter__value">
        {days > 0 && (<span><span className="mds-counter__num">{days}</span><span className="mds-counter__unit">{days === 1 ? 'dia' : 'dias'}</span></span>)}
        <span><span className="mds-counter__num">{pad(hours)}</span><span className="mds-counter__unit">h</span></span>
        <span><span className="mds-counter__num">{pad(mins)}</span><span className="mds-counter__unit">min</span></span>
      </div>
      {sub && <p className="mds-counter__sub">{sub}</p>}
    </div>
  );
}
