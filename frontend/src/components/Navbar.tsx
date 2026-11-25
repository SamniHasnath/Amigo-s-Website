import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import { cartCount, useCart, useSettings } from '@/store';
import { isOpenNow, shortTime, telHref } from '@/lib/hours';
import { HAS_ADMIN } from '@/lib/staffPanelLoader';

const LINKS = [
  ['Experience', '#experience'],
  ['Menu', '#menu'],
  ['Favourites', '#favourites'],
  ['Gallery', '#gather'],
  ['Visit', '#visit'],
  ['Reserve', '#reserve'],
];

export default function Navbar() {
  const count = useCart((s) => cartCount(s.lines));
  const setOpen = useCart((s) => s.setOpen);
  const [scrolled, setScrolled] = useState(false);
  const settings = useSettings((s) => s.settings);
  const [open, setOpenNow] = useState(isOpenNow(settings));
  const [menu, setMenu] = useState(false);

  /** Phone menu links: close the menu (which unlocks page scrolling) first, then scroll to the section.
   *  A plain #link would try to jump while scrolling is still locked, so nothing would move. */
  const goTo = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault();
    setMenu(false);
    document.body.style.overflow = '';
    requestAnimationFrame(() => {
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', hash);
    });
  };

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 30);
    on();
    window.addEventListener('scroll', on, { passive: true });
    setOpenNow(isOpenNow(settings));
    const t = setInterval(() => setOpenNow(isOpenNow(settings)), 60000);
    return () => { window.removeEventListener('scroll', on); clearInterval(t); };
  }, [settings]);

  // Lock body scroll on small devices when mobile menu is open
  useEffect(() => {
    if (menu) {
      document.body.style.overflow = 'hidden';
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false); };
      window.addEventListener('keydown', onKey);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', onKey);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [menu]);

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || menu
          ? 'border-b border-crema/10 bg-espresso/90 backdrop-blur-xl shadow-lg'
          : 'bg-gradient-to-b from-espresso/80 via-espresso/40 to-transparent'
      }`}
    >
      {settings.announcementEnabled && settings.announcementText && (
        <div className="bg-caramel px-4 py-1.5 text-center text-xs sm:text-sm font-semibold text-espresso" role="status">
          {settings.announcementText}
        </div>
      )}
      <nav className="container-x flex h-16 sm:h-[72px] items-center justify-between gap-2 sm:gap-4" aria-label="Main">
        <a href="#hero" aria-label="Amigo's Cafe, back to top" className="shrink-0 flex items-center gap-2">
          <Logo className="text-[24px] sm:text-[28px]" />
          {/* Subtle mobile open badge dot */}
          <span
            className={`inline-block h-2 w-2 rounded-full sm:hidden ${open ? 'bg-mint' : 'bg-crema-400'}`}
            title={open ? 'Open now' : 'Closed now'}
            aria-hidden="true"
          />
        </a>

        {/* Desktop navigation links */}
        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map(([l, h]) => (
            <li key={h}>
              <a href={h} className="rounded-full px-4 py-2 text-sm text-crema-200 transition hover:text-caramel">
                {l}
              </a>
            </li>
          ))}
        </ul>

        {/* Action buttons (Theme, Open Status, Cart, Mobile Toggle) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle className="h-10 w-10 sm:h-11 sm:w-11" />

          {/* Desktop opening hours pill */}
          <span className="hidden items-center gap-2 rounded-full border border-crema/15 px-3 py-1.5 text-xs sm:inline-flex">
            <span className={`h-2 w-2 rounded-full ${open ? 'bg-mint shadow-[0_0_0_4px_rgba(127,200,169,.2)]' : 'bg-crema-400'}`} />
            {open ? `Open · until ${shortTime(settings.closeTime)}` : `Closed · opens ${shortTime(settings.openTime)}`}
          </span>

          {/* Order / Cart button */}
          <button
            id="cart-button"
            onClick={() => setOpen(true)}
            className="relative inline-flex h-10 sm:h-11 items-center gap-1.5 sm:gap-2 rounded-full bg-crema px-3 sm:px-4 text-xs sm:text-sm font-semibold text-espresso transition hover:bg-caramel active:scale-95"
            aria-label={`Open your order, ${count} items`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 7h12l-1 13H7z" />
              <path d="M9 7a3 3 0 0 1 6 0" />
            </svg>
            <span className="hidden xs:inline sm:inline">Order</span>
            {count > 0 && (
              <span className="grid h-5 min-w-5 sm:h-6 sm:min-w-6 place-items-center rounded-full bg-espresso px-1 text-[11px] sm:text-xs font-bold text-caramel">
                {count}
              </span>
            )}
          </button>

          {/* Mobile hamburger button */}
          <button
            className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-full border border-crema/20 active:scale-95 lg:hidden"
            onClick={() => setMenu(!menu)}
            aria-expanded={menu}
            aria-label={menu ? 'Close navigation menu' : 'Open navigation menu'}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              {menu ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile navigation dropdown drawer */}
      <AnimatePresence>
        {menu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="border-t border-crema/10 bg-espresso-800/95 backdrop-blur-2xl lg:hidden max-h-[calc(100vh-80px)] overflow-y-auto"
          >
            <div className="container-x py-5 flex flex-col gap-4">
              {/* Status banner on mobile */}
              <div className="flex items-center justify-between rounded-2xl border border-crema/15 bg-espresso/60 p-3.5">
                <div className="flex items-center gap-2.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${open ? 'bg-mint shadow-[0_0_0_4px_rgba(127,200,169,.25)]' : 'bg-crema-400'}`} />
                  <div>
                    <p className="text-sm font-semibold">{open ? 'Open today' : 'Closed right now'}</p>
                    <p className="text-xs text-crema-400">
                      {shortTime(settings.openTime)} – {shortTime(settings.closeTime)} · Main St, Trincomalee
                    </p>
                  </div>
                </div>
                <a href={telHref(settings.phone)} className="rounded-full bg-caramel/15 px-3 py-1.5 text-xs font-semibold text-caramel">
                  Call
                </a>
              </div>

              {/* Navigation links */}
              <ul className="grid gap-1">
                {LINKS.map(([l, h]) => (
                  <li key={h}>
                    <a
                      href={h}
                      onClick={(e) => goTo(e, h)}
                      className="flex items-center justify-between rounded-xl px-3.5 py-3 text-lg font-display text-crema transition hover:bg-caramel/10 hover:text-caramel active:bg-caramel/20"
                    >
                      <span>{l}</span>
                      <span className="text-sm text-crema-400">→</span>
                    </a>
                  </li>
                ))}
              </ul>

              {/* Quick actions footer */}
              <div className="mt-2 border-t border-crema/10 pt-4 flex items-center justify-between text-sm">
                {HAS_ADMIN ? (
                  <a
                    href="#admin"
                    onClick={() => setMenu(false)}
                    className="rounded-lg px-3 py-2 text-crema-400 hover:text-caramel"
                  >
                    Staff login
                  </a>
                ) : <span />}
                <a
                  href={settings.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-caramel"
                >
                  Get directions ↗
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
