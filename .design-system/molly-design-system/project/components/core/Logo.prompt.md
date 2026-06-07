Molly wordmark + paw-print mark. Keep the mark a slot so the system stays icon-library agnostic.

```jsx
import { PawPrint } from 'lucide-react';

<Logo mark={<PawPrint />} />                 // wordmark + mark
<Logo mark={<PawPrint />} badge size="sm" /> // app-icon lockup
<Logo mark={<PawPrint />} markOnly />        // mark only
```

Sizes sm/md/lg. `badge` puts the mark in a gold rounded square; `markOnly` hides the word.
