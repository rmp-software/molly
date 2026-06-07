Color-coded status pill for medication stock and similar states. Always pairs color with an icon (or dot) and a pt-BR label so meaning never rests on hue alone.

```jsx
import { Check, Clock, AlertTriangle } from 'lucide-react';

<StatusPill status="ok" icon={<Check />}>Estoque OK</StatusPill>
<StatusPill status="reorder" icon={<Clock />}>Reabastecer em breve</StatusPill>
<StatusPill status="urgent" icon={<AlertTriangle />}>Acabando</StatusPill>
```

Tones: `ok` green, `reorder` amber (distinct from brand gold), `urgent` red, `info` blue, `neutral`. `size="sm"` for dense rows; `solid` for the strongest urgency.
