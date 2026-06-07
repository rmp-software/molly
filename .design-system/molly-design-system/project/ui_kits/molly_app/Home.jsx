/* Home dashboard — the calm landing screen.
   Big "time since last seizure" counter, the hero "Registrar crise" action,
   a compact frequency chart, and the next-dose reminder. */
function MollyHome({ onLog, lastSeizure }) {
  const { Counter, Button, Card, BarChart } = window.MollyDesignSystem_790ab3;
  const I = window.I;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '4px 18px 8px' }}>
      {/* Hero counter */}
      <Card variant="raised" padding="lg" style={{ textAlign: 'center', paddingTop: 26, paddingBottom: 26 }}>
        <Counter
          since={lastSeizure}
          icon={I('heart-pulse', { size: 16 })}
          sub="Você está cuidando bem dela." />
      </Card>

      {/* Hero action */}
      <Button variant="primary" size="lg" fullWidth icon={I('paw-print', { size: 22 })} onClick={onLog}>
        Registrar crise
      </Button>
      <p style={{
        margin: '-6px 0 2px', textAlign: 'center', fontSize: 13, color: 'var(--fg-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        {I('shield-check', { size: 14, color: 'var(--fg-muted)' })}
        Leva poucos segundos, com uma mão só.
      </p>

      {/* Next dose */}
      <Card variant="highlighted" style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
        <span style={{
          width: 42, height: 42, borderRadius: 12, flex: 'none', display: 'grid', placeItems: 'center',
          background: 'var(--surface)', color: 'var(--brand)',
        }}>{I('pill', { size: 21 })}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--brand-press)' }}>Próxima dose</div>
          <div style={{ font: '700 19px/1.1 var(--font-display)', color: 'var(--fg)', marginTop: 2 }}>
            Fenobarbital · hoje, 20h
          </div>
        </div>
        <span style={{
          fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13, color: 'var(--brand-press)',
          background: 'var(--surface)', padding: '5px 9px', borderRadius: 999,
        }}>em 3h</span>
      </Card>

      {/* Frequency summary */}
      <Card padding="lg">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <h3 style={{ margin: 0, font: '600 17px var(--font-display)', color: 'var(--fg)' }}>Crises por mês</h3>
          <span style={{ fontSize: 12.5, color: 'var(--success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {I('trending-down', { size: 15, color: 'var(--success)' })} menos que antes
          </span>
        </div>
        <BarChart
          height={150}
          data={[
            { label: 'Jan', value: 4 }, { label: 'Fev', value: 3 }, { label: 'Mar', value: 5 },
            { label: 'Abr', value: 2 }, { label: 'Mai', value: 2 }, { label: 'Jun', value: 1, highlight: true },
          ]}
          annotations={[{ index: 3, label: 'Dose ajustada' }]} />
      </Card>
    </div>
  );
}
window.MollyHome = MollyHome;
