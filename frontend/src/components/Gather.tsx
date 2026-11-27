// Section 5 — Moments at Amigo's: authentic café moments and dishes.
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { imageSrc } from '@/lib/api';
import { useSettings } from '@/store';
import type { GalleryPhoto } from '@/types';
import { AnimatedHeading, Eyebrow, Parallax, Reveal } from './ui';
import { href } from '@/lib/router';

function Photo({ shot, className = '', ratio = 'aspect-[4/5]', delay = 0, onOpen }: { shot: GalleryPhoto; className?: string; ratio?: string; delay?: number; onOpen: () => void }) {
  return (
    <motion.figure
      className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-espresso ${className}`}
      initial={{ clipPath: 'inset(14% 14% 14% 14% round 20px)', opacity: 0 }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0% round 20px)', opacity: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <button type="button" onClick={onOpen} aria-label={`Open photo: ${shot.caption || shot.alt}`} className="block h-full w-full cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-inset">
        <Parallax>
          <img
            src={imageSrc(shot.src)}
            alt={shot.alt}
            loading="lazy"
            className={`${ratio} h-full w-full object-cover transition duration-700 group-hover:scale-105`}
          />
        </Parallax>
      </button>
      {/* "expand" hint */}
      <span aria-hidden="true" className="pointer-events-none absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur transition duration-300 group-hover:opacity-100">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
      </span>
      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 pb-2.5 pt-8 sm:px-4 sm:pb-3 sm:pt-10 text-xs sm:text-sm text-white opacity-90 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition duration-300">
        <span className="line-clamp-2">{shot.caption || shot.alt}</span>
      </figcaption>
    </motion.figure>
  );
}

/** Full-screen photo viewer: arrows / swipe / ← → keys to browse, Esc or click outside to close. */
function Lightbox({ shots, index, onClose, onGo }: { shots: GalleryPhoto[]; index: number; onClose: () => void; onGo: (i: number) => void }) {
  const shot = shots[index];
  const dir = useRef(0);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const go = useCallback((d: number) => { dir.current = d; onGo((index + d + shots.length) % shots.length); }, [index, shots.length, onGo]);

  // on open: lock page scroll and move focus in; on close: restore both
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    closeBtn.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; prevFocus?.focus(); };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      className="theme-dark fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-md sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
    >
      <button ref={closeBtn} onClick={onClose} aria-label="Close photo viewer" className="absolute right-3 top-3 sm:right-6 sm:top-6 z-10 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/10 text-white transition hover:border-caramel hover:text-caramel">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>

      <div className="relative flex w-full max-w-5xl flex-1 items-center justify-center overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <AnimatePresence mode="popLayout" initial={false} custom={dir.current}>
          <motion.img
            key={shot.src}
            src={imageSrc(shot.src)}
            alt={shot.alt}
            custom={dir.current}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 80, scale: d ? 1 : 0.9 }),
              center: { opacity: 1, x: 0, scale: 1 },
              exit: (d: number) => ({ opacity: 0, x: d * -80 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            drag={shots.length > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.4}
            onDragEnd={(_, info) => { if (Math.abs(info.offset.x) > 60) go(info.offset.x < 0 ? 1 : -1); }}
            className="max-h-[calc(100svh-160px)] max-w-full cursor-grab touch-pan-y select-none rounded-2xl object-contain shadow-2xl active:cursor-grabbing"
            draggable={false}
          />
        </AnimatePresence>
      </div>

      <div className="mt-4 flex w-full max-w-5xl items-center justify-between gap-3 text-white" onClick={(e) => e.stopPropagation()}>
        {shots.length > 1 && (
          <button onClick={() => go(-1)} aria-label="Previous photo" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 transition hover:border-caramel hover:text-caramel active:scale-90">←</button>
        )}
        <p className="flex-1 text-center text-sm text-crema-200">
          {shot.caption || shot.alt}
          <span className="ml-2 text-crema-400">{index + 1} / {shots.length}</span>
        </p>
        {shots.length > 1 && (
          <button onClick={() => go(1)} aria-label="Next photo" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 transition hover:border-caramel hover:text-caramel active:scale-90">→</button>
        )}
      </div>
    </motion.div>,
    document.body,
  );
}

// The gallery is laid out in groups of five photos (an editorial, asymmetric pattern),
// then a final row with the latte-art toy between two photos, then any photos left over.
type Block = { kind: 'photo'; shot: GalleryPhoto; cls: string; ratio: string } | { kind: 'latte'; cls: string };
const GROUP: { cls: string; ratio: string }[] = [
  { cls: 'col-span-1 md:col-span-4 md:row-span-2', ratio: 'aspect-[3/4] md:aspect-auto' },
  { cls: 'col-span-1 md:col-span-5', ratio: 'aspect-[3/4] md:aspect-[4/3]' },
  { cls: 'col-span-1 md:col-span-3', ratio: 'aspect-[4/5] md:aspect-[3/4]' },
  { cls: 'col-span-1 md:col-span-3', ratio: 'aspect-[4/5] md:aspect-[3/4]' },
  { cls: 'col-span-2 md:col-span-5', ratio: 'aspect-[16/10]' },
];
const SPAN: Record<number, string> = { 3: 'md:col-span-3', 4: 'md:col-span-4', 5: 'md:col-span-5', 6: 'md:col-span-6', 7: 'md:col-span-7', 12: 'md:col-span-12' };
const RATIO: Record<number, string> = { 3: 'md:aspect-[3/4]', 4: 'md:aspect-[3/4]', 5: 'md:aspect-[4/5]', 6: 'md:aspect-[4/3]', 7: 'md:aspect-[4/3]', 12: 'md:aspect-[21/9]' };
const LG_SPAN: Record<number, string> = { 3: 'lg:col-span-3', 4: 'lg:col-span-4', 5: 'lg:col-span-5', 7: 'lg:col-span-7', 12: 'lg:col-span-12' };
const LG_RATIO: Record<number, string> = { 3: 'lg:aspect-[3/4]', 4: 'lg:aspect-[3/4]', 7: 'lg:aspect-[4/3]' };
/** Column widths (out of 12) for a row of n photos with no latte toy */
const ROW: Record<number, number[]> = { 1: [12], 2: [6, 6], 3: [4, 4, 4], 4: [3, 3, 3, 3] };

function layout(photos: GalleryPhoto[], latte: boolean): Block[] {
  const full = Math.floor(photos.length / 5) * 5;
  const out: Block[] = photos.slice(0, full).map((shot, i) => ({ kind: 'photo', shot, ...GROUP[i % 5] }));
  const rest = photos.slice(full);
  const tail: { shot: GalleryPhoto | null; span: number }[] = [];
  let r = [...rest];
  if (latte) {
    if (r.length >= 2) { tail.push({ shot: r[0], span: 3 }, { shot: null, span: 5 }, { shot: r[1], span: 4 }); r = r.slice(2); }
    else if (r.length === 1) { tail.push({ shot: null, span: 5 }, { shot: r[0], span: 7 }); r = []; }
    else tail.push({ shot: null, span: 12 });
  }
  if (r.length) ROW[r.length].forEach((span, i) => tail.push({ shot: r[i], span }));
  // phones use 2 columns: photos pair up, an odd last photo goes full width, toy goes last.
  // Tablets (md) are too narrow to squeeze the toy between photos, so there it gets its own
  // full-width row after the photos; it only sits between them from lg up.
  const tailPhotos = tail.filter((t) => t.shot).length;
  const latteRow = latte ? tail.slice(0, rest.length >= 2 ? 3 : rest.length === 1 ? 2 : 1) : [];
  const latteRowPhotos = latteRow.filter((t) => t.shot).length;
  let seen = 0;
  for (const t of tail) {
    if (!t.shot) { out.push({ kind: 'latte', cls: `col-span-2 order-last md:col-span-12 lg:order-none ${LG_SPAN[t.span]}` }); continue; }
    seen++;
    const alone = seen === tailPhotos && tailPhotos % 2 === 1;
    const phone = `${alone ? 'col-span-2' : 'col-span-1'}`;
    const phoneRatio = alone ? 'aspect-[16/10]' : 'aspect-[4/5]';
    if (latteRow.includes(t)) {
      // in the toy's row: halves (or full width) on tablets, the editorial spans on desktop
      const md = latteRowPhotos === 2 ? 'md:col-span-6 md:aspect-[4/5]' : 'md:col-span-12 md:aspect-[21/9]';
      out.push({ kind: 'photo', shot: t.shot, cls: `${phone} ${md} ${LG_SPAN[t.span]}`, ratio: `${phoneRatio} ${md.split(' ')[1]} ${LG_RATIO[t.span]}` });
    } else {
      out.push({ kind: 'photo', shot: t.shot, cls: `${phone} ${SPAN[t.span]}`, ratio: `${phoneRatio} ${RATIO[t.span]}` });
    }
  }
  return out;
}

/** Photos shown in the home-page preview: one full editorial group. */
const PREVIEW_COUNT = 5;

/** The photo gallery. `preview` = the short version on the home page: the first few photos
 *  and a button to the full Gallery page. */
export default function Gather({ preview = false }: { preview?: boolean }) {
  const photos = useSettings((s) => s.settings.gallery) ?? [];
  // the latte-art toy now lives on the Home page (LatteCorner), so the gallery is photos only
  const blocks = layout(photos.slice(0, preview ? PREVIEW_COUNT : 12), false);
  // photos in the order they appear on the page, for browsing in the viewer
  const shots = blocks.flatMap((b) => (b.kind === 'photo' ? [b.shot] : []));
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  return (
    <section id="gather" className="relative py-16 sm:py-24 lg:py-28">
      <div className="container-x">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
          <div>
            <Eyebrow className="mb-2 sm:mb-4">Moments at Amigo's</Eyebrow>
            <AnimatedHeading className="h2" text="Good plates, cold drinks, and sunny days in Trinco." highlight="sunny days in Trinco." />
          </div>
          <Reveal delay={0.2}>
            <p className="max-w-md text-base sm:text-lg text-crema-200 lg:ml-auto">
              A glimpse of daily life at our café — fresh rosettas poured at the coffee bar, chilled coolers after the beach, and warm comfort food straight from our kitchen.
            </p>
          </Reveal>
        </div>

        {blocks.length > 0 && (
          <div className="mt-8 sm:mt-14 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-12 md:gap-5">
            {blocks.map((b, i) => b.kind === 'latte' ? null
              : <Photo key={`${i}-${b.shot.src.slice(-40)}`} shot={b.shot} className={b.cls} ratio={b.ratio} delay={(i % 3) * 0.1} onOpen={() => setOpen(shots.indexOf(b.shot))} />)}
          </div>
        )}
        <AnimatePresence>
          {open !== null && shots[open] && <Lightbox shots={shots} index={open} onClose={close} onGo={setOpen} />}
        </AnimatePresence>
        {preview ? (
          photos.length > 0 && (
            <div className="mt-8 sm:mt-10 flex flex-col items-center gap-2 text-center">
              <a href={href('gallery')} className="btn-gold w-full sm:w-auto">See all photos →</a>
              {photos.length > PREVIEW_COUNT && <p className="text-xs text-crema-400">{Math.min(photos.length, 12)} photos from our counter and tables</p>}
            </div>
          )
        ) : (
          photos.length > 0 && <p className="mt-5 sm:mt-6 text-xs text-crema-400">Real snapshots from our counter and tables at 280 Main Street, Trincomalee.</p>
        )}
      </div>
    </section>
  );
}
