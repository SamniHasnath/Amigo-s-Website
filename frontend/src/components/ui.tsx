import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Fragment, useRef, type ReactNode, type MouseEvent } from 'react';
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

const EASE = [0.22, 1, 0.36, 1] as const;
const WORD_GAP = 0.05; // seconds between words

/** Section heading that rises in word by word as it scrolls into view.
 *  `highlight` (a phrase from `text`) is set in italics and gets a caramel underline drawn under it. */
export function AnimatedHeading({ text, highlight, className = 'h2', as = 'h2' }: { text: string; highlight?: string; className?: string; as?: 'h1' | 'h2' | 'h3' }) {
  const Tag = motion[as];
  const at = highlight ? text.indexOf(highlight) : -1;
  const parts = at < 0
    ? [{ t: text, hl: false }]
    : [{ t: text.slice(0, at), hl: false }, { t: highlight!, hl: true }, { t: text.slice(at + highlight!.length), hl: false }];
  let n = 0; // running word index, for the delay
  const words = (s: string) => s.split(/\s+/).filter(Boolean).map((w, j) => {
    const i = n++;
    return (
      <Fragment key={i}>
        {j > 0 && ' '}
        <span className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-bottom">
          <motion.span
            className="inline-block"
            variants={{ hidden: { y: '110%', opacity: 0 }, show: { y: 0, opacity: 1, transition: { duration: 0.6, delay: i * WORD_GAP, ease: EASE } } }}
          >
            {w}
          </motion.span>
        </span>
      </Fragment>
    );
  });
  const rendered = parts.filter((p) => p.t.trim()).map((p, k) => ({ k, hl: p.hl, el: words(p.t) }));
  const underlineDelay = n * WORD_GAP + 0.25;
  return (
    <Tag className={className} aria-label={text} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
      {rendered.map((p) => <Fragment key={p.k}>{p.k > 0 && ' '}{p.hl ? (
        <motion.em
          aria-hidden="true"
          className="bg-no-repeat [box-decoration-break:clone] [-webkit-box-decoration-break:clone]"
          style={{ backgroundImage: 'linear-gradient(rgb(var(--accent) / .7), rgb(var(--accent) / .7))', backgroundPosition: '0 92%' }}
          variants={{ hidden: { backgroundSize: '0% 0.09em' }, show: { backgroundSize: '100% 0.09em', transition: { duration: 0.7, delay: underlineDelay, ease: EASE } } }}
        >
          {p.el}
        </motion.em>
      ) : <span aria-hidden="true">{p.el}</span>}</Fragment>)}
    </Tag>
  );
}

/** Small script label above a heading: "writes" itself in from left to right. */
export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  // The scroll trigger sits on the wrapper: a fully clipped element counts as "not visible"
  // to the browser, so it could never trigger its own reveal.
  return (
    <motion.div className={className} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}>
      <motion.p
        className="eyebrow"
        variants={{
          hidden: { clipPath: 'inset(0% 100% 0% 0%)', opacity: 0.4 },
          show: { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1, transition: { duration: 0.9, ease: EASE } },
        }}
      >
        {children}
      </motion.p>
    </motion.div>
  );
}

/** Parallax: the content drifts slower than the page as you scroll past it.
 *  It's slightly enlarged so the edges never show while it moves. Off with reduced motion. */
export function Parallax({ children, amount = 24, className = '' }: { children: ReactNode; amount?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const still = prefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], still ? [0, 0] : [-amount, amount]);
  return (
    <div ref={ref} className={`h-full w-full overflow-hidden ${className}`}>
      <motion.div style={{ y, scale: still ? 1 : 1.12 }} className="h-full w-full will-change-transform">
        {children}
      </motion.div>
    </div>
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
