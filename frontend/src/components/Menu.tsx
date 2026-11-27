import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { rs } from '@/lib/api';
import { useCart, useMenu, useToast } from '@/store';
import DishThumb from './DishThumb';
import { AnimatedHeading, Eyebrow, Spinner } from './ui';
import Dish3DPreview from './Dish3DPreview';
import { hasWebGL } from '@/lib/webgl';
import { flyToCart } from '@/lib/flyToCart';
import { imageSrc } from '@/lib/api';
import { href, takePendingDish } from '@/lib/router';

const EASE = [0.22, 1, 0.36, 1] as const;
const SPRING = { type: 'spring', stiffness: 500, damping: 30 } as const;

/** A number that rolls up when it grows and down when it shrinks. */
function RollingNumber({ value }: { value: number }) {
  const prev = useRef(value);
  const dir = value >= prev.current ? 1 : -1;
  useEffect(() => { prev.current = value; }, [value]);
  return (
    <span className="relative grid h-5 w-5 sm:w-6 place-items-center overflow-hidden text-xs sm:text-sm font-semibold" aria-live="polite">
      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        <motion.span
          key={value}
          custom={dir}
          variants={{
            enter: (d: number) => ({ y: d * 14, opacity: 0 }),
            center: { y: 0, opacity: 1 },
            exit: (d: number) => ({ y: d * -14, opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: EASE }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** How many dishes the home-page preview shows before "View full menu". */
const PREVIEW_COUNT = 6;

/** The menu. `preview` = the short version on the home page: a few popular dishes and a
 *  "View full menu" button (no search or category tabs). */
export default function Menu({ preview = false }: { preview?: boolean }) {
  const { items, categories, loading, error, load } = useMenu();
  const { lines, add, setQty } = useCart();
  const toast = useToast((s) => s.show);
  const [cat, setCat] = useState('popular');
  const [q, setQ] = useState('');
  const webgl = useMemo(hasWebGL, []);
  /** The dish open in the 3D preview pop-up (null = closed). */
  const [previewId, setPreviewId] = useState<number | null>(null);

  // "View in 3D menu" from Signature favourites: show that dish's category and open its 3D preview
  useEffect(() => {
    if (preview) return; // only the full Menu page answers these
    const show = (id: number) => {
      const m = items.find((x) => x.id === id);
      if (!m) return;
      setQ('');
      setCat(m.isPopular ? 'popular' : m.category?.slug ?? cat);
      if (webgl) setPreviewId(id);
    };
    // a dish picked on another page (Favourites, the dish strip): open it once the menu has loaded
    if (items.length) { const id = takePendingDish(); if (id) show(id); }
    const on = (e: Event) => show((e as CustomEvent<number>).detail);
    window.addEventListener('amigos:show-dish', on);
    return () => window.removeEventListener('amigos:show-dish', on);
  }, [items, webgl, cat, preview]);

  const inCat = (m: (typeof items)[number]) => (cat === 'popular' ? m.isPopular : m.category?.slug === cat);
  // the pop-up lets you swipe through the rest of the dish's category
  const previewItems = useMemo(() => {
    const m = items.find((x) => x.id === previewId);
    if (!m) return [];
    return items.filter((x) => x.categoryId === m.categoryId);
  }, [items, previewId]);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((m) => (term
      ? `${m.name} ${m.section} ${m.description}`.toLowerCase().includes(term)
      : inCat(m)));
  }, [items, cat, q]);

  // Group by section (e.g. "Lemonades" / "Smoothies & Fresh Juices")
  const groups = useMemo(() => {
    if (preview) return [['Popular right now', visible.slice(0, PREVIEW_COUNT)]] as [string, typeof visible][];
    const map = new Map<string, typeof visible>();
    visible.forEach((m) => map.set(m.section, [...(map.get(m.section) ?? []), m]));
    return [...map.entries()];
  }, [visible, preview]);

  return (
    <section id="menu" className="relative py-16 sm:py-24 lg:py-28">
      <div className="absolute inset-0 -z-[1] bg-gradient-to-b from-transparent via-espresso/90 to-espresso" />
      <div className="container-x">
        {/* Header and Controls */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow className="mb-2 sm:mb-4">{preview ? 'From our menu' : 'Our full menu'}</Eyebrow>
            <AnimatedHeading className="h2" text="Freshly prepared. Made when you order." highlight="Made when you order." />
          </div>
          {preview ? (
            <a href={href('menu')} className="btn-ghost hidden shrink-0 sm:inline-flex">View full menu →</a>
          ) : (
          <div className="flex w-full flex-col sm:w-auto sm:flex-row sm:items-end gap-3">
            <div className="relative w-full sm:w-64 lg:w-72">
              <label className="field w-full">
                <span className="text-xs sm:text-sm">Search the menu</span>
                <div className="relative">
                  <input
                    className="input pr-8 text-sm sm:text-base"
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Coffee, pasta, wraps…"
                  />
                  {q && (
                    <button
                      type="button"
                      onClick={() => setQ('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-crema-400 hover:text-crema p-1"
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </label>
            </div>
          </div>
          )}
        </div>

        {/* Categories Tab Bar (full menu only) */}
        {!preview && <motion.div
          layoutScroll
          className="no-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mt-6 sm:mt-8 flex gap-2 overflow-x-auto pb-2 scroll-smooth"
          role="tablist"
          aria-label="Menu categories"
        >
          {[{ slug: 'popular', name: '★ Popular' }, ...categories.filter((c) => items.some((m) => m.categoryId === c.id))].map((c) => {
            const on = !q && cat === c.slug;
            return (
              <button
                key={c.slug}
                role="tab"
                aria-selected={on}
                onClick={(e) => {
                  setCat(c.slug); setQ('');
                  e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }}
                // the caramel background is a separate pill that glides between tabs
                className={`chip relative isolate shrink-0 ${on ? 'chip-on !border-transparent !bg-transparent' : 'text-crema-200'}`}
              >
                {on && (
                  <motion.span
                    layoutId="menu-tab"
                    className="absolute -inset-px -z-10 rounded-full bg-caramel shadow-glow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  />
                )}
                {c.name}
              </button>
            );
          })}
        </motion.div>}

        {loading && <p className="mt-8 sm:mt-10 flex items-center gap-2.5 text-sm text-crema-200"><Spinner /> Loading the menu…</p>}
        {error && (
          <p className="mt-8 sm:mt-10 text-sm text-danger">
            Couldn't load the menu: {error} <button className="underline font-semibold ml-1" onClick={load}>Try again</button>
          </p>
        )}

        {/* List View */}
        <div className="relative mt-8 sm:mt-10 grid gap-8 sm:gap-12">
          <AnimatePresence mode="popLayout" initial={false}>
            {groups.map(([section, list]) => (
              <motion.div
                // keyed by section only, so a section shared by two filters stays and its cards move
                key={section}
                layout="position"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                <h3 className="mb-4 sm:mb-5 flex items-center gap-3 font-display text-xl sm:text-2xl">
                  <span>{section}</span>
                  <span className="h-px flex-1 bg-gradient-to-r from-caramel/50 to-transparent" />
                </h3>
                <div className="relative grid gap-3.5 sm:gap-4 md:grid-cols-2">
                  <AnimatePresence mode="popLayout" initial={false}>
                  {list.map((m, i) => {
                    const qty = lines.find((l) => l.id === m.id)?.qty ?? 0;
                    return (
                      <motion.article
                        key={m.id}
                        layout="position"
                        // cards appear one after another; only the first few are delayed so filtering stays snappy
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.4, delay: Math.min(i, 6) * 0.04, ease: EASE, layout: { duration: 0.35, ease: EASE } }}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        className="group flex gap-3 sm:gap-4 rounded-2xl border border-crema/10 bg-espresso/45 p-3.5 sm:p-4 transition-[border-color,background-color,box-shadow] duration-300 hover:border-caramel/50 hover:bg-espresso/70 hover:shadow-glow-sm"
                      >
                        <div className="grid h-16 w-16 sm:h-20 sm:w-20 shrink-0 place-items-center rounded-xl bg-espresso-600/70 transition group-hover:rotate-[-2deg] group-hover:scale-105">
                          <DishThumb item={m} className="h-14 w-14 sm:h-16 sm:w-16" />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-sm sm:text-base leading-snug">
                                {m.name}
                                {m.isPopular && (
                                  <span className="relative ml-1.5 inline-block overflow-hidden rounded-full bg-caramel/15 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-caramel align-middle">
                                    Popular
                                    {/* a soft shine sweeps across once when the card appears */}
                                    <motion.span
                                      aria-hidden="true"
                                      className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent"
                                      initial={{ x: '-150%' }}
                                      whileInView={{ x: '300%' }}
                                      viewport={{ once: true }}
                                      transition={{ duration: 1.1, delay: 0.5 + Math.min(i, 6) * 0.04, ease: 'easeInOut' }}
                                    />
                                  </span>
                                )}
                              </h4>
                              <span className="shrink-0 whitespace-nowrap font-semibold text-caramel text-sm sm:text-base">
                                {rs(m.price)}
                              </span>
                            </div>
                            {m.description && (
                              <p className="mt-1 line-clamp-2 text-xs sm:text-sm text-crema-200/80">
                                {m.description}
                              </p>
                            )}
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-2">
                            {webgl ? (
                              <button
                                type="button"
                                onClick={() => setPreviewId(m.id)}
                                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-2 text-xs font-semibold text-caramel transition hover:bg-caramel/10 sm:min-h-[40px] sm:px-3 sm:text-sm"
                                aria-label={`View ${m.name} in 3D`}
                              >
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 2 3 7v10l9 5 9-5V7z" /><path d="m3 7 9 5 9-5M12 12v10" /></svg>
                                View in 3D
                              </button>
                            ) : <span />}
                            {!m.isAvailable ? (
                              <span className="rounded-full border border-danger/30 px-3 py-1.5 text-xs text-danger">Sold out</span>
                            ) : (
                              // "+ Add" morphs into the "− 1 +" control (and back)
                              <AnimatePresence mode="popLayout" initial={false}>
                                {qty === 0 ? (
                                  <motion.button
                                    key="add"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    whileTap={{ scale: 0.88 }}
                                    transition={SPRING}
                                    className="chip min-h-[36px] sm:min-h-[40px] px-3.5 sm:px-4 text-xs sm:text-sm text-crema"
                                    onClick={(e) => { add(m); flyToCart(e.currentTarget, m.imageUrl ? imageSrc(m.imageUrl) : null); toast(`${m.name} added`); }}
                                  >
                                    + Add
                                  </motion.button>
                                ) : (
                                  <motion.div
                                    key="qty"
                                    initial={{ opacity: 0, scale: 0.6, width: 40 }}
                                    animate={{ opacity: 1, scale: 1, width: 'auto' }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={SPRING}
                                    className="flex items-center gap-1 overflow-hidden rounded-full border border-caramel/50 bg-espresso/40"
                                  >
                                    <motion.button
                                      whileTap={{ scale: 0.8 }}
                                      className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-full text-base sm:text-lg"
                                      onClick={() => setQty(m.id, qty - 1)}
                                      aria-label={`Remove one ${m.name}`}
                                    >
                                      −
                                    </motion.button>
                                    <RollingNumber value={qty} />
                                    <motion.button
                                      whileTap={{ scale: 0.8 }}
                                      className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-full text-base sm:text-lg"
                                      onClick={(e) => { add(m); flyToCart(e.currentTarget); }}
                                      aria-label={`Add one ${m.name}`}
                                    >
                                      +
                                    </motion.button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            )}
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {!loading && !visible.length && q && (
            <div className="rounded-2xl border border-dashed border-crema/20 p-8 text-center">
              <p className="text-crema">No dishes match “{q}”.</p>
              <p className="text-xs text-crema-400 mt-1">Try searching for something like “latte”, “pasta”, or “panini”.</p>
              <button onClick={() => setQ('')} className="btn-ghost mt-4 text-xs">View all items</button>
            </div>
          )}
        </div>

        {preview ? (
          !loading && items.length > 0 && (
            <div className="mt-8 sm:mt-10 flex flex-col items-center gap-2 text-center">
              <a href={href('menu')} className="btn-gold w-full sm:w-auto">View full menu →</a>
              <p className="text-xs text-crema-400">{items.length} dishes and drinks, with search and categories</p>
            </div>
          )
        ) : (
          <p className="mt-8 sm:mt-10 text-xs text-crema-400">All prices in Sri Lankan Rupees (LKR). Order ahead for takeaway or dine in, and pay at the counter when you arrive.</p>
        )}
      </div>

      <Dish3DPreview items={previewItems} focusId={previewId} onClose={() => setPreviewId(null)} />
    </section>
  );
}
