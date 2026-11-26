// Moving dish strip under the hero: dishes glide sideways in an endless loop.
// Hover (or keyboard focus) pauses it; clicking a dish jumps to it in the menu.
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { rs } from '@/lib/api';
import { useMenu } from '@/store';
import type { MenuItem } from '@/types';
import DishThumb from './DishThumb';
import { showDish } from './Favourites';

function Card({ m, hidden }: { m: MenuItem; hidden?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => showDish(m.id)}
      tabIndex={hidden ? -1 : 0}
      aria-label={hidden ? undefined : `${m.name}, ${rs(m.price)}. Show in menu`}
      className="group/card mr-3 sm:mr-4 flex shrink-0 items-center gap-3 rounded-full border border-crema/10 bg-espresso/50 py-2 pl-2 pr-5 backdrop-blur transition-[border-color,background-color,transform] duration-300 hover:-translate-y-0.5 hover:border-caramel/50 hover:bg-espresso/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
    >
      <span className="grid h-12 w-12 sm:h-14 sm:w-14 shrink-0 place-items-center rounded-full bg-espresso-600/70 transition duration-500 group-hover/card:rotate-[-8deg] group-hover/card:scale-110">
        <DishThumb item={m} className="h-10 w-10 sm:h-12 sm:w-12" />
      </span>
      <span className="text-left">
        <span className="block whitespace-nowrap text-sm sm:text-base font-semibold text-crema">{m.name}</span>
        <span className="block whitespace-nowrap text-xs sm:text-sm text-caramel">{rs(m.price)}</span>
      </span>
    </button>
  );
}

export default function DishMarquee() {
  const items = useMenu((s) => s.items);
  // popular dishes with photos first, up to 14
  const list = useMemo(() => [...items]
    .filter((m) => m.isAvailable)
    .sort((a, b) => Number(b.isPopular) - Number(a.isPopular) || Number(!!b.imageUrl) - Number(!!a.imageUrl))
    .slice(0, 14), [items]);

  if (list.length < 3) return null;
  // the track holds the list twice and slides by half its width, so the loop is seamless
  const duration = `${list.length * 4}s`;

  return (
    <motion.section
      aria-label="Dishes from our menu"
      className="relative overflow-hidden border-y border-crema/10 bg-espresso/40 py-4 sm:py-5"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="marquee-mask">
        <div className="marquee-track flex w-max" style={{ animationDuration: duration }}>
          {list.map((m) => <Card key={m.id} m={m} />)}
          <div className="contents" aria-hidden="true">
            {list.map((m) => <Card key={`dup-${m.id}`} m={m} hidden />)}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
