/* Trends — seizure history & patterns. A larger chart with a dose-change
   annotation, headline stats in tabular mono, and a recent-events list. */
function MollyTrends() {
  const { Card, BarChart, StatusPill } = window.MollyDesignSystem_790ab3;
  const I = window.I;

  const stats = [
    { v: '2,8', label: 'média / mês', icon: 'activity' },
    { v: '21', unit: 'dias', label: 'maior intervalo', icon: 'award' },
    { v: '17', label: 'total em 2026', icon: 'calendar' },
  ];

  const recent = [
    { date: '24/05', time: '06h12', dur: '1min 40s', type: 'Tônico-clônica' },
    { date: '02/05', time: '22h05', dur: '55s', type: 'Focal' },
    { date: '19/04', time: '14h30', dur: '2min 10s', type: 'Tônico-clônica' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 18px 8px' }}>
      <Card padding="lg">
        <h3 style={{ margin: '0 0 2px', font: '600 17px var(--font-display)', color: 'var(--fg)' }}>Frequência de crises</h3>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--fg-muted)' }}>Últimos 6 meses</p>
        <BarChart
          height={180}
          gridLines={3}
          data={[
            { label: 'Jan', value: 4 }, { label: 'Fev', value: 3 }, { label: 'Mar', value: 5 },
            { label: 'Abr', value: 2 }, { label: 'Mai', value: 2 }, { label: 'Jun', value: 1, highlight: true },
          ]}
          annotations={[{ index: 3, label: 'Dose ajustada' }]} />
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {stats.map((s, i) => (
          <Card key={i} padding="sm" style={{ textAlign: 'center' }}>
            <span style={{ color: 'var(--brand)', display: 'inline-flex' }}>{I(s.icon, { size: 18, color: 'var(--brand)' })}</span>
            <div style={{ font: '600 22px var(--font-mono)', color: 'var(--fg)', marginTop: 6, lineHeight: 1 }}>
              {s.v}{s.unit && <span style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-body)', marginLeft: 2 }}>{s.unit}</span>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 4 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <Card padding="lg">
        <h3 style={{ margin: '0 0 12px', font: '600 17px var(--font-display)', color: 'var(--fg)' }}>Registros recentes</h3>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {recent.map((r, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0',
              borderTop: i ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{
                width: 44, flex: 'none', textAlign: 'center',
                font: '600 13px var(--font-mono)', color: 'var(--fg)',
              }}>{r.date}<div style={{ fontSize: 11, color: 'var(--fg-muted)', fontWeight: 400 }}>{r.time}</div></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--fg)' }}>{r.type}</div>
                <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{r.dur}</div>
              </div>
              <span style={{ color: 'var(--fg-muted)', display: 'inline-flex' }}>{I('chevron-right', { size: 18, color: 'var(--neutral-400)' })}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
window.MollyTrends = MollyTrends;
