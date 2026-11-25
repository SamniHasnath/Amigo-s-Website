// Small "add to order" animation: a dot (or the dish photo) flies from the button
// to the Order button in the navbar, which then gives a little bump.
// Purely visual — the cart itself is updated by the store as before.
import { prefersReducedMotion } from './webgl';

export function flyToCart(from: Element | null, image?: string | null) {
  const target = document.getElementById('cart-button');
  if (!target) return;
  const bump = () => target.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.14)' }, { transform: 'scale(.96)' }, { transform: 'scale(1)' }],
    { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' },
  );
  if (!from || prefersReducedMotion()) { bump(); return; }
  const a = from.getBoundingClientRect(), b = target.getBoundingClientRect();
  const size = image ? 64 : 22;
  const el = document.createElement('div');
  Object.assign(el.style, {
    position: 'fixed', left: `${a.left + a.width / 2 - size / 2}px`, top: `${a.top + a.height / 2 - size / 2}px`,
    width: `${size}px`, height: `${size}px`, borderRadius: '999px', zIndex: '90', pointerEvents: 'none',
    background: image ? `#21130E url("${image}") center/cover` : '#E3AA65', boxShadow: '0 0 24px rgba(199,122,53,.7)',
  } as CSSStyleDeclaration);
  document.body.appendChild(el);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const anim = el.animate([
    { transform: 'translate(0,0) scale(1)', opacity: 1 },
    { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 120}px) scale(.9)`, opacity: 1, offset: 0.5 },
    { transform: `translate(${dx}px, ${dy}px) scale(.25)`, opacity: 0.6 },
  ], { duration: 750, easing: 'cubic-bezier(.5,0,.4,1)' });
  anim.onfinish = () => { el.remove(); bump(); };
}
