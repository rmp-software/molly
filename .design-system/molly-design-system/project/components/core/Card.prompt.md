The core surface for everything — dashboards, list rows, sheets. Default has a soft warm shadow; `highlighted` uses the brand-soft fill for the active/featured card. Pair with `CardChip` for a tinted status icon rather than a colored left border.

```jsx
import { Pill } from 'lucide-react';

<Card>
  <div style={{display:'flex',gap:12,alignItems:'center'}}>
    <CardChip tone="reorder" icon={<Pill />} />
    <div>
      <h3 style={{margin:0,font:'600 18px var(--font-display)'}}>Fenobarbital</h3>
      <p style={{margin:0,color:'var(--fg-muted)'}}>97,5 mg · 2× ao dia</p>
    </div>
  </div>
</Card>

<Card variant="highlighted">Próxima dose às 20h</Card>
<Card interactive onClick={openDetail}>…</Card>
```

Variants: `default`, `flat`, `raised`, `highlighted`. `padding` sm/md/lg. `interactive` adds hover/press/focus. `CardChip` tones: brand, ok, reorder, urgent, info.
