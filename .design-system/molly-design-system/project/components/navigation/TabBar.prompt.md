Bottom tab bar for Molly — the app's primary navigation, with an optional raised center FAB for the hero "Registrar crise" action. Thumb-reachable, 44px+ targets, translucent blur.

```jsx
import { Home, Pill, BarChart3, PawPrint } from 'lucide-react';

<TabBar
  active="home"
  onChange={setTab}
  items={[
    { id:'home',   label:'Início',  icon:<Home /> },
    { id:'meds',   label:'Remédios', icon:<Pill /> },
    { id:'trends', label:'Tendências', icon:<BarChart3 /> },
    { id:'molly',  label:'Molly',   icon:<PawPrint /> },
  ]}
  centerAction={{ label:'Crise', icon:<PawPrint />, onClick: openLog }}
/>
```

With `centerAction` set, items split evenly around the FAB (give an even count). Use `fixed` to pin to the real viewport bottom; otherwise it sits at the bottom of its positioned parent (e.g. a phone frame).
