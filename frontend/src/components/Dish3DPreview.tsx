// Pop-up 3D preview for one dish, opened from the menu list ("View in 3D").
// Shows the 3D stage on that dish; you can swipe or use the arrows to browse the rest of its category.
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MenuItem } from '@/types';
import MenuShowcase from './MenuShowcase';

export default function Dish3DPreview({ items, focusId, onClose }: { items: MenuItem[]; focusId: number | null; onClose: () => void }) {
  const open = focusId !== null && items.length > 0;
  const category = items[0]?.category?.name;

  // Esc closes; the page behind doesn't scroll while it's open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-2 backdrop-blur-sm sm:p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog" aria-modal="true" aria-label="3D dish preview"
        >
          <motion.div
            className="w-full max-w-5xl"
            initial={{ y: 30, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between gap-3 px-1 text-white sm:mb-3">
              <p className="text-sm font-semibold">
                3D preview{category && <span className="font-normal text-white/60"> · {category}</span>}
              </p>
              <button type="button" onClick={onClose} autoFocus aria-label="Close 3D preview"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-black/40 text-lg transition hover:border-white/60 active:scale-90">
                ✕
              </button>
            </div>
            <MenuShowcase items={items} focusId={focusId} stageClass="h-[min(calc(100svh-90px),680px)] min-h-[380px]" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
