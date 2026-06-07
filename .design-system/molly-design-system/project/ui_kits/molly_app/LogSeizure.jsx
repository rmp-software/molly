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

function MollyLogSeizure({ open, onClose, onSave }) {
  ensureMlsCSS();
  const { Button } = window.MollyDesignSystem_790ab3;
  const I = window.I;
  const [secs, setSecs] = React.useState(95);
  const [type, setType] = React.useState('tonico');
  const [notes, setNotes] = React.useState('');

  const types = [
    { id: 'tonico', label: 'Tônico-clônica' },
    { id: 'focal', label: 'Focal' },
    { id: 'ausencia', label: 'Ausência' },
    { id: 'outra', label: 'Outra' },
  ];
  const fmt = (s) => `${Math.floor(s / 60)}min ${String(s % 60).padStart(2, '0')}s`;

  return (
    <div className={`mls-overlay ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <div className="mls-scrim" onClick={onClose} />
      <div className="mls-sheet" role="dialog" aria-modal="true" aria-label="Registrar crise">
        <div className="mls-grip" />
        <h2 className="mls-title">Registrar crise</h2>
        <p className="mls-lead">Respire. Vou guardar tudo pra você — pode ajustar os detalhes depois.</p>

        <div className="mls-timerow">
          {I('clock', { size: 18, color: 'var(--brand)' })}
          <span style={{ fontSize: 14.5, color: 'var(--fg)', fontWeight: 500 }}>Agora</span>
          <span className="mls-time">07/06 · 16h42</span>
        </div>

        <label className="mls-label">Duração</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '8px 0 18px' }}>
          <button className="mls-step" onClick={() => setSecs(s => Math.max(0, s - 5))} aria-label="Menos">{I('minus', { size: 20 })}</button>
          <div className="mls-dur">{fmt(secs)}</div>
          <button className="mls-step" onClick={() => setSecs(s => s + 5)} aria-label="Mais">{I('plus', { size: 20 })}</button>
        </div>

        <label className="mls-label">Tipo</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '8px 0 18px' }}>
          {types.map(t => (
            <button key={t.id} className={`mls-chip ${type === t.id ? 'is-on' : ''}`} onClick={() => setType(t.id)}>{t.label}</button>
          ))}
        </div>

        <label className="mls-label">Observações</label>
        <textarea className="mls-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
          placeholder="Estava dormindo, se recuperou rápido…" />

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" fullWidth icon={I('check', { size: 19 })} onClick={onSave}>Salvar registro</Button>
        </div>
      </div>
    </div>
  );
}
window.MollyLogSeizure = MollyLogSeizure;
