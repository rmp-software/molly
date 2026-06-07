/* Meds — medication & stock control. Color-coded status cards with
   days-remaining, a calm overview strip, and an add action. */
function MollyMeds({ onReorder }) {
  const { MedStatusCard, Button, Card } = window.MollyDesignSystem_790ab3;
  const I = window.I;

  const meds = [
    { name: 'Brometo de potássio', dose: '500 mg · 2× ao dia', daysRemaining: 23, capacityDays: 30, icon: I('check', { size: 14 }) },
    { name: 'Fenobarbital', dose: '97,5 mg · 2× ao dia', daysRemaining: 6, capacityDays: 30, icon: I('clock', { size: 14 }) },
    { name: 'Levetiracetam', dose: '250 mg · 3× ao dia', daysRemaining: 2, capacityDays: 30, icon: I('alert-triangle', { size: 14 }) },
  ];

  const overview = [
    { n: 1, label: 'em dia', tone: 'var(--success)', soft: 'var(--success-soft)' },
    { n: 1, label: 'reabastecer', tone: 'var(--warning)', soft: 'var(--warning-soft)' },
    { n: 1, label: 'acabando', tone: 'var(--danger)', soft: 'var(--danger-soft)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 18px 8px' }}>
      {/* Overview strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {overview.map((o, i) => (
          <div key={i} style={{
            background: o.soft, borderRadius: 'var(--radius-md)', padding: '12px 10px', textAlign: 'center',
          }}>
            <div style={{ font: '600 26px var(--font-mono)', color: o.tone, lineHeight: 1 }}>{o.n}</div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-2)', marginTop: 4, fontWeight: 500 }}>{o.label}</div>
          </div>
        ))}
      </div>

      {meds.map((m, i) => (
        <MedStatusCard key={i} {...m}
          chipIcon={I('pill', { size: 21 })}
          reorderIcon={I('shopping-cart', { size: 15 })}
          onReorder={() => onReorder && onReorder(m.name)} />
      ))}

      <Button variant="secondary" fullWidth icon={I('plus', { size: 18 })}>Adicionar remédio</Button>
    </div>
  );
}
window.MollyMeds = MollyMeds;
