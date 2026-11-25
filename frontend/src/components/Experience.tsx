// Section 2 — The Amigo's Experience.
import { useEffect, useRef } from 'react';
import { useSettings } from '@/store';
import { Reveal } from './ui';

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
            <ExperienceVideo />
          </div>
        </Reveal>
        <div>
          <Reveal><p className="eyebrow mb-3 sm:mb-4">About our café</p></Reveal>
          <Reveal delay={0.1}><h2 className="h2">A relaxed corner on Main Street for great coffee and honest food.</h2></Reveal>
          <Reveal delay={0.2}>
            <p className="mt-4 sm:mt-5 max-w-lg text-base sm:text-lg text-crema-200">
              Proper espresso, honest comfort food and a cool place to unwind - whether you're back from the beach or sitting down for dinner.
            </p>
          </Reveal>
          <div className="mt-6 sm:mt-8 grid gap-3 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3 lg:gap-4">
            {PILLARS.map((p, i) => (
              <Reveal key={p.t} delay={0.25 + i * 0.1}>
                <div className="glass flex h-full items-start gap-3.5 p-4 sm:block md:flex lg:block xl:p-5">
                  <span className="font-display text-2xl leading-none text-caramel sm:text-3xl md:text-2xl lg:text-3xl">{i + 1}</span>
                  <div className="min-w-0">
                    <h3 className="font-display text-lg leading-snug sm:mt-2 md:mt-0 lg:mt-2 xl:text-xl">{p.t}</h3>
                    <p className="mt-1 text-sm text-crema-200">{p.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.4}><p className="mt-5 sm:mt-6 text-xs sm:text-sm text-crema-400">{tagline}</p></Reveal>
        </div>
      </div>
    </section>
  );
}
