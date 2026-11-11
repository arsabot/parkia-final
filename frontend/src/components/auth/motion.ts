/** Shake amortiguado (decae como un resorte). Usa Web Animations: no re-renderiza. */
export function shake(el: HTMLElement | null) {
  if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  el.animate(
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-6px)', offset: 0.15 },
      { transform: 'translateX(5px)', offset: 0.3 },
      { transform: 'translateX(-3px)', offset: 0.45 },
      { transform: 'translateX(2px)', offset: 0.6 },
      { transform: 'translateX(-1px)', offset: 0.75 },
      { transform: 'translateX(0)' },
    ],
    { duration: 280, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
  );
}
