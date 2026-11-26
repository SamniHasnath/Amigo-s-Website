// Realistic coffee beans drifting through the page (after the hero), like the ones in the hero film.
// - depth: far beans are small, soft and faint; near beans are bigger and move more
// - they drift and tumble on their own, rise past you as you scroll, and lean away from the mouse
// - they stay near the left/right edges so they never sit on top of text
// - desktop only, never clickable, and off entirely for visitors who prefer reduced motion
import { useEffect, useState } from 'react';
import { motion, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { prefersReducedMotion } from '@/lib/webgl';

type Bean = { x: string; y: number; size: number; depth: number; rot: number; dur: number; blur: number };

// x along the edges; y = starting point as a fraction of the screen height; depth 0 (far) .. 1 (near)
const BEANS: Bean[] = [
  { x: '2.5%', y: 0.12, size: 34, depth: 0.55, rot: 25, dur: 11, blur: 0 },
  { x: '6%', y: 0.58, size: 20, depth: 0.2, rot: -40, dur: 14, blur: 1.6 },
  { x: '1%', y: 0.86, size: 52, depth: 0.95, rot: 70, dur: 9, blur: 2.2 },
  { x: '9%', y: 0.34, size: 16, depth: 0.12, rot: 10, dur: 16, blur: 2 },
  { x: '92%', y: 0.22, size: 42, depth: 0.7, rot: -15, dur: 10, blur: 0 },
  { x: '96%', y: 0.5, size: 18, depth: 0.18, rot: 55, dur: 15, blur: 1.8 },
  { x: '89%', y: 0.74, size: 26, depth: 0.4, rot: -65, dur: 12, blur: 0.6 },
  { x: '94.5%', y: 0.95, size: 58, depth: 1, rot: 35, dur: 8, blur: 2.6 },
];

/** A roasted bean: rounded body with a soft light from top-left, a curved centre crease and a sheen. */
function BeanSvg({ size, id }: { size: number; id: number }) {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 40 52" aria-hidden="true">
      <defs>
        <radialGradient id={`bean-body-${id}`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#9a6845" />
          <stop offset="45%" stopColor="#6b4129" />
          <stop offset="100%" stopColor="#2e1a10" />
        </radialGradient>
        <linearGradient id={`bean-crease-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1c0f08" stopOpacity=".95" />
          <stop offset="100%" stopColor="#2a160c" stopOpacity=".7" />
        </linearGradient>
      </defs>
      {/* soft contact shadow */}
      <ellipse cx="22" cy="28" rx="17" ry="23" fill="#000" opacity=".18" />
      <ellipse cx="20" cy="26" rx="17" ry="23" fill={`url(#bean-body-${id})`} />
      {/* centre crease, slightly S-shaped like a real bean */}
      <path d="M20 5 C 15 16, 25 26, 19 37 C 17 41, 18 45, 20 47" fill="none" stroke={`url(#bean-crease-${id})`} strokeWidth="3.2" strokeLinecap="round" />
      <path d="M21.6 6 C 17 16, 27 26, 21 37" fill="none" stroke="#b07d58" strokeOpacity=".35" strokeWidth="1" strokeLinecap="round" />
      {/* oily sheen */}
      <ellipse cx="12.5" cy="15" rx="4" ry="7" fill="#fff" opacity=".16" transform="rotate(-20 12.5 15)" />
    </svg>
  );
}

function FloatingBean({ b, i, scrollY, vh, mx, my }: { b: Bean; i: number; scrollY: MotionValue<number>; vh: number; mx: MotionValue<number>; my: MotionValue<number> }) {
  // rises as you scroll (near beans faster) and wraps around, so there are always a few in view
  const span = vh + 200;
  const y = useTransform(scrollY, (v) => {
    const pos = (b.y * vh - v * (0.15 + b.depth * 0.45)) % span;
    return (pos < -100 ? pos + span : pos) - 100;
  });
  // lean away from the mouse, more for near beans
  const x = useTransform(mx, (v) => v * -28 * b.depth);
  const yMouse = useTransform(my, (v) => v * -18 * b.depth);
  const opacity = 0.35 + b.depth * 0.5;

  return (
    <motion.div className="absolute top-0" style={{ left: b.x, y, x, opacity, filter: b.blur ? `blur(${b.blur}px)` : undefined }}>
      <motion.div style={{ y: yMouse }}>
        {/* idle drift + slow tumble, each bean on its own rhythm */}
        <motion.div
          initial={{ rotate: b.rot }}
          animate={{ y: [0, -14, 6, 0], x: [0, 6, -4, 0], rotate: [b.rot, b.rot + 18, b.rot - 10, b.rot] }}
          transition={{ duration: b.dur, repeat: Infinity, ease: 'easeInOut', delay: i * 0.7 }}
        >
          <BeanSvg size={b.size} id={i} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function AmbientBeans() {
  const [vh, setVh] = useState(() => window.innerHeight);
  const [enabled] = useState(() => !prefersReducedMotion() && window.matchMedia('(min-width: 1024px)').matches);
  const { scrollY } = useScroll();
  // hidden over the hero (it has its own beans), fades in as you scroll past it
  const layerOpacity = useTransform(scrollY, [vh * 0.45, vh * 0.9], [0, 1]);
  const mxRaw = useMotionValue(0), myRaw = useMotionValue(0);
  const mx = useSpring(mxRaw, { stiffness: 40, damping: 18 });
  const my = useSpring(myRaw, { stiffness: 40, damping: 18 });

  useEffect(() => {
    if (!enabled) return;
    const onResize = () => setVh(window.innerHeight);
    const onMove = (e: MouseEvent) => {
      mxRaw.set(e.clientX / window.innerWidth - 0.5);
      myRaw.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => { window.removeEventListener('resize', onResize); window.removeEventListener('mousemove', onMove); };
  }, [enabled, mxRaw, myRaw]);

  if (!enabled) return null;
  return (
    <motion.div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[5] overflow-hidden" style={{ opacity: layerOpacity }}>
      {BEANS.map((b, i) => <FloatingBean key={i} b={b} i={i} scrollY={scrollY} vh={vh} mx={mx} my={my} />)}
    </motion.div>
  );
}
