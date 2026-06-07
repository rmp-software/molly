The calm focal point of the home screen: how long since Molly's last seizure, in big tabular numerals. Reassuring, never a stopwatch-y countdown.

```jsx
import { HeartPulse } from 'lucide-react';

<Counter
  since="2026-05-24T06:00:00"
  icon={<HeartPulse />}
  sub="Continue assim."
/>
```

Shows days + hours + minutes (days hidden when zero), ticks every minute. `size="sm"` for inline use. Pair it above the "Registrar crise" button on the dashboard.
