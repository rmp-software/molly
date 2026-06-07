/* Lucide icon helper for the Molly UI kit.
   Renders a Lucide icon imperatively inside a ref'd span so React never
   fights the <i>→<svg> swap. `I(name, opts)` returns an element usable as
   an `icon` prop on any design-system component. */
function MollyIcon({ name, size = 22, stroke = 2, color, style = {}, className = '' }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const host = ref.current;
    if (!host || !window.lucide) return;
    host.innerHTML = '';
    const i = document.createElement('i');
    i.setAttribute('data-lucide', name);
    i.setAttribute('width', size);
    i.setAttribute('height', size);
    i.setAttribute('stroke-width', stroke);
    host.appendChild(i);
    window.lucide.createIcons();
  });
  return <span ref={ref} className={className} style={{ display: 'inline-flex', color, ...style }} aria-hidden="true" />;
}

window.MollyIcon = MollyIcon;
window.I = (name, opts = {}) => React.createElement(MollyIcon, { name, ...opts });
