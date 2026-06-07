Medication stock card for the meds list — name, dose, days-remaining, a stock track, and a color-coded status that auto-derives from the days left.

```jsx
import { Pill, Check, Clock, AlertTriangle, ShoppingCart } from 'lucide-react';

<MedStatusCard
  name="Fenobarbital"
  dose="97,5 mg · 2× ao dia"
  daysRemaining={6}
  capacityDays={30}
  chipIcon={<Pill />}
  icon={<Clock />}
  reorderIcon={<ShoppingCart />}
  onReorder={() => {}}
/>
```

Status thresholds: >14 days `ok` (green), 5–14 `reorder` (amber), ≤4 `urgent` (red) — override with `status`. Pass the matching Lucide `icon` for the pill. `onReorder` reveals the "Pedir mais" action.
