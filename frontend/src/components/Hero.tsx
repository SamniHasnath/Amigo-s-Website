import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '@/store';
import { shortTime } from '@/lib/hours';
import { Stars } from './ui';
import HeroVideo from './HeroVideo';

const word = { hidden: { y: '110%' }, show: (i: number) => ({ y: 0, transition: { delay: 0.3 + i * 0.12, duration: 0.9, ease: [0.22, 1, 0.36, 1] } }) };

export default function Hero() {
  const s = useSettings((st) => st.settings);
  const lines = ['Good coffee.', 'Hearty food.', 'Better with friends.'];
  const street = s.address.replace(/\s*\d{5}$/, '');
  const ref = useRef<HTMLElement>(null);

  return (
    <section ref={ref} id="hero" className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden pb-10 sm:pb-14 pt-20 sm:pt-28 lg:justify-center lg:pb-12 lg:pt-28">
      <HeroVideo heroRef={ref} />
      {/* Scrim keeps the text readable over the film and the 3D scene */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-espresso-800 via-espresso-800/80 to-transparent lg:bg-gradient-to-r lg:from-espresso-800/95 lg:via-espresso-800/50 lg:to-transparent" aria-hidden="true" />
      <div className="container-x relative z-10">
        <div className="max-w-xl pt-[22vh] sm:pt-[28vh] lg:max-w-[min(38rem,46vw)] lg:pt-0">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-4 sm:mb-5 inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-caramel/30 bg-espresso-800/80 px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-caramel backdrop-blur">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></svg>
            <span className="truncate">{street}</span>
          </motion.p>
          <h1 className="font-display text-[clamp(34px,min(8.5vw,10.5svh),84px)] lg:text-[clamp(44px,min(5.6vw,10.5svh),84px)] font-bold leading-[0.98] sm:leading-[0.95] tracking-tight text-caramel">
            {lines.map((l, i) => (
              <span key={l} className="block overflow-hidden pb-1">
                <motion.span custom={i} variants={word} initial="hidden" animate="show" className={`block ${i === 2 ? 'font-medium italic text-crema' : ''}`}>{l}</motion.span>
              </span>
            ))}
          </h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.8 }} className="mt-4 sm:mt-5 max-w-md text-base sm:text-lg text-crema-200">
            Proper espresso, creamy pastas and spicy devilled wraps - made fresh every day.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05, duration: 0.8 }} className="mt-6 sm:mt-7 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <a href="#menu" className="btn-gold w-full sm:w-auto text-center">See the menu</a>
            <a href="#reserve" className="btn-ghost w-full sm:w-auto text-center">Book a table</a>
          </motion.div>
          <motion.dl initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }} className="mt-8 sm:mt-9 grid grid-cols-[auto_1fr_auto] gap-x-5 border-t border-crema/10 pt-4 sm:border-0 sm:pt-0 sm:flex sm:flex-wrap sm:gap-x-10 sm:gap-y-4 text-xs sm:text-sm text-crema-200">
            <div>
              <dt className="sr-only">Rating</dt>
              <dd className="font-display text-lg sm:text-2xl text-crema flex items-center gap-1">{s.rating} <span className="text-xs sm:text-base"><Stars /></span></dd>
              <dd className="text-[11px] sm:text-xs text-crema-400 truncate">{s.reviews} Google reviews</dd>
            </div>
            <div>
              <dt className="sr-only">Price</dt>
              <dd className="font-display whitespace-nowrap text-lg sm:text-2xl text-crema">{s.pricePerPerson}</dd>
              <dd className="text-[11px] sm:text-xs text-crema-400 truncate">average per person</dd>
            </div>
            <div>
              <dt className="sr-only">Hours</dt>
              <dd className="font-display text-lg sm:text-2xl text-crema truncate">{shortTime(s.openTime)}</dd>
              <dd className="text-[11px] sm:text-xs text-crema-400 truncate">until {shortTime(s.closeTime)}</dd>
            </div>
          </motion.dl>
        </div>
      </div>
      {/* Handwritten note */}
      <motion.p initial={{ opacity: 0, rotate: -12 }} animate={{ opacity: 1, rotate: -8 }} transition={{ delay: 1.6, duration: 0.8 }}
        className="pointer-events-none absolute right-[6%] top-[16%] hidden font-script text-4xl leading-tight text-crema-200 lg:block" aria-hidden="true">
        Right here on<br />Main Street :)
      </motion.p>
      <a href="#experience" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs text-crema-400 lg:flex [@media(max-height:719px)]:!hidden" aria-label="Scroll to learn more about Amigo's">
        Scroll
        <span className="relative h-10 w-6 rounded-full border border-crema/30">
          <motion.span animate={{ y: [4, 18, 4] }} transition={{ repeat: Infinity, duration: 1.8 }} className="absolute left-1/2 top-0 h-2 w-1 -translate-x-1/2 rounded-full bg-caramel" />
        </span>
      </a>
    </section>
  );
}
