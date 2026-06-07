Pill-shaped action button — warm gold primary, tonal secondary, quiet ghost, and danger. Use for every tappable action; reach for `size="lg"` + `fullWidth` for the hero "Registrar crise" action.

```jsx
import { PawPrint, Plus } from 'lucide-react';

<Button variant="primary" size="lg" fullWidth icon={<PawPrint />}>
  Registrar crise
</Button>

<Button variant="secondary" icon={<Plus />}>Adicionar remédio</Button>
<Button variant="ghost">Agora não</Button>
<Button variant="danger">Excluir registro</Button>
```

Variants: `primary` (brand gold, default), `secondary` (tonal/outline), `ghost` (text), `danger` (red). Sizes: `sm` 38px, `md` 48px (default), `lg` 56px. Props: `fullWidth`, `loading`, `disabled`, `icon`, `trailingIcon`, `iconOnly`. Always keep labels in sentence-case pt-BR.
