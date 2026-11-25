import { AnimatePresence, motion } from 'framer-motion';
import { cartCount, cartTotal, useCart } from '@/store';
import { rs } from '@/lib/api';

export default function FloatingOrderBar() {
  const { lines, open, setOpen } = useCart();
  const count = cartCount(lines);
  const total = cartTotal(lines);

  if (count === 0 || open) return null;

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 280 }}
        className="fixed inset-x-0 bottom-3 z-40 px-3 sm:px-4 md:hidden pointer-events-none pb-safe"
        aria-label="Current order summary"
      >
        <div className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-caramel/40 bg-espresso-800/95 p-2.5 sm:p-3 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <span className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-full bg-caramel text-espresso text-xs font-bold shrink-0">
              {count}
            </span>
            <div className="truncate">
              <p className="text-[11px] sm:text-xs text-crema-400 leading-none">Your order</p>
              <p className="font-display text-sm sm:text-base font-bold text-caramel leading-tight mt-0.5">{rs(total)}</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="btn-gold !min-h-[36px] sm:!min-h-[38px] px-3.5 sm:px-4 text-xs font-semibold shrink-0 active:scale-95"
          >
            View order →
          </button>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
