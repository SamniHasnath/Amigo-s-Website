// Site footer: a call-to-action band, live opening status, quick links, tap-to-copy address,
// social buttons and a back-to-top button that fills up as you scroll.
import { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import Logo from './Logo';
import { useSettings, useToast } from '@/store';
import { hoursLabel, isOpenNow, shortTime, sriLankaNow, telHref, toMin } from '@/lib/hours';
import type { CafeSettings } from '@/types';
import { HAS_ADMIN } from '@/lib/staffPanelLoader';

const LINKS = [
  ['Our story', '#experience'],
  ['Full menu', '#menu'],
  ['Favourites', '#favourites'],
  ['Gallery', '#gather'],
  ['Find us', '#visit'],
  ['Book a table', '#reserve'],
] as const;

/** "Closes in 2 h 15 min" / "Opens at 11 AM", refreshed every minute. */
function useLiveStatus(s: CafeSettings) {
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 60000); return () => clearInterval(t); }, []);
  const open = isOpenNow(s);
  const n = sriLankaNow();
  const now = n.getHours() * 60 + n.getMinutes();
  if (open) {
    const left = toMin(s.closeTime) - now;
    const h = Math.floor(left / 60), m = left % 60;
    return { open, text: left <= 60 ? `Closing soon · ${m || 60} min left` : `Closes in ${h} h${m ? ` ${m} min` : ''}` };
  }
  const closedToday = s.closedDays.includes(n.getDay());
  const later = !closedToday && now < toMin(s.openTime);
  return { open, text: later ? `Opens today at ${shortTime(s.openTime)}` : `Opens at ${shortTime(s.openTime)}` };
}

const item = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }),
};

function Social({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <motion.a href={href} target="_blank" rel="noreferrer" aria-label={label}
      whileHover={{ y: -4, rotate: -6 }} whileTap={{ scale: 0.9 }}
      className="grid h-11 w-11 place-items-center rounded-full border border-crema/15 text-crema-200 transition-colors hover:border-caramel hover:bg-caramel hover:text-espresso">
      {children}
    </motion.a>
  );
}

function BackToTop() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  return (
    <motion.button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      whileHover={{ y: -4 }} whileTap={{ scale: 0.9 }} aria-label="Back to top"
      className="group relative grid h-14 w-14 shrink-0 place-items-center rounded-full text-crema">
      <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="28" cy="28" r="26" fill="none" stroke="currentColor" strokeOpacity=".15" strokeWidth="2" />
        <motion.circle cx="28" cy="28" r="26" fill="none" stroke="rgb(var(--accent))" strokeWidth="2.5" strokeLinecap="round" style={{ pathLength: progress }} />
      </svg>
      <svg viewBox="0 0 24 24" className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
    </motion.button>
  );
}

