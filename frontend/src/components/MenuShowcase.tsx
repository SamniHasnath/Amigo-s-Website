// "One dish at a time" 3D menu: the dish sits on a plate on the counter, a glass
// price card floats above it with a line pointing at the food, and you swipe,
// tap the arrows or pick a thumbnail to slide the next plate in.
import { lazy, Suspense, useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { AnimatePresence, motion } from 'framer-motion';
import { imageSrc, rs } from '@/lib/api';
import { flyToCart } from '@/lib/flyToCart';
import { useCart, useScene, useToast } from '@/store';
import type { MenuItem } from '@/types';
import type { Drag, Pointer } from '@/three/food/ShowcaseScene';

const ShowcaseScene = lazy(() => import('@/three/food/ShowcaseScene'));

/** Draws the line from the card to the dish every frame (outside React for speed). */
function LineUpdater({ pointer, card, stage, line, dotA, dotB }: {
  pointer: React.MutableRefObject<Pointer>; card: React.RefObject<HTMLDivElement>; stage: React.RefObject<HTMLDivElement>;
  line: React.RefObject<SVGLineElement>; dotA: React.RefObject<SVGCircleElement>; dotB: React.RefObject<SVGCircleElement>;
}) {
  useFrame(() => {
    const c = card.current, s = stage.current, l = line.current;
    if (!c || !s || !l || !dotA.current || !dotB.current) return;
    const sr = s.getBoundingClientRect(), cr = c.getBoundingClientRect();
    const narrow = window.innerWidth < 1024; // matches the lg: card layout
    const ax = (narrow ? cr.left + cr.width / 2 : cr.left + 18) - sr.left;
    const ay = cr.bottom - sr.top;
    const p = pointer.current;
    const op = String(p.visible * (c.dataset.ready === '1' ? 1 : 0));
    l.setAttribute('x1', String(ax)); l.setAttribute('y1', String(ay));
    l.setAttribute('x2', String(p.x)); l.setAttribute('y2', String(p.y));
    dotA.current.setAttribute('cx', String(ax)); dotA.current.setAttribute('cy', String(ay));
    dotB.current.setAttribute('cx', String(p.x)); dotB.current.setAttribute('cy', String(p.y));
    for (const el of [l, dotA.current, dotB.current]) el.style.opacity = op;
  });
  return null;
}

export default function MenuShowcase({ items, focusId, stageClass = 'h-[min(76svh,720px)] min-h-[460px] sm:min-h-[540px]' }: { items: MenuItem[]; focusId?: number | null; /** height of the stage */ stageClass?: string }) {
  const { lines, add, setQty } = useCart();
  const toast = useToast((s) => s.show);
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(0);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const setMenuVisible = useScene((s) => s.setMenuVisible);
  const dir = useRef(1);
  const drag = useRef<Drag>({ rotY: 0, spinning: false });
  const pointer = useRef<Pointer>({ x: 0, y: 0, visible: 0 });
  const stage = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const line = useRef<SVGLineElement>(null);
  const dotA = useRef<SVGCircleElement>(null);
  const dotB = useRef<SVGCircleElement>(null);
  const press = useRef<{ x: number; y: number; t: number; last: number } | null>(null);
  const rail = useRef<HTMLDivElement>(null);
  const canTurnRef = useRef(true);

  // new category -> start at the first dish (or the one asked for from Signature favourites)
  useEffect(() => {
    const i = focusId ? Math.max(0, items.findIndex((m) => m.id === focusId)) : 0;
    setIndex(i); setShown(i);
  }, [items, focusId]);

  const go = useCallback((to: number) => {
    if (!items.length) return;
    const next = (to + items.length) % items.length;
    if (next === index) return;
    dir.current = to > index ? 1 : -1;
    setIndex(next);
  }, [items.length, index]);

  // only render the 3D scene while it is on screen
  useEffect(() => {
    const el = stage.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { setVisible(e.isIntersecting); setMenuVisible(e.isIntersecting); }, { rootMargin: '100px' });
    io.observe(el);
    return () => { io.disconnect(); setMenuVisible(false); };
  }, [setMenuVisible]);

  // keyboard arrows while the stage is on screen
  useEffect(() => {
    if (!visible) return;
    const on = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowRight') go(index + 1);
      if (e.key === 'ArrowLeft') go(index - 1);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [visible, go, index]);

  // keep the active thumbnail in view
  useEffect(() => {
    const r = rail.current, el = r?.querySelector<HTMLElement>(`[data-i="${index}"]`);
    if (r && el) r.scrollTo({ left: el.offsetLeft - r.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' });
  }, [index]);

  const down = (e: PointerEvent) => {
    press.current = { x: e.clientX, y: e.clientY, t: performance.now(), last: e.clientX };
    drag.current.spinning = true;
  };
  const move = (e: PointerEvent) => {
    if (!press.current) return;
    const dx = e.clientX - press.current.last;
    if (canTurnRef.current) drag.current.rotY += dx * 0.012;
    press.current.last = e.clientX;
  };
  const up = (e: PointerEvent) => {
    const p = press.current; press.current = null; drag.current.spinning = false;
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y, dt = performance.now() - p.t;
    // horizontal swipe: trigger if horizontal delta > 50px and mostly horizontal
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && dt < 450) {
      go(index + (dx < 0 ? 1 : -1));
    }
  };

  const item = items[index];
  const qty = item ? lines.find((l) => l.id === item.id)?.qty ?? 0 : 0;
  const settled = index === shown;
  const canTurn = !!item && (!!item.modelUrl || !item.imageUrl);
  canTurnRef.current = canTurn;
  const addOne = (el: Element | null) => {
    if (!item || !item.isAvailable) return;
    add(item); flyToCart(el, item.imageUrl ? imageSrc(item.imageUrl) : null); toast(`${item.name} added to your order`);
  };

  return (
    <div>
      <div
        ref={stage}
        className={`theme-dark relative ${stageClass} touch-pan-y select-none overflow-hidden rounded-2xl sm:rounded-[28px] border border-crema/10 bg-espresso`}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        role="region"
        aria-roledescription="carousel"
        aria-label="3D menu"
      >
        <Canvas shadows dpr={[1, 1.7]} frameloop={visible ? 'always' : 'never'} camera={{ position: [0, 2.2, 6.4], fov: 34 }} gl={{ antialias: true }}
          onCreated={() => setTimeout(() => setReady(true), 400)}>
          <Suspense fallback={null}>
            <ShowcaseScene items={items} target={index} dir={dir} drag={drag} pointer={pointer} onShown={setShown} />
          </Suspense>
          <LineUpdater pointer={pointer} card={card} stage={stage} line={line} dotA={dotA} dotB={dotB} />
        </Canvas>

        {/* Loading state */}
        <div className={`pointer-events-none absolute inset-0 grid place-items-center bg-espresso transition-opacity duration-700 ${ready ? 'opacity-0' : 'opacity-100'}`} aria-hidden={ready}>
          <p className="flex items-center gap-2.5 text-xs sm:text-sm text-crema-200">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-caramel border-t-transparent" /> Setting the table…
          </p>
        </div>

        {/* Pointer line from card to dish */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <line ref={line} stroke="rgba(243,230,211,.75)" strokeWidth="1.2" style={{ transition: 'opacity .3s' }} />
          <circle ref={dotA} r="4" fill="#f3e6d3" style={{ transition: 'opacity .3s' }} />
          <circle ref={dotB} r="5" fill="#f3e6d3" stroke="rgba(243,230,211,.35)" strokeWidth="5" style={{ transition: 'opacity .3s' }} />
        </svg>

        {/* Glass price card */}
        <div
          ref={card}
          data-ready={settled ? '1' : '0'}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute left-1/2 top-3 sm:top-5 w-[min(92%,360px)] -translate-x-1/2 [perspective:800px] lg:left-[7%] lg:top-[7%] lg:translate-x-0 z-10"
        >
          <AnimatePresence mode="wait">
            {item && (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -20, rotateX: 25, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, rotateX: -20, scale: 0.96 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="relative overflow-hidden rounded-2xl border border-white/25 bg-gradient-to-br from-white/[.18] to-white/[.05] p-3.5 sm:p-5 text-center shadow-[0_20px_50px_-15px_rgba(0,0,0,.8)] backdrop-blur-md transition-shadow duration-500 hover:shadow-[0_0_40px_-6px_rgba(199,122,53,.55)]">
                  {/* Corner ribbon */}
                  <span className="absolute -left-10 top-3.5 w-32 -rotate-45 bg-gradient-to-r from-caramel-600 to-caramel py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.14em] text-espresso shadow">
                    {item.isPopular ? 'Popular' : item.category?.name.split(' ')[0] ?? 'Menu'}
                  </span>
                  {/* Corner brackets */}
                  <span className="pointer-events-none absolute right-2 top-2 h-4 w-4 rounded-tr-lg border-r border-t border-white/40" />
                  <span className="pointer-events-none absolute bottom-2 left-2 h-4 w-4 rounded-bl-lg border-b border-l border-white/40" />

                  <h3 className="px-5 font-display text-lg sm:text-[24px] uppercase leading-tight tracking-wide">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="mx-auto mt-1 sm:mt-2 line-clamp-2 max-w-[32ch] text-xs sm:text-sm text-crema-200">
                      {item.description}
                    </p>
                  )}
                  <div className="mx-auto my-2 sm:my-3 h-px w-2/3 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  <div className="flex items-center justify-between gap-2 text-left">
                    <span className="text-xs">
                      <span className="block text-crema-400 truncate max-w-[140px] sm:max-w-none">{item.section}</span>
                      {item.isAvailable
                        ? <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] sm:text-xs text-mint"><span className="h-1.5 w-1.5 rounded-full bg-mint" />Available</span>
                        : <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] sm:text-xs text-danger"><span className="h-1.5 w-1.5 rounded-full bg-danger" />Sold out</span>}
                    </span>
                    <span className="font-display text-xl sm:text-2xl text-caramel">{rs(item.price)}</span>
                  </div>
                  <div className="mt-2.5 sm:mt-3 flex justify-center">
                    {!item.isAvailable ? (
                      <button className="btn w-full min-h-[40px] sm:min-h-[44px] cursor-not-allowed border border-crema/15 text-xs sm:text-sm text-crema-400" disabled>Sold out today</button>
                    ) : qty === 0 ? (
                      <button className="btn-gold w-full min-h-[40px] sm:min-h-[44px] text-xs sm:text-sm" onClick={(e) => addOne(e.currentTarget)}>Add to order</button>
                    ) : (
                      <div className="flex w-full items-center justify-between rounded-full border border-caramel/60 px-1 py-0.5">
                        <button className="h-9 w-9 sm:h-10 sm:w-10 text-lg active:scale-90" onClick={() => setQty(item.id, qty - 1)} aria-label={`Remove one ${item.name}`}>−</button>
                        <span className="text-xs sm:text-sm font-semibold" aria-live="polite">{qty} in your order</span>
                        <button className="h-9 w-9 sm:h-10 sm:w-10 text-lg active:scale-90" onClick={(e) => addOne(e.currentTarget)} aria-label={`Add one ${item.name}`}>+</button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Previous / Next dish buttons */}
        {items.length > 1 && (['prev', 'next'] as const).map((d) => (
          <button
            key={d}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => go(index + (d === 'next' ? 1 : -1))}
            aria-label={d === 'next' ? 'Next dish' : 'Previous dish'}
            className={`absolute top-[56%] z-10 grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-full border border-crema/25 bg-espresso/60 text-lg sm:text-xl backdrop-blur transition hover:border-caramel hover:text-caramel active:scale-90 ${
              d === 'next' ? 'right-2.5 sm:right-6' : 'left-2.5 sm:left-6'
            }`}
          >
            {d === 'next' ? '→' : '←'}
          </button>
        ))}

        {/* Desktop hint */}
        <div className="pointer-events-none absolute bottom-20 right-5 hidden text-right text-xs text-crema-400 sm:block">
          <p className="font-display text-xl text-crema">{index + 1} <span className="text-crema-400">/ {items.length}</span></p>
          <p>{canTurn ? 'Drag to rotate · ' : ''}Swipe or use ← → arrow keys to browse</p>
        </div>

        {/* Thumbnail rail */}
        <div
          ref={rail}
          onPointerDown={(e) => e.stopPropagation()}
          className="no-scrollbar absolute inset-x-0 bottom-0 flex gap-2 overflow-x-auto bg-gradient-to-t from-black/85 via-black/50 to-transparent px-3 pb-3 pt-8 sm:px-4 sm:pb-4 sm:pt-10 scroll-smooth z-10"
        >
          {items.map((m, i) => (
            <button
              key={m.id}
              data-i={i}
              onClick={() => go(i)}
              aria-current={i === index}
              className={`shrink-0 rounded-full border px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm backdrop-blur transition active:scale-95 ${
                i === index
                  ? 'border-caramel bg-caramel text-espresso font-semibold'
                  : 'border-crema/20 bg-espresso/65 text-crema-200 hover:border-caramel/60'
              }`}
            >
              {m.name} <span className={i === index ? 'text-espresso/80' : 'text-crema-400'}>· {m.isAvailable ? rs(m.price) : 'sold out'}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
