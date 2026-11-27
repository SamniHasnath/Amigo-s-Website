// Section 4 — Signature favourites: the café's popular dishes that have real photos.
// Hover or tap a name to bring its photo forward; "View in 3D" opens the dish in the 3D preview.
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { imageSrc, rs } from '@/lib/api';
import { flyToCart } from '@/lib/flyToCart';
import { useCart, useMenu, useToast } from '@/store';
import { AnimatedHeading, Eyebrow } from './ui';
import { currentPage, navigate, setPendingDish } from '@/lib/router';

/** Open a dish in the Menu page's 3D preview, from any page. */
export function showDish(id: number) {
  if (currentPage() === 'menu') {
    window.dispatchEvent(new CustomEvent('amigos:show-dish', { detail: id }));
  } else {
    setPendingDish(id); // the Menu page opens it once it has loaded
    navigate('menu');
  }
}

export default function Favourites() {
  const items = useMenu((s) => s.items);
  const add = useCart((s) => s.add);
  const toast = useToast((s) => s.show);
  // Popular dishes with a real photo first, one per photo, at most five
  const list = useMemo(() => {
    const seen = new Set<string>();
    return [...items]
      .filter((m) => m.imageUrl && m.isAvailable)
      .sort((a, b) => Number(b.isPopular) - Number(a.isPopular))
      .filter((m) => (seen.has(m.imageUrl!) ? false : (seen.add(m.imageUrl!), true)))
      .slice(0, 5);
  }, [items]);
  const [active, setActive] = useState(0);
  const cur = list[active] ?? list[0];
  if (!cur) return null;

  return (
    <section id="favourites" className="relative bg-espresso py-16 sm:py-24 lg:py-28">
      <div className="container-x">
        <Eyebrow className="mb-2 sm:mb-4">House favorites</Eyebrow>
        <AnimatedHeading className="h2 max-w-2xl" text="The dishes and drinks our guests keep coming back for." highlight="keep coming back for." />

        <div className="mt-8 sm:mt-12 grid items-center gap-6 sm:gap-10 lg:grid-cols-[1.1fr_1fr]">
          {/* Active Dish Photo */}
          <div className="group theme-dark relative aspect-[4/3] overflow-hidden rounded-2xl sm:rounded-[28px] bg-espresso-800 shadow-[0_20px_50px_-25px_rgba(74,44,26,.6)]">
            <AnimatePresence mode="popLayout">
              <motion.img
                whileHover={{ scale: 1.05, transition: { duration: 0.6 } }}
                key={cur.id}
                src={imageSrc(cur.imageUrl!)}
                alt={cur.name}
                initial={{ opacity: 0, scale: 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 h-full w-full object-contain p-2 sm:p-4"
              />
            </AnimatePresence>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-espresso to-transparent" />
          </div>

          {/* Dish List */}
          <ol className="grid gap-2">
            {list.map((m, i) => (
              <motion.li
                key={m.id}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                <button
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  aria-pressed={i === active}
                  className={`group flex w-full items-baseline gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border px-3.5 py-3 sm:px-5 sm:py-4 text-left transition active:scale-[0.98] ${
                    i === active
                      ? 'border-caramel/50 bg-espresso-800 shadow-md'
                      : 'border-transparent hover:bg-espresso-800/60'
                  }`}
                >
                  <span className="font-display text-sm sm:text-lg text-caramel">{String(i + 1).padStart(2, '0')}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-display text-base sm:text-2xl leading-snug">{m.name}</span>
                    {i === active && m.description && (
                      <span className="mt-1 block text-xs sm:text-sm text-crema-200 line-clamp-2">{m.description}</span>
                    )}
                  </span>
                  <span className="shrink-0 whitespace-nowrap font-semibold text-caramel text-sm sm:text-base">{rs(m.price)}</span>
                </button>
              </motion.li>
            ))}
            <li className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                className="btn-gold w-full sm:w-auto justify-center"
                onClick={(e) => { add(cur); flyToCart(e.currentTarget, imageSrc(cur.imageUrl!)); toast(`${cur.name} added to your order`); }}
              >
                Order {cur.name}
              </button>
              <button className="btn-ghost w-full sm:w-auto justify-center" onClick={() => showDish(cur.id)}>
                View in 3D
              </button>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
