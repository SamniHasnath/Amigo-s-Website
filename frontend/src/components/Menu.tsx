import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { rs } from '@/lib/api';
import { useCart, useMenu, useToast } from '@/store';
import DishThumb from './DishThumb';
import { Reveal, Spinner } from './ui';
import Dish3DPreview from './Dish3DPreview';
import { hasWebGL } from '@/lib/webgl';
import { flyToCart } from '@/lib/flyToCart';
import { imageSrc } from '@/lib/api';

export default function Menu() {
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
    const on = (e: Event) => {
      const id = (e as CustomEvent<number>).detail;
      const m = items.find((x) => x.id === id);
      if (!m) return;
      setQ('');
      setCat(m.isPopular ? 'popular' : m.category?.slug ?? cat);
      if (webgl) setPreviewId(id);
    };
    window.addEventListener('amigos:show-dish', on);
    return () => window.removeEventListener('amigos:show-dish', on);
  }, [items, webgl, cat]);

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
    const map = new Map<string, typeof visible>();
    visible.forEach((m) => map.set(m.section, [...(map.get(m.section) ?? []), m]));
    return [...map.entries()];
  }, [visible]);

  return (
    <section id="menu" className="relative py-16 sm:py-24 lg:py-28">
      <div className="absolute inset-0 -z-[1] bg-gradient-to-b from-transparent via-espresso/90 to-espresso" />
      <div className="container-x">
        {/* Header and Controls */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Reveal><p className="eyebrow mb-2 sm:mb-4">Our full menu</p></Reveal>
            <Reveal delay={0.1}><h2 className="h2">Freshly prepared. Made when you order.</h2></Reveal>
          </div>
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
        </div>

        {/* Categories Tab Bar */}
        <div
          className="no-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mt-6 sm:mt-8 flex gap-2 overflow-x-auto pb-2 scroll-smooth"
          role="tablist"
          aria-label="Menu categories"
        >
          {[{ slug: 'popular', name: '★ Popular' }, ...categories.filter((c) => items.some((m) => m.categoryId === c.id))].map((c) => (
            <button
              key={c.slug}
              role="tab"
              aria-selected={!q && cat === c.slug}
              onClick={() => { setCat(c.slug); setQ(''); }}
              className={`chip shrink-0 ${!q && cat === c.slug ? 'chip-on' : 'text-crema-200'}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {loading && <p className="mt-8 sm:mt-10 flex items-center gap-2.5 text-sm text-crema-200"><Spinner /> Loading the menu…</p>}
        {error && (
          <p className="mt-8 sm:mt-10 text-sm text-danger">
            Couldn't load the menu: {error} <button className="underline font-semibold ml-1" onClick={load}>Try again</button>
          </p>
        )}

        {/* List View */}
        <div className={`mt-8 sm:mt-10 grid gap-8 sm:gap-12`}>
          <AnimatePresence mode="popLayout">
            {groups.map(([section, list]) => (
              <motion.div
                key={section + cat + q}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <h3 className="mb-4 sm:mb-5 flex items-center gap-3 font-display text-xl sm:text-2xl">
                  <span>{section}</span>
                  <span className="h-px flex-1 bg-gradient-to-r from-caramel/50 to-transparent" />
                </h3>
                <div className="grid gap-3.5 sm:gap-4 md:grid-cols-2">
                  {list.map((m) => {
                    const qty = lines.find((l) => l.id === m.id)?.qty ?? 0;
                    return (
                      <article
                        key={m.id}
                        className="group flex gap-3 sm:gap-4 rounded-2xl border border-crema/10 bg-espresso/45 p-3.5 sm:p-4 transition hover:-translate-y-0.5 hover:border-caramel/50 hover:bg-espresso/70"
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
                                  <span className="ml-1.5 inline-block rounded-full bg-caramel/15 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-caramel align-middle">
                                    Popular
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
                            ) : qty === 0 ? (
                              <button
                                className="chip min-h-[36px] sm:min-h-[40px] px-3.5 sm:px-4 text-xs sm:text-sm text-crema"
                                onClick={(e) => { add(m); flyToCart(e.currentTarget, m.imageUrl ? imageSrc(m.imageUrl) : null); toast(`${m.name} added`); }}
                              >
                                + Add
                              </button>
                            ) : (
                              <div className="flex items-center gap-1 rounded-full border border-caramel/50 bg-espresso/40">
                                <button
                                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-full text-base sm:text-lg active:scale-90"
                                  onClick={() => setQty(m.id, qty - 1)}
                                  aria-label={`Remove one ${m.name}`}
                                >
                                  −
                                </button>
                                <span className="w-5 sm:w-6 text-center text-xs sm:text-sm font-semibold" aria-live="polite">{qty}</span>
                                <button
                                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-full text-base sm:text-lg active:scale-90"
                                  onClick={(e) => { add(m); flyToCart(e.currentTarget); }}
                                  aria-label={`Add one ${m.name}`}
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
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

        <p className="mt-8 sm:mt-10 text-xs text-crema-400">All prices in Sri Lankan Rupees (LKR). Order ahead for takeaway or dine in, and pay at the counter when you arrive.</p>
      </div>

      <Dish3DPreview items={previewItems} focusId={previewId} onClose={() => setPreviewId(null)} />
    </section>
  );
}
