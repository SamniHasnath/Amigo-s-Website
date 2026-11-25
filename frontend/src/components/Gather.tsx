// Section 5 — Moments at Amigo's: authentic café moments and dishes.
import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { imageSrc } from '@/lib/api';
import { useSettings } from '@/store';
import type { GalleryPhoto } from '@/types';
import { Reveal } from './ui';

const LatteArt = lazy(() => import('./LatteArt'));

function Photo({ shot, className = '', ratio = 'aspect-[4/5]', delay = 0 }: { shot: GalleryPhoto; className?: string; ratio?: string; delay?: number }) {
  return (
    <motion.figure
      className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-espresso ${className}`}
      initial={{ clipPath: 'inset(14% 14% 14% 14% round 20px)', opacity: 0 }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0% round 20px)', opacity: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <img
        src={imageSrc(shot.src)}
        alt={shot.alt}
        loading="lazy"
        className={`${ratio} h-full w-full object-cover transition duration-700 group-hover:scale-105`}
      />
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 pb-2.5 pt-8 sm:px-4 sm:pb-3 sm:pt-10 text-xs sm:text-sm text-white opacity-90 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition duration-300">
        <span className="line-clamp-2">{shot.caption || shot.alt}</span>
      </figcaption>
    </motion.figure>
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

export default function Gather() {
  const photos = useSettings((s) => s.settings.gallery) ?? [];
  const latte = useSettings((s) => s.settings.showLatteArt) ?? true;
  const blocks = layout(photos.slice(0, 12), latte);
  return (
    <section id="gather" className="relative py-16 sm:py-24 lg:py-28">
      <div className="container-x">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
          <div>
            <Reveal><p className="eyebrow mb-2 sm:mb-4">Moments at Amigo's</p></Reveal>
            <Reveal delay={0.1}><h2 className="h2">Good plates, cold drinks, and sunny days in Trinco.</h2></Reveal>
          </div>
          <Reveal delay={0.2}>
            <p className="max-w-md text-base sm:text-lg text-crema-200 lg:ml-auto">
              A glimpse of daily life at our café — fresh rosettas poured at the coffee bar, chilled coolers after the beach, and warm comfort food straight from our kitchen.
            </p>
          </Reveal>
        </div>

        {blocks.length > 0 && (
          <div className="mt-8 sm:mt-14 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-12 md:gap-5">
            {blocks.map((b, i) => b.kind === 'latte'
              ? <div key="latte" className={b.cls}><Suspense fallback={<div className="aspect-[4/3] rounded-2xl sm:rounded-3xl bg-espresso" />}><LatteArt /></Suspense></div>
              : <Photo key={`${i}-${b.shot.src.slice(-40)}`} shot={b.shot} className={b.cls} ratio={b.ratio} delay={(i % 3) * 0.1} />)}
          </div>
        )}
        {photos.length > 0 && <p className="mt-5 sm:mt-6 text-xs text-crema-400">Real snapshots from our counter and tables at 280 Main Street, Trincomalee.</p>}
      </div>
    </section>
  );
}
