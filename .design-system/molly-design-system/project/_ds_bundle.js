/* @ds-bundle: {"format":3,"namespace":"MollyDesignSystem_790ab3","components":[{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"CardChip","sourcePath":"components/core/Card.jsx"},{"name":"Logo","sourcePath":"components/core/Logo.jsx"},{"name":"StatusPill","sourcePath":"components/core/StatusPill.jsx"},{"name":"BarChart","sourcePath":"components/data/BarChart.jsx"},{"name":"Counter","sourcePath":"components/data/Counter.jsx"},{"name":"TabBar","sourcePath":"components/navigation/TabBar.jsx"},{"name":"MedStatusCard","sourcePath":"components/patterns/MedStatusCard.jsx"}],"sourceHashes":{"components/core/Button.jsx":"698750e3a277","components/core/Card.jsx":"59b7bec422fa","components/core/Logo.jsx":"4c89f1412075","components/core/StatusPill.jsx":"a195e67d3596","components/data/BarChart.jsx":"8c5464cd6a8d","components/data/Counter.jsx":"dd18e4db8184","components/navigation/TabBar.jsx":"5041df42f148","components/patterns/MedStatusCard.jsx":"9a70063500fa","ui_kits/molly_app/Home.jsx":"7affb3274ab2","ui_kits/molly_app/LogSeizure.jsx":"8cab15f4e0b7","ui_kits/molly_app/Meds.jsx":"d55692262518","ui_kits/molly_app/Trends.jsx":"75d5d32dc36f","ui_kits/molly_app/icons.jsx":"c18fd4add46e","ui_kits/molly_app/ios-frame.jsx":"be3343be4b51"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.MollyDesignSystem_790ab3 = window.MollyDesignSystem_790ab3 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Button({
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
  const classes = ['mds-btn', `mds-btn--${variant}`, size !== 'md' ? `mds-btn--${size}` : '', iconOnly ? 'mds-btn--icon' : '', fullWidth ? 'mds-btn--full' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("button", _extends({
    className: classes,
    disabled: disabled || loading,
    "aria-busy": loading || undefined
  }, rest), loading && /*#__PURE__*/React.createElement("span", {
    className: "mds-btn__spin",
    "aria-hidden": "true"
  }), !loading && icon && /*#__PURE__*/React.createElement("span", {
    className: "mds-btn__icon"
  }, icon), !iconOnly && children, !loading && trailingIcon && /*#__PURE__*/React.createElement("span", {
    className: "mds-btn__icon"
  }, trailingIcon));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Card({
  variant = 'default',
  // default | flat | raised | highlighted
  padding = 'md',
  // sm | md | lg
  interactive = false,
  as = 'div',
  className = '',
  children,
  ...rest
}) {
  ensureCSS();
  const Tag = as;
  const classes = ['mds-card', variant !== 'default' ? `mds-card--${variant}` : '', padding !== 'md' ? `mds-card--pad-${padding}` : '', interactive ? 'mds-card--interactive' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: classes,
    tabIndex: interactive ? 0 : undefined
  }, rest), children);
}

