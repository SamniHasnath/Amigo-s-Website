import { motion, AnimatePresence } from 'framer-motion';
import { useRef, type ReactNode, type MouseEvent } from 'react';
import { useToast } from '@/store';
import { isTouch, prefersReducedMotion } from '@/lib/webgl';

/** Fades + lifts content into view as you scroll. */
export function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 40, rotateX: 8 }} whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

/** A card that tilts toward the mouse in 3D. */
export function Tilt({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  // subtle, and off on touch screens or when the visitor prefers less motion
  const still = isTouch() || prefersReducedMotion();
  const move = (e: MouseEvent) => {
    const el = ref.current; if (!el || still) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 8}deg`);
    el.style.setProperty('--rx', `${-((e.clientY - r.top) / r.height - 0.5) * 8}deg`);
  };
  const leave = () => { ref.current?.style.setProperty('--rx', '0deg'); ref.current?.style.setProperty('--ry', '0deg'); };
  return <div ref={ref} onMouseMove={move} onMouseLeave={leave} className={`tilt ${className}`}>{children}</div>;
}

export function Toast() {
  const msg = useToast((s) => s.msg);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[70] flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
            className="rounded-full bg-crema px-5 py-3 text-sm font-semibold text-espresso shadow-2xl">
            {msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Stars() {
  return (
    <span className="text-caramel" aria-label="5 out of 5 stars">
      {'★★★★★'}
    </span>
  );
}

export function Spinner() {
  return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />;
}