export default function Footer() {
  const s = useSettings((st) => st.settings);
  const toast = useToast((t) => t.show);
  const status = useLiveStatus(s);

  const copyAddress = async () => {
    try { await navigator.clipboard.writeText(s.address); toast('Address copied'); }
    catch { toast(s.address); }
  };

  return (
    <footer className="theme-dark relative overflow-hidden bg-espresso-800 pb-safe">
      {/* soft glow behind the call to action */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[min(900px,120vw)] -translate-x-1/2 rounded-full bg-caramel/10 blur-3xl" aria-hidden="true" />

      {/* Call to action */}
      <div className="container-x relative pt-14 sm:pt-20">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} custom={0} variants={item}
          className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-crema/10 bg-espresso/60 p-6 sm:p-8 md:flex-row md:items-center">
          <div>
            <p className="font-script text-2xl text-caramel">Hungry yet?</p>
            <h2 className="mt-1 font-display text-2xl font-semibold leading-tight text-crema sm:text-3xl">Order ahead or save a table.</h2>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <a href="#menu" className="btn-gold w-full text-center sm:w-auto">Order now</a>
            {s.reservationsEnabled !== false && <a href="#reserve" className="btn-ghost w-full text-center sm:w-auto">Book a table</a>}
          </div>
        </motion.div>
      </div>

      {/* Columns */}
      <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }}
        className="container-x relative grid gap-10 py-12 sm:grid-cols-2 sm:py-14 lg:grid-cols-[1.3fr_1fr_1.1fr_1.1fr] lg:gap-8">
        {/* Brand */}
        <motion.div custom={1} variants={item}>
          <a href="#hero" aria-label="Back to the top" className="inline-block transition-transform hover:-rotate-2 hover:scale-[1.03]">
            <Logo className="text-5xl sm:text-6xl" sub />
          </a>
          <p className="mt-3 max-w-xs text-sm text-crema-400">{s.tagline}</p>
          <div className="mt-5 flex gap-2.5">
            {s.instagram && (
              <Social href={s.instagram} label="Instagram">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
              </Social>
            )}
            {s.tiktok && (
              <Social href={s.tiktok} label="TikTok">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M16.6 3c.4 2.3 1.8 3.9 4.1 4.1v3.2a7.5 7.5 0 0 1-4-1.3v6.3a5.8 5.8 0 1 1-5.8-5.8c.3 0 .6 0 .9.1v3.3a2.6 2.6 0 1 0 1.8 2.4V3h3z" /></svg>
              </Social>
            )}
            {s.mapsUrl && (
              <Social href={s.mapsUrl} label="Google Maps">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></svg>
              </Social>
            )}
          </div>
        </motion.div>

        {/* Explore */}
        <motion.nav custom={2} variants={item} aria-label="Footer">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-crema-400">Explore</h3>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-1">
            {LINKS.map(([label, href]) => (
              <li key={href}>
                <a href={href} className="group inline-flex items-center py-1.5 text-sm text-crema-200 transition-colors hover:text-caramel">
                  <span className="mr-0 h-px w-0 bg-caramel transition-all duration-300 group-hover:mr-2 group-hover:w-4" />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </motion.nav>

        {/* Visit */}
        <motion.div custom={3} variants={item}>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-crema-400">Visit</h3>
          <button type="button" onClick={copyAddress} title="Copy address"
            className="group mt-4 flex items-start gap-2 text-left text-sm text-crema-200 transition-colors hover:text-caramel">
            <span>{s.address}</span>
            <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 opacity-50 transition-opacity group-hover:opacity-100" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
          </button>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={telHref(s.phone)} className="chip inline-flex items-center gap-1.5 text-crema-200">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></svg>
              {s.phone}
            </a>
            {s.mapsUrl && <a href={s.mapsUrl} target="_blank" rel="noreferrer" className="chip inline-flex items-center text-crema-200">Directions ↗</a>}
          </div>
        </motion.div>

        {/* Hours (live) */}
        <motion.div custom={4} variants={item}>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-crema-400">Hours</h3>
          <div className="mt-4 rounded-2xl border border-crema/10 bg-espresso/50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-crema">
              <span className="relative flex h-2.5 w-2.5">
                {status.open && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-60" />}
                <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${status.open ? 'bg-mint' : 'bg-crema-400'}`} />
              </span>
              {status.open ? 'Open now' : 'Closed right now'}
            </p>
            <p className="mt-1 text-xs text-crema-400">{status.text}</p>
            <p className="mt-3 border-t border-crema/10 pt-3 text-sm text-crema-200">{hoursLabel(s)}</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom bar: copyright, credits, back to top */}
      <div className="container-x relative flex flex-col items-center gap-6 border-t border-crema/10 py-8 text-center md:flex-row md:justify-between md:text-left">
        <div className="text-xs text-crema-400 sm:text-sm">
          <p>© {new Date().getFullYear()} {s.cafeName}. All rights reserved.</p>
          {HAS_ADMIN && <a href="#admin" className="mt-1 inline-block transition-colors hover:text-caramel">Staff login</a>}
        </div>

        <div className="flex flex-col items-center gap-2.5">
          <p className="text-xs font-medium text-crema-200">Designed &amp; developed by</p>
          <a href="https://neirahtech.com" target="_blank" rel="noreferrer" aria-label="Neirah Tech website"
            className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-2 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg active:scale-95">
            <img src="/neirah-logo-footer.jpg" alt="neirah tech" width={570} height={362} loading="lazy" className="h-10 w-auto object-contain sm:h-11" />
          </a>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-crema-200">
            <a href="tel:+94760041594" className="transition-colors hover:text-caramel">+94 76 004 1594</a>
            <span className="text-crema-400" aria-hidden="true">·</span>
            <a href="mailto:info@neirahtech.com" className="transition-colors hover:text-caramel">info@neirahtech.com</a>
          </div>
        </div>

        <BackToTop />
      </div>
    </footer>
  );
}
