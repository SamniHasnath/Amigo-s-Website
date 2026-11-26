// Section 2 — The Amigo's Experience.
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '@/store';
import { AnimatedHeading, Eyebrow, Parallax, Reveal } from './ui';

const PILLARS = [
  { t: 'Proper espresso', d: 'Fresh shots, Spanish lattes and velvety flat whites.' },
  { t: 'Cooked to order', d: 'Creamy pastas, toasted paninis and devilled wraps.' },
  { t: 'An easygoing space', d: 'Cool air, relaxed music and no rush to leave.' },
];

/** Looping film beside the text; it only plays while on screen (and not at all with reduced motion). */
function ExperienceVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { v.pause(); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    }, { threshold: 0.15 });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <video
      ref={ref}
      src="/video/experience.mp4"
      className="h-full w-full object-cover"
      muted
      loop
      playsInline
      autoPlay
      preload="metadata"
      aria-hidden="true"
    />
  );
}

export default function Experience() {
  const tagline = useSettings((s) => s.settings.tagline);

  return (
    <section id="experience" className="relative py-16 sm:py-24 lg:py-28">
      <div className="container-x grid items-center gap-8 md:grid-cols-2 md:gap-10 lg:grid-cols-[5fr_7fr] lg:gap-14">
        <Reveal>
          <div className="mx-auto aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-2xl sm:aspect-[16/10] md:aspect-[4/5] md:max-h-[calc(100svh-140px)] md:rounded-[32px]">
            <Parallax amount={36}><ExperienceVideo /></Parallax>
          </div>
        </Reveal>
        <div>
          <Eyebrow className="mb-3 sm:mb-4">About our café</Eyebrow>
          <AnimatedHeading className="h2" text="A relaxed corner on Main Street for great coffee and honest food." highlight="great coffee and honest food." />
          <Reveal delay={0.2}>
            <p className="mt-4 sm:mt-5 max-w-lg text-base sm:text-lg text-crema-200">
              Proper espresso, honest comfort food and a cool place to unwind - whether you're back from the beach or sitting down for dinner.
            </p>
          </Reveal>
          {/* The three cards deal in one after another once the row scrolls into view */}
          <motion.div
            className="mt-6 sm:mt-8 grid gap-3 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3 lg:gap-4 [perspective:1000px]"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.35 }}
            transition={{ staggerChildren: 0.25, delayChildren: 0.1 }}
          >
            {PILLARS.map((p, i) => (
              <motion.div
                key={p.t}
                variants={{
                  hidden: { opacity: 0, y: 60, rotateX: -25, scale: 0.92 },
                  show: { opacity: 1, y: 0, rotateX: 0, scale: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
                }}
                style={{ transformOrigin: 'top center' }}
              >
                <div className="glass flex h-full items-start gap-3.5 p-4 transition duration-300 hover:-translate-y-1 hover:shadow-glow-sm sm:block md:flex lg:block xl:p-5">
                  {/* the number pops in just after its card lands */}
                  <motion.span
                    className="inline-block font-display text-2xl leading-none text-caramel sm:text-3xl md:text-2xl lg:text-3xl"
                    variants={{
                      hidden: { opacity: 0, scale: 0.3 },
                      show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 420, damping: 14, delay: 0.35 } },
                    }}
                  >
                    {i + 1}
                  </motion.span>
                  <div className="min-w-0">
                    <h3 className="font-display text-lg leading-snug sm:mt-2 md:mt-0 lg:mt-2 xl:text-xl">{p.t}</h3>
                    <p className="mt-1 text-sm text-crema-200">{p.d}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
          <Reveal delay={0.4}><p className="mt-5 sm:mt-6 text-xs sm:text-sm text-crema-400">{tagline}</p></Reveal>
        </div>
      </div>
    </section>
  );
}
