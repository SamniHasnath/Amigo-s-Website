// Looping café film in the hero (cup of latte, croissant, falling beans). It sits in the open
// space beside the headline on large screens and in the band above it on phones, blends into
// the page with soft feathered edges, and fades out as you scroll — where the 3D cup takes over.
import { useEffect, useRef, useState, type RefObject } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { prefersReducedMotion } from '@/lib/webgl';

const BASE = import.meta.env.BASE_URL;

export default function HeroVideo({ heroRef }: { heroRef: RefObject<HTMLElement> }) {
  const vid = useRef<HTMLVideoElement>(null);
  const [still] = useState(prefersReducedMotion);
  const [small] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const opacity = useTransform(scrollYProgress, [0.32, 0.62], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '12%']);

  // only play while the hero is on screen (saves battery), and never with reduced motion
  useEffect(() => {
    const v = vid.current;
    if (!v || still) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => { /* autoplay blocked: the poster stays */ });
      else v.pause();
    }, { threshold: 0.05 });
    io.observe(v);
    return () => io.disconnect();
  }, [still]);

  return (
    <motion.div style={{ opacity }} aria-hidden="true"
      className="hero-video pointer-events-none absolute inset-x-0 top-0 h-[50svh] overflow-hidden lg:left-auto lg:right-0 lg:top-1/2 lg:mt-6 lg:aspect-video lg:h-auto lg:w-[64%] lg:max-w-[1100px] lg:-translate-y-1/2">
      <motion.div style={{ scale, y }} className="h-full w-full">
        {still ? (
          <img src={`${BASE}video/hero-poster.webp`} alt="" className="h-full w-full object-cover object-[60%_50%]" />
        ) : (
          <video ref={vid} className="h-full w-full object-cover object-[60%_50%]" muted loop playsInline autoPlay preload="auto"
            poster={`${BASE}video/hero-poster.webp`}>
            <source src={`${BASE}video/${small ? 'hero-960' : 'hero'}.mp4`} type="video/mp4" />
            <source src={`${BASE}video/${small ? 'hero-960' : 'hero'}.webm`} type="video/webm" />
          </video>
        )}
      </motion.div>
    </motion.div>
  );
}