/* Tinted leading icon chip for status/section cards. */
function CardChip({
  tone = 'brand',
  icon = null,
  className = '',
  ...rest
}) {
  ensureCSS();
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `mds-card__chip mds-card__chip--${tone} ${className}`
  }, rest), icon);
}
Object.assign(__ds_scope, { Card, CardChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Logo.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Logo({
  mark = null,
  // Lucide <PawPrint />
  size = 'md',
  // sm | md | lg
  badge = false,
  // mark inside a gold rounded square
  markOnly = false,
  word = 'Molly',
  className = '',
  ...rest
}) {
  ensureCSS();
  const classes = ['mds-logo', `mds-logo--${size}`, badge ? 'mds-logo--badge' : '', markOnly ? 'mds-logo--markOnly' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("span", _extends({
    className: classes
  }, rest), mark && /*#__PURE__*/React.createElement("span", {
    className: "mds-logo__mark"
  }, mark), /*#__PURE__*/React.createElement("span", {
    className: "mds-logo__word"
  }, word));
}
Object.assign(__ds_scope, { Logo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Logo.jsx", error: String((e && e.message) || e) }); }

// components/core/StatusPill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function StatusPill({
  status = 'ok',
  // ok | reorder | urgent | info | neutral
  size = 'md',
  // md | sm
  solid = false,
  icon = null,
  // optional Lucide icon; replaces the dot when present
  children,
  className = '',
  ...rest
}) {
  ensureCSS();
  const classes = ['mds-pill', `mds-pill--${status}`, size === 'sm' ? 'mds-pill--sm' : '', solid ? 'mds-pill--solid' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("span", _extends({
    className: classes
  }, rest), icon ? /*#__PURE__*/React.createElement("span", {
    className: "mds-pill__icon"
  }, icon) : /*#__PURE__*/React.createElement("span", {
    className: "mds-pill__dot",
    "aria-hidden": "true"
  }), children);
}
Object.assign(__ds_scope, { StatusPill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StatusPill.jsx", error: String((e && e.message) || e) }); }

// components/data/BarChart.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function BarChart({
  data = [],
  // [{ label, value, highlight? }]
  height = 160,
  showValues = true,
  gridLines = 2,
  // number of horizontal guide lines
  annotations = [],
  // [{ index, label }] dashed marker before a bar
  ariaLabel = 'Frequência de crises ao longo do tempo',
  className = '',
  ...rest
}) {
  ensureCSS();
  const W = 320,
    H = height;
  const padT = 16,
    padB = 26,
    padL = 4,
    padR = 4;
  const plotH = H - padT - padB;
  const plotW = W - padL - padR;
  const n = Math.max(data.length, 1);
  const max = Math.max(1, ...data.map(d => d.value));
  const slot = plotW / n;
  const barW = Math.min(slot * 0.56, 34);
  const y = v => padT + plotH - v / max * plotH;
  const cx = i => padL + slot * i + slot / 2;
  const grid = [];
  for (let g = 1; g <= gridLines; g++) {
    const gv = Math.round(max / gridLines * g);
    const gy = y(gv);
    grid.push({
      gy,
      gv
    });
  }
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `mds-chart ${className}`
  }, rest), /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${W} ${H}`,
    role: "img",
    "aria-label": ariaLabel
  }, grid.map((g, i) => /*#__PURE__*/React.createElement("g", {
    key: i
  }, /*#__PURE__*/React.createElement("line", {
    className: "mds-chart__grid",
    x1: padL,
    x2: W - padR,
    y1: g.gy,
    y2: g.gy
  }), /*#__PURE__*/React.createElement("text", {
    className: "mds-chart__gridlabel",
    x: W - padR,
    y: g.gy - 3,
    textAnchor: "end"
  }, g.gv))), annotations.map((a, i) => {
    const ax = padL + slot * a.index;
    return /*#__PURE__*/React.createElement("g", {
      key: `ann-${i}`
    }, /*#__PURE__*/React.createElement("line", {
      className: "mds-chart__ann-line",
      x1: ax,
      x2: ax,
      y1: padT - 8,
      y2: padT + plotH
    }), /*#__PURE__*/React.createElement("text", {
      className: "mds-chart__ann-label",
      x: ax + 4,
      y: padT - 2
    }, a.label));
  }), data.map((d, i) => {
    const bx = cx(i) - barW / 2;
    const by = y(d.value);
    const bh = padT + plotH - by;
    return /*#__PURE__*/React.createElement("g", {
      key: i
    }, /*#__PURE__*/React.createElement("rect", {
      className: "mds-chart__bar",
      x: bx,
      y: by,
      width: barW,
      height: Math.max(bh, d.value > 0 ? 3 : 0),
      rx: "5",
      fill: d.highlight ? 'var(--chart-bar-strong)' : 'var(--chart-bar)'
    }), showValues && d.value > 0 && /*#__PURE__*/React.createElement("text", {
      className: "mds-chart__val",
      x: cx(i),
      y: by - 6,
      textAnchor: "middle"
    }, d.value), /*#__PURE__*/React.createElement("text", {
      className: "mds-chart__xlabel",
      x: cx(i),
      y: H - 8,
      textAnchor: "middle"
    }, d.label));
  })));
}
Object.assign(__ds_scope, { BarChart });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/BarChart.jsx", error: String((e && e.message) || e) }); }

// components/data/Counter.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
  const day = 86400000,
    hour = 3600000,
    min = 60000;
  const days = Math.floor(ms / day);
  ms -= days * day;
  const hours = Math.floor(ms / hour);
  ms -= hours * hour;
  const mins = Math.floor(ms / min);
  return {
    days,
    hours,
    mins
  };
}
function Counter({
  since,
  // Date | ISO string — last seizure timestamp
  eyebrow = 'Desde a última crise',
  icon = null,
  sub = null,
  // reassuring caption, e.g. "Continue assim 💛" (pass without emoji per brand)
  size = 'md',
  // md | sm
  live = true,
  // tick every minute
  className = '',
  ...rest
}) {
  ensureCSS();
  const start = React.useMemo(() => since instanceof Date ? since : new Date(since), [since]);
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, [live]);
  const {
    days,
    hours,
    mins
  } = diffParts(start.getTime(), now);
  const pad = x => String(x).padStart(2, '0');
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `mds-counter mds-counter--${size} ${className}`
  }, rest), eyebrow && /*#__PURE__*/React.createElement("p", {
    className: "mds-counter__eyebrow"
  }, icon, eyebrow), /*#__PURE__*/React.createElement("div", {
    className: "mds-counter__value"
  }, days > 0 && /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    className: "mds-counter__num"
  }, days), /*#__PURE__*/React.createElement("span", {
    className: "mds-counter__unit"
  }, days === 1 ? 'dia' : 'dias')), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    className: "mds-counter__num"
  }, pad(hours)), /*#__PURE__*/React.createElement("span", {
    className: "mds-counter__unit"
  }, "h")), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    className: "mds-counter__num"
  }, pad(mins)), /*#__PURE__*/React.createElement("span", {
    className: "mds-counter__unit"
  }, "min"))), sub && /*#__PURE__*/React.createElement("p", {
    className: "mds-counter__sub"
  }, sub));
}
Object.assign(__ds_scope, { Counter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Counter.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TabBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function TabBar({
  items = [],
  // [{ id, label, icon, activeIcon? }]
  active,
  onChange = () => {},
  centerAction = null,
  // { label, icon, onClick }
  fixed = false,
  className = '',
  ...rest
}) {
  ensureCSS();
  const mid = Math.ceil(items.length / 2);
  const left = centerAction ? items.slice(0, mid) : items;
  const right = centerAction ? items.slice(mid) : [];
  const renderTab = it => {
    const on = it.id === active;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      className: `mds-tab ${on ? 'mds-tab--active' : ''}`,
      "aria-current": on ? 'page' : undefined,
      onClick: () => onChange(it.id)
    }, /*#__PURE__*/React.createElement("span", {
      className: "mds-tab__icon"
    }, on && it.activeIcon ? it.activeIcon : it.icon), /*#__PURE__*/React.createElement("span", {
      className: "mds-tab__label"
    }, it.label));
  };
  return /*#__PURE__*/React.createElement("nav", _extends({
    className: `mds-tabbar ${fixed ? 'mds-tabbar--fixed' : ''} ${className}`
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "mds-tabbar__row"
  }, left.map(renderTab), centerAction && /*#__PURE__*/React.createElement("div", {
    className: "mds-tab__center"
  }, /*#__PURE__*/React.createElement("button", {
    className: "mds-fab",
    "aria-label": centerAction.label,
    onClick: centerAction.onClick
  }, centerAction.icon), centerAction.label && /*#__PURE__*/React.createElement("span", {
    className: "mds-fab__label"
  }, centerAction.label)), right.map(renderTab)));
}
Object.assign(__ds_scope, { TabBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TabBar.jsx", error: String((e && e.message) || e) }); }

// components/patterns/MedStatusCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
const PILL_LABEL = {
  ok: 'Estoque OK',
  reorder: 'Reabastecer em breve',
  urgent: 'Acabando'
};
function MedStatusCard({
  name,
  dose,
  // "97,5 mg · 2× ao dia"
  daysRemaining = 0,
  capacityDays = 30,
  // full-stock reference for the track
  status,
  // optional override: ok | reorder | urgent
  icon = null,
  // status pill icon (Lucide)
  chipIcon = null,
  // leading med icon (Lucide); defaults to nothing
  reorderIcon = null,
  pillLabel,
  onReorder = null,
  className = '',
  ...rest
}) {
  ensureCSS();
  const st = status || deriveStatus(daysRemaining);
  const pct = Math.max(4, Math.min(100, daysRemaining / capacityDays * 100));
  const label = pillLabel || PILL_LABEL[st];
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `mds-med mds-med--${st} ${className}`
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "mds-med__top"
  }, chipIcon && /*#__PURE__*/React.createElement("span", {
    className: `mds-med__chip mds-med__chip--${st}`
  }, chipIcon), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "mds-med__name"
  }, name), dose && /*#__PURE__*/React.createElement("p", {
    className: "mds-med__dose"
  }, dose)), /*#__PURE__*/React.createElement("div", {
    className: "mds-med__days"
  }, /*#__PURE__*/React.createElement("div", {
    className: `mds-med__daysnum mds-med__daysnum--${st}`
  }, daysRemaining), /*#__PURE__*/React.createElement("div", {
    className: "mds-med__dayslbl"
  }, daysRemaining === 1 ? 'dia restante' : 'dias restantes'))), /*#__PURE__*/React.createElement("div", {
    className: "mds-med__track"
  }, /*#__PURE__*/React.createElement("div", {
    className: `mds-med__fill mds-med__fill--${st}`,
    style: {
      width: `${pct}%`
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "mds-med__foot"
  }, /*#__PURE__*/React.createElement("span", {
    className: `mds-med__pill mds-med__pill--${st}`
  }, icon, label), onReorder && /*#__PURE__*/React.createElement("button", {
    className: "mds-med__reorder",
    onClick: onReorder
  }, reorderIcon, "Pedir mais")));
}
Object.assign(__ds_scope, { MedStatusCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/patterns/MedStatusCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/molly_app/Home.jsx
try { (() => {
/* Home dashboard — the calm landing screen.
   Big "time since last seizure" counter, the hero "Registrar crise" action,
   a compact frequency chart, and the next-dose reminder. */
function MollyHome({
  onLog,
  lastSeizure
}) {
  const {
    Counter,
    Button,
    Card,
    BarChart
  } = window.MollyDesignSystem_790ab3;
  const I = window.I;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      padding: '4px 18px 8px'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    variant: "raised",
    padding: "lg",
    style: {
      textAlign: 'center',
      paddingTop: 26,
      paddingBottom: 26
    }
  }, /*#__PURE__*/React.createElement(Counter, {
    since: lastSeizure,
    icon: I('heart-pulse', {
      size: 16
    }),
    sub: "Voc\xEA est\xE1 cuidando bem dela."
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    fullWidth: true,
    icon: I('paw-print', {
      size: 22
    }),
    onClick: onLog
  }, "Registrar crise"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '-6px 0 2px',
      textAlign: 'center',
      fontSize: 13,
      color: 'var(--fg-muted)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6
    }
  }, I('shield-check', {
    size: 14,
    color: 'var(--fg-muted)'
  }), "Leva poucos segundos, com uma m\xE3o s\xF3."), /*#__PURE__*/React.createElement(Card, {
    variant: "highlighted",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 42,
      height: 42,
      borderRadius: 12,
      flex: 'none',
      display: 'grid',
      placeItems: 'center',
      background: 'var(--surface)',
      color: 'var(--brand)'
    }
  }, I('pill', {
    size: 21
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: 'var(--brand-press)'
    }
  }, "Pr\xF3xima dose"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '700 19px/1.1 var(--font-display)',
      color: 'var(--fg)',
      marginTop: 2
    }
  }, "Fenobarbital \xB7 hoje, 20h")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      fontSize: 13,
      color: 'var(--brand-press)',
      background: 'var(--surface)',
      padding: '5px 9px',
      borderRadius: 999
    }
  }, "em 3h")), /*#__PURE__*/React.createElement(Card, {
    padding: "lg"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      font: '600 17px var(--font-display)',
      color: 'var(--fg)'
    }
  }, "Crises por m\xEAs"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: 'var(--success)',
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4
    }
  }, I('trending-down', {
    size: 15,
    color: 'var(--success)'
  }), " menos que antes")), /*#__PURE__*/React.createElement(BarChart, {
    height: 150,
    data: [{
      label: 'Jan',
      value: 4
    }, {
      label: 'Fev',
      value: 3
    }, {
      label: 'Mar',
      value: 5
    }, {
      label: 'Abr',
      value: 2
    }, {
      label: 'Mai',
      value: 2
    }, {
      label: 'Jun',
      value: 1,
      highlight: true
    }],
    annotations: [{
      index: 3,
      label: 'Dose ajustada'
    }]
  })));
}
window.MollyHome = MollyHome;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/molly_app/Home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/molly_app/LogSeizure.jsx
try { (() => {
/* LogSeizure — the "Registrar crise" bottom sheet. Fast, one-handed,
   reassuring. Uses the injected-CSS-class pattern (like the DS components)
   so open/close state is driven by a single class on the overlay. */
const MLS_CSS = `
.mls-overlay{ position:fixed; inset:0; z-index:300; display:flex; flex-direction:column;
  justify-content:flex-end; pointer-events:none; }
.mls-scrim{ position:absolute; inset:0; background:rgba(33,29,23,0.42); opacity:0; }
.mls-sheet{ position:relative; z-index:1; background:var(--surface);
  border-radius:24px 24px 0 0; padding:10px 20px calc(28px + var(--safe-bottom));
  box-shadow:var(--shadow-lg); max-height:92%; overflow-y:auto;
  transform:translateY(106%); font-family:var(--font-body); }
.mls-overlay.is-open{ pointer-events:auto; }
.mls-overlay.is-open .mls-scrim{ opacity:1; }
.mls-overlay.is-open .mls-sheet{ transform:translateY(0); }
@keyframes mls-fade{ from{ opacity:0; } to{ opacity:1; } }
@keyframes mls-slide{ from{ transform:translateY(106%); } to{ transform:translateY(0); } }
.mls-grip{ width:40px; height:5px; border-radius:999px; background:var(--border-strong); margin:4px auto 14px; }
.mls-title{ margin:0 0 4px; font:700 24px var(--font-display); color:var(--fg); }
.mls-lead{ margin:0 0 18px; font-size:14px; color:var(--fg-muted); line-height:1.45; }
.mls-label{ font-size:13px; font-weight:600; color:var(--fg-2); }
.mls-timerow{ display:flex; align-items:center; gap:10px; padding:12px 14px; margin-bottom:16px;
  background:var(--bg-2); border-radius:var(--radius-md); }
.mls-time{ margin-left:auto; font-family:var(--font-mono); font-weight:600; color:var(--fg); }
.mls-step{ width:44px; height:44px; border-radius:999px; border:1.5px solid var(--border-strong);
  background:var(--surface); color:var(--fg); cursor:pointer; display:grid; place-items:center; }
.mls-dur{ flex:1; text-align:center; font:600 30px var(--font-mono); color:var(--fg); font-feature-settings:"tnum" 1; }
.mls-chip{ padding:10px 14px; border-radius:999px; font-size:14px; font-weight:600; cursor:pointer;
  font-family:var(--font-body); min-height:44px; display:inline-flex; align-items:center;
  border:1.5px solid var(--border-strong); background:var(--surface); color:var(--fg-2); }
.mls-chip.is-on{ border-color:var(--brand); background:var(--brand-soft); color:var(--brand-press); }
.mls-notes{ width:100%; box-sizing:border-box; margin:8px 0 22px; padding:12px 14px;
  border-radius:var(--radius-md); border:1.5px solid var(--border-strong); font-family:var(--font-body);
  font-size:16px; color:var(--fg); background:var(--surface); resize:none; }
`;
let mlsInjected = false;
function ensureMlsCSS() {
  if (mlsInjected || typeof document === 'undefined') return;
  mlsInjected = true;
  const el = document.createElement('style');
  el.setAttribute('data-mds', 'logsheet');
  el.textContent = MLS_CSS;
  document.head.appendChild(el);
}
function MollyLogSeizure({
  open,
  onClose,
  onSave
}) {
  ensureMlsCSS();
  const {
    Button
  } = window.MollyDesignSystem_790ab3;
  const I = window.I;
  const [secs, setSecs] = React.useState(95);
  const [type, setType] = React.useState('tonico');
  const [notes, setNotes] = React.useState('');
  const types = [{
    id: 'tonico',
    label: 'Tônico-clônica'
  }, {
    id: 'focal',
    label: 'Focal'
  }, {
    id: 'ausencia',
    label: 'Ausência'
  }, {
    id: 'outra',
    label: 'Outra'
  }];
  const fmt = s => `${Math.floor(s / 60)}min ${String(s % 60).padStart(2, '0')}s`;
  return /*#__PURE__*/React.createElement("div", {
    className: `mls-overlay ${open ? 'is-open' : ''}`,
    "aria-hidden": !open
  }, /*#__PURE__*/React.createElement("div", {
    className: "mls-scrim",
    onClick: onClose
  }), /*#__PURE__*/React.createElement("div", {
    className: "mls-sheet",
    role: "dialog",
    "aria-modal": "true",
    "aria-label": "Registrar crise"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mls-grip"
  }), /*#__PURE__*/React.createElement("h2", {
    className: "mls-title"
  }, "Registrar crise"), /*#__PURE__*/React.createElement("p", {
    className: "mls-lead"
  }, "Respire. Vou guardar tudo pra voc\xEA \u2014 pode ajustar os detalhes depois."), /*#__PURE__*/React.createElement("div", {
    className: "mls-timerow"
  }, I('clock', {
    size: 18,
    color: 'var(--brand)'
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14.5,
      color: 'var(--fg)',
      fontWeight: 500
    }
  }, "Agora"), /*#__PURE__*/React.createElement("span", {
    className: "mls-time"
  }, "07/06 \xB7 16h42")), /*#__PURE__*/React.createElement("label", {
    className: "mls-label"
  }, "Dura\xE7\xE3o"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      margin: '8px 0 18px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "mls-step",
    onClick: () => setSecs(s => Math.max(0, s - 5)),
    "aria-label": "Menos"
  }, I('minus', {
    size: 20
  })), /*#__PURE__*/React.createElement("div", {
    className: "mls-dur"
  }, fmt(secs)), /*#__PURE__*/React.createElement("button", {
    className: "mls-step",
    onClick: () => setSecs(s => s + 5),
    "aria-label": "Mais"
  }, I('plus', {
    size: 20
  }))), /*#__PURE__*/React.createElement("label", {
    className: "mls-label"
  }, "Tipo"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      margin: '8px 0 18px'
    }
  }, types.map(t => /*#__PURE__*/React.createElement("button", {
    key: t.id,
    className: `mls-chip ${type === t.id ? 'is-on' : ''}`,
    onClick: () => setType(t.id)
  }, t.label))), /*#__PURE__*/React.createElement("label", {
    className: "mls-label"
  }, "Observa\xE7\xF5es"), /*#__PURE__*/React.createElement("textarea", {
    className: "mls-notes",
    value: notes,
    onChange: e => setNotes(e.target.value),
    rows: 2,
    placeholder: "Estava dormindo, se recuperou r\xE1pido\u2026"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    onClick: onClose
  }, "Cancelar"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    fullWidth: true,
    icon: I('check', {
      size: 19
    }),
    onClick: onSave
  }, "Salvar registro"))));
}
window.MollyLogSeizure = MollyLogSeizure;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/molly_app/LogSeizure.jsx", error: String((e && e.message) || e) }); }

// ui_kits/molly_app/Meds.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Meds — medication & stock control. Color-coded status cards with
   days-remaining, a calm overview strip, and an add action. */
function MollyMeds({
  onReorder
}) {
  const {
    MedStatusCard,
    Button,
    Card
  } = window.MollyDesignSystem_790ab3;
  const I = window.I;
  const meds = [{
    name: 'Brometo de potássio',
    dose: '500 mg · 2× ao dia',
    daysRemaining: 23,
    capacityDays: 30,
    icon: I('check', {
      size: 14
    })
  }, {
    name: 'Fenobarbital',
    dose: '97,5 mg · 2× ao dia',
    daysRemaining: 6,
    capacityDays: 30,
    icon: I('clock', {
      size: 14
    })
  }, {
    name: 'Levetiracetam',
    dose: '250 mg · 3× ao dia',
    daysRemaining: 2,
    capacityDays: 30,
    icon: I('alert-triangle', {
      size: 14
    })
  }];
  const overview = [{
    n: 1,
    label: 'em dia',
    tone: 'var(--success)',
    soft: 'var(--success-soft)'
  }, {
    n: 1,
    label: 'reabastecer',
    tone: 'var(--warning)',
    soft: 'var(--warning-soft)'
  }, {
    n: 1,
    label: 'acabando',
    tone: 'var(--danger)',
    soft: 'var(--danger-soft)'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      padding: '4px 18px 8px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 10
    }
  }, overview.map((o, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: o.soft,
      borderRadius: 'var(--radius-md)',
      padding: '12px 10px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '600 26px var(--font-mono)',
      color: o.tone,
      lineHeight: 1
    }
  }, o.n), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--fg-2)',
      marginTop: 4,
      fontWeight: 500
    }
  }, o.label)))), meds.map((m, i) => /*#__PURE__*/React.createElement(MedStatusCard, _extends({
    key: i
  }, m, {
    chipIcon: I('pill', {
      size: 21
    }),
    reorderIcon: I('shopping-cart', {
      size: 15
    }),
    onReorder: () => onReorder && onReorder(m.name)
  }))), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    fullWidth: true,
    icon: I('plus', {
      size: 18
    })
  }, "Adicionar rem\xE9dio"));
}
window.MollyMeds = MollyMeds;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/molly_app/Meds.jsx", error: String((e && e.message) || e) }); }

// ui_kits/molly_app/Trends.jsx
try { (() => {
/* Trends — seizure history & patterns. A larger chart with a dose-change
   annotation, headline stats in tabular mono, and a recent-events list. */
function MollyTrends() {
  const {
    Card,
    BarChart,
    StatusPill
  } = window.MollyDesignSystem_790ab3;
  const I = window.I;
  const stats = [{
    v: '2,8',
    label: 'média / mês',
    icon: 'activity'
  }, {
    v: '21',
    unit: 'dias',
    label: 'maior intervalo',
    icon: 'award'
  }, {
    v: '17',
    label: 'total em 2026',
    icon: 'calendar'
  }];
  const recent = [{
    date: '24/05',
    time: '06h12',
    dur: '1min 40s',
    type: 'Tônico-clônica'
  }, {
    date: '02/05',
    time: '22h05',
    dur: '55s',
    type: 'Focal'
  }, {
    date: '19/04',
    time: '14h30',
    dur: '2min 10s',
    type: 'Tônico-clônica'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      padding: '4px 18px 8px'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: "lg"
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 2px',
      font: '600 17px var(--font-display)',
      color: 'var(--fg)'
    }
  }, "Frequ\xEAncia de crises"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 10px',
      fontSize: 13,
      color: 'var(--fg-muted)'
    }
  }, "\xDAltimos 6 meses"), /*#__PURE__*/React.createElement(BarChart, {
    height: 180,
    gridLines: 3,
    data: [{
      label: 'Jan',
      value: 4
    }, {
      label: 'Fev',
      value: 3
    }, {
      label: 'Mar',
      value: 5
    }, {
      label: 'Abr',
      value: 2
    }, {
      label: 'Mai',
      value: 2
    }, {
      label: 'Jun',
      value: 1,
      highlight: true
    }],
    annotations: [{
      index: 3,
      label: 'Dose ajustada'
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 10
    }
  }, stats.map((s, i) => /*#__PURE__*/React.createElement(Card, {
    key: i,
    padding: "sm",
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--brand)',
      display: 'inline-flex'
    }
  }, I(s.icon, {
    size: 18,
    color: 'var(--brand)'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '600 22px var(--font-mono)',
      color: 'var(--fg)',
      marginTop: 6,
      lineHeight: 1
    }
  }, s.v, s.unit && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--fg-muted)',
      fontFamily: 'var(--font-body)',
      marginLeft: 2
    }
  }, s.unit)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--fg-muted)',
      marginTop: 4
    }
  }, s.label)))), /*#__PURE__*/React.createElement(Card, {
    padding: "lg"
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 12px',
      font: '600 17px var(--font-display)',
      color: 'var(--fg)'
    }
  }, "Registros recentes"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, recent.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '11px 0',
      borderTop: i ? '1px solid var(--border)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      flex: 'none',
      textAlign: 'center',
      font: '600 13px var(--font-mono)',
      color: 'var(--fg)'
    }
  }, r.date, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--fg-muted)',
      fontWeight: 400
    }
  }, r.time)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 600,
      color: 'var(--fg)'
    }
  }, r.type), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--fg-muted)',
      fontFamily: 'var(--font-mono)'
    }
  }, r.dur)), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--fg-muted)',
      display: 'inline-flex'
    }
  }, I('chevron-right', {
    size: 18,
    color: 'var(--neutral-400)'
  })))))));
}
window.MollyTrends = MollyTrends;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/molly_app/Trends.jsx", error: String((e && e.message) || e) }); }

// ui_kits/molly_app/icons.jsx
try { (() => {
/* Lucide icon helper for the Molly UI kit.
   Renders a Lucide icon imperatively inside a ref'd span so React never
   fights the <i>→<svg> swap. `I(name, opts)` returns an element usable as
   an `icon` prop on any design-system component. */
function MollyIcon({
  name,
  size = 22,
  stroke = 2,
  color,
  style = {},
  className = ''
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const host = ref.current;
    if (!host || !window.lucide) return;
    host.innerHTML = '';
    const i = document.createElement('i');
    i.setAttribute('data-lucide', name);
    i.setAttribute('width', size);
    i.setAttribute('height', size);
    i.setAttribute('stroke-width', stroke);
    host.appendChild(i);
    window.lucide.createIcons();
  });
  return /*#__PURE__*/React.createElement("span", {
    ref: ref,
    className: className,
    style: {
      display: 'inline-flex',
      color,
      ...style
    },
    "aria-hidden": "true"
  });
}
window.MollyIcon = MollyIcon;
window.I = (name, opts = {}) => React.createElement(MollyIcon, {
  name,
  ...opts
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/molly_app/icons.jsx", error: String((e && e.message) || e) }); }

// ui_kits/molly_app/ios-frame.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// iOS.jsx — Simplified iOS 26 (Liquid Glass) device frame
// Based on the iOS 26 UI Kit + Figma status bar spec. No assets, no deps.
// Exports (to window): IOSDevice, IOSStatusBar, IOSNavBar, IOSGlassPill, IOSList, IOSListRow, IOSKeyboard
//
// Usage — wrap your screen content in <IOSDevice> to get the bezel, status bar
// and home indicator (props: title, dark, keyboard):
//
//   <IOSDevice title="Settings">
//     ...your screen content...
//   </IOSDevice>
//   <IOSDevice dark title="Search" keyboard>…</IOSDevice>
/* END USAGE */

// ─────────────────────────────────────────────────────────────
// Status bar
// ─────────────────────────────────────────────────────────────
function IOSStatusBar({
  dark = false,
  time = '9:41'
}) {
  const c = dark ? '#fff' : '#000';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 154,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '21px 24px 19px',
      boxSizing: 'border-box',
      position: 'relative',
      zIndex: 20,
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 22,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 1.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: '-apple-system, "SF Pro", system-ui',
      fontWeight: 590,
      fontSize: 17,
      lineHeight: '22px',
      color: c
    }
  }, time)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 22,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingTop: 1,
      paddingRight: 1
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "19",
    height: "12",
    viewBox: "0 0 19 12"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0",
    y: "7.5",
    width: "3.2",
    height: "4.5",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "4.8",
    y: "5",
    width: "3.2",
    height: "7",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "9.6",
    y: "2.5",
    width: "3.2",
    height: "9.5",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14.4",
    y: "0",
    width: "3.2",
    height: "12",
    rx: "0.7",
    fill: c
  })), /*#__PURE__*/React.createElement("svg", {
    width: "17",
    height: "12",
    viewBox: "0 0 17 12"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5C5.8 1.5 3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2Z",
    fill: c
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8.5 6.8C9.9 6.8 11.1 7.3 12 8.2L13.1 7.1C11.8 5.9 10.2 5.1 8.5 5.1C6.8 5.1 5.2 5.9 3.9 7.1L5 8.2C5.9 7.3 7.1 6.8 8.5 6.8Z",
    fill: c
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "8.5",
    cy: "10.5",
    r: "1.5",
    fill: c
  })), /*#__PURE__*/React.createElement("svg", {
    width: "27",
    height: "13",
    viewBox: "0 0 27 13"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0.5",
    y: "0.5",
    width: "23",
    height: "12",
    rx: "3.5",
    stroke: c,
    strokeOpacity: "0.35",
    fill: "none"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "2",
    width: "20",
    height: "9",
    rx: "2",
    fill: c
  }), /*#__PURE__*/React.createElement("path", {
    d: "M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z",
    fill: c,
    fillOpacity: "0.4"
  }))));
}

// ─────────────────────────────────────────────────────────────
// Liquid glass pill — blur + tint + shine
// ─────────────────────────────────────────────────────────────
function IOSGlassPill({
  children,
  dark = false,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 44,
      minWidth: 44,
      borderRadius: 9999,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: dark ? '0 2px 6px rgba(0,0,0,0.35), 0 6px 16px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.07), 0 3px 10px rgba(0,0,0,0.06)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 9999,
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      background: dark ? 'rgba(120,120,128,0.28)' : 'rgba(255,255,255,0.5)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 9999,
      boxShadow: dark ? 'inset 1.5px 1.5px 1px rgba(255,255,255,0.15), inset -1px -1px 1px rgba(255,255,255,0.08)' : 'inset 1.5px 1.5px 1px rgba(255,255,255,0.7), inset -1px -1px 1px rgba(255,255,255,0.4)',
      border: dark ? '0.5px solid rgba(255,255,255,0.15)' : '0.5px solid rgba(0,0,0,0.06)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      alignItems: 'center',
      padding: '0 4px'
    }
  }, children));
}

// ─────────────────────────────────────────────────────────────
// Navigation bar — glass pills + large title
// ─────────────────────────────────────────────────────────────
function IOSNavBar({
  title = 'Title',
  dark = false,
  trailingIcon = true
}) {
  const muted = dark ? 'rgba(255,255,255,0.6)' : '#404040';
  const text = dark ? '#fff' : '#000';
  const pillIcon = content => /*#__PURE__*/React.createElement(IOSGlassPill, {
    dark: dark
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, content));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      paddingTop: 62,
      paddingBottom: 10,
      position: 'relative',
      zIndex: 5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px'
    }
  }, pillIcon(/*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "20",
    viewBox: "0 0 12 20",
    fill: "none",
    style: {
      marginLeft: -1
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M10 2L2 10l8 8",
    stroke: muted,
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), trailingIcon && pillIcon(/*#__PURE__*/React.createElement("svg", {
    width: "22",
    height: "6",
    viewBox: "0 0 22 6"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "3",
    cy: "3",
    r: "2.5",
    fill: muted
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "3",
    r: "2.5",
    fill: muted
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "19",
    cy: "3",
    r: "2.5",
    fill: muted
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 16px',
      fontFamily: '-apple-system, system-ui',
      fontSize: 34,
      fontWeight: 700,
      lineHeight: '41px',
      color: text,
      letterSpacing: 0.4
    }
  }, title));
}

// ─────────────────────────────────────────────────────────────
// Grouped list (inset card, r:26) + row (52px)
// ─────────────────────────────────────────────────────────────
function IOSListRow({
  title,
  detail,
  icon,
  chevron = true,
  isLast = false,
  dark = false
}) {
  const text = dark ? '#fff' : '#000';
  const sec = dark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)';
  const ter = dark ? 'rgba(235,235,245,0.3)' : 'rgba(60,60,67,0.3)';
  const sep = dark ? 'rgba(84,84,88,0.65)' : 'rgba(60,60,67,0.12)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      minHeight: 52,
      padding: '0 16px',
      position: 'relative',
      fontFamily: '-apple-system, system-ui',
      fontSize: 17,
      letterSpacing: -0.43
    }
  }, icon && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 7,
      background: icon,
      marginRight: 12,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      color: text
    }
  }, title), detail && /*#__PURE__*/React.createElement("span", {
    style: {
      color: sec,
      marginRight: 6
    }
  }, detail), chevron && /*#__PURE__*/React.createElement("svg", {
    width: "8",
    height: "14",
    viewBox: "0 0 8 14",
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 1l6 6-6 6",
    stroke: ter,
    strokeWidth: "2",
    fill: "none",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })), !isLast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      left: icon ? 58 : 16,
      height: 0.5,
      background: sep
    }
  }));
}
function IOSList({
  header,
  children,
  dark = false
}) {
  const hc = dark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)';
  const bg = dark ? '#1C1C1E' : '#fff';
  return /*#__PURE__*/React.createElement("div", null, header && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: '-apple-system, system-ui',
      fontSize: 13,
      color: hc,
      textTransform: 'uppercase',
      padding: '8px 36px 6px',
      letterSpacing: -0.08
    }
  }, header), /*#__PURE__*/React.createElement("div", {
    style: {
      background: bg,
      borderRadius: 26,
      margin: '0 16px',
      overflow: 'hidden'
    }
  }, children));
}

// ─────────────────────────────────────────────────────────────
// Device frame
// ─────────────────────────────────────────────────────────────
function IOSDevice({
  children,
  width = 402,
  height = 874,
  dark = false,
  title,
  keyboard = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width,
      height,
      borderRadius: 48,
      overflow: 'hidden',
      position: 'relative',
      background: dark ? '#000' : '#F2F2F7',
      boxShadow: '0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.12)',
      fontFamily: '-apple-system, system-ui, sans-serif',
      WebkitFontSmoothing: 'antialiased'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 11,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 126,
      height: 37,
      borderRadius: 24,
      background: '#000',
      zIndex: 50
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement(IOSStatusBar, {
    dark: dark
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }
  }, title !== undefined && /*#__PURE__*/React.createElement(IOSNavBar, {
    title: title,
    dark: dark
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto'
    }
  }, children), keyboard && /*#__PURE__*/React.createElement(IOSKeyboard, {
    dark: dark
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 60,
      height: 34,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingBottom: 8,
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 139,
      height: 5,
      borderRadius: 100,
      background: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.25)'
    }
  })));
}

// ─────────────────────────────────────────────────────────────
// Keyboard — iOS 26 liquid glass
// ─────────────────────────────────────────────────────────────
function IOSKeyboard({
  dark = false
}) {
  const glyph = dark ? 'rgba(255,255,255,0.7)' : '#595959';
  const sugg = dark ? 'rgba(255,255,255,0.6)' : '#333';
  const keyBg = dark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.85)';

  // special-key icons
  const icons = {
    shift: /*#__PURE__*/React.createElement("svg", {
      width: "19",
      height: "17",
      viewBox: "0 0 19 17"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M9.5 1L1 9.5h4.5V16h8V9.5H18L9.5 1z",
      fill: glyph
    })),
    del: /*#__PURE__*/React.createElement("svg", {
      width: "23",
      height: "17",
      viewBox: "0 0 23 17"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M7 1h13a2 2 0 012 2v11a2 2 0 01-2 2H7l-6-7.5L7 1z",
      fill: "none",
      stroke: glyph,
      strokeWidth: "1.6",
      strokeLinejoin: "round"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M10 5l7 7M17 5l-7 7",
      stroke: glyph,
      strokeWidth: "1.6",
      strokeLinecap: "round"
    })),
    ret: /*#__PURE__*/React.createElement("svg", {
      width: "20",
      height: "14",
      viewBox: "0 0 20 14"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M18 1v6H4m0 0l4-4M4 7l4 4",
      fill: "none",
      stroke: "#fff",
      strokeWidth: "1.8",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }))
  };
  const key = (content, {
    w,
    flex,
    ret,
    fs = 25,
    k
  } = {}) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      height: 42,
      borderRadius: 8.5,
      flex: flex ? 1 : undefined,
      width: w,
      minWidth: 0,
      background: ret ? '#08f' : keyBg,
      boxShadow: '0 1px 0 rgba(0,0,0,0.075)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, "SF Compact", system-ui',
      fontSize: fs,
      fontWeight: 458,
      color: ret ? '#fff' : glyph
    }
  }, content);
  const row = (keys, pad = 0) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6.5,
      justifyContent: 'center',
      padding: `0 ${pad}px`
    }
  }, keys.map(l => key(l, {
    flex: true,
    k: l
  })));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 15,
      borderRadius: 27,
      overflow: 'hidden',
      padding: '11px 0 2px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxShadow: dark ? '0 -2px 20px rgba(0,0,0,0.09)' : '0 -1px 6px rgba(0,0,0,0.018), 0 -3px 20px rgba(0,0,0,0.012)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 27,
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      background: dark ? 'rgba(120,120,128,0.14)' : 'rgba(255,255,255,0.25)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 27,
      boxShadow: dark ? 'inset 1.5px 1.5px 1px rgba(255,255,255,0.15)' : 'inset 1.5px 1.5px 1px rgba(255,255,255,0.7), inset -1px -1px 1px rgba(255,255,255,0.4)',
      border: dark ? '0.5px solid rgba(255,255,255,0.15)' : '0.5px solid rgba(0,0,0,0.06)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20,
      alignItems: 'center',
      padding: '8px 22px 13px',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative'
    }
  }, ['"The"', 'the', 'to'].map((w, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, i > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 25,
      background: '#ccc',
      opacity: 0.3
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      textAlign: 'center',
      fontFamily: '-apple-system, system-ui',
      fontSize: 17,
      color: sugg,
      letterSpacing: -0.43,
      lineHeight: '22px'
    }
  }, w)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 13,
      padding: '0 6.5px',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative'
    }
  }, row(['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p']), row(['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], 20), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14.25,
      alignItems: 'center'
    }
  }, key(icons.shift, {
    w: 45,
    k: 'shift'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6.5,
      flex: 1
    }
  }, ['z', 'x', 'c', 'v', 'b', 'n', 'm'].map(l => key(l, {
    flex: true,
    k: l
  }))), key(icons.del, {
    w: 45,
    k: 'del'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      alignItems: 'center'
    }
  }, key('ABC', {
    w: 92.25,
    fs: 18,
    k: 'abc'
  }), key('', {
    flex: true,
    k: 'space'
  }), key(icons.ret, {
    w: 92.25,
    ret: true,
    k: 'ret'
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      width: '100%',
      position: 'relative'
    }
  }));
}
Object.assign(window, {
  IOSDevice,
  IOSStatusBar,
  IOSNavBar,
  IOSGlassPill,
  IOSList,
  IOSListRow,
  IOSKeyboard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/molly_app/ios-frame.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CardChip = __ds_scope.CardChip;

__ds_ns.Logo = __ds_scope.Logo;

__ds_ns.StatusPill = __ds_scope.StatusPill;

__ds_ns.BarChart = __ds_scope.BarChart;

__ds_ns.Counter = __ds_scope.Counter;

__ds_ns.TabBar = __ds_scope.TabBar;

__ds_ns.MedStatusCard = __ds_scope.MedStatusCard;

})();
