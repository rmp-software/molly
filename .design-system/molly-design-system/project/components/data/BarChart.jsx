import React from 'react';

/* BarChart — seizure frequency over time. Calm gold bars, one highlighted
   "current" bar, optional dashed annotation markers (e.g. a dose change).
   Pure SVG + tokens, no chart library. */
const CSS = `
.mds-chart{ font-family:var(--font-body); width:100%; }
.mds-chart svg{ display:block; width:100%; height:auto; overflow:visible; }
.mds-chart__bar{ transition:height var(--dur-slow) var(--ease-out), y var(--dur-slow) var(--ease-out); }
.mds-chart__xlabel{ font-size:11px; fill:var(--fg-muted); font-family:var(--font-body); }
.mds-chart__val{ font-size:11px; font-weight:600; fill:var(--fg-2);
  font-family:var(--font-mono); font-feature-settings:"tnum" 1; }
.mds-chart__ann-line{ stroke:var(--info); stroke-width:1.5; stroke-dasharray:3 3; opacity:0.7; }
.mds-chart__ann-label{ font-size:10px; fill:var(--info); font-weight:600; }
.mds-chart__grid{ stroke:var(--chart-grid); stroke-width:1; }
.mds-chart__gridlabel{ font-size:10px; fill:var(--fg-muted); font-family:var(--font-mono); }
`;

let injected = false;
function ensureCSS() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-mds', 'barchart');
  el.textContent = CSS;
  document.head.appendChild(el);
}

export function BarChart({
  data = [],            // [{ label, value, highlight? }]
  height = 160,
  showValues = true,
  gridLines = 2,        // number of horizontal guide lines
  annotations = [],     // [{ index, label }] dashed marker before a bar
  ariaLabel = 'Frequência de crises ao longo do tempo',
  className = '',
  ...rest
}) {
  ensureCSS();
  const W = 320, H = height;
  const padT = 16, padB = 26, padL = 4, padR = 4;
  const plotH = H - padT - padB;
  const plotW = W - padL - padR;
  const n = Math.max(data.length, 1);
  const max = Math.max(1, ...data.map(d => d.value));
  const slot = plotW / n;
  const barW = Math.min(slot * 0.56, 34);

  const y = (v) => padT + plotH - (v / max) * plotH;
  const cx = (i) => padL + slot * i + slot / 2;

  const grid = [];
  for (let g = 1; g <= gridLines; g++) {
    const gv = Math.round((max / gridLines) * g);
    const gy = y(gv);
    grid.push({ gy, gv });
  }

  return (
    <div className={`mds-chart ${className}`} {...rest}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
        {grid.map((g, i) => (
          <g key={i}>
            <line className="mds-chart__grid" x1={padL} x2={W - padR} y1={g.gy} y2={g.gy} />
            <text className="mds-chart__gridlabel" x={W - padR} y={g.gy - 3} textAnchor="end">{g.gv}</text>
          </g>
        ))}
        {annotations.map((a, i) => {
          const ax = padL + slot * a.index;
          return (
            <g key={`ann-${i}`}>
              <line className="mds-chart__ann-line" x1={ax} x2={ax} y1={padT - 8} y2={padT + plotH} />
              <text className="mds-chart__ann-label" x={ax + 4} y={padT - 2}>{a.label}</text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const bx = cx(i) - barW / 2;
          const by = y(d.value);
          const bh = padT + plotH - by;
          return (
            <g key={i}>
              <rect
                className="mds-chart__bar"
                x={bx} y={by} width={barW} height={Math.max(bh, d.value > 0 ? 3 : 0)}
                rx="5"
                fill={d.highlight ? 'var(--chart-bar-strong)' : 'var(--chart-bar)'}
              />
              {showValues && d.value > 0 && (
                <text className="mds-chart__val" x={cx(i)} y={by - 6} textAnchor="middle">{d.value}</text>
              )}
              <text className="mds-chart__xlabel" x={cx(i)} y={H - 8} textAnchor="middle">{d.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
