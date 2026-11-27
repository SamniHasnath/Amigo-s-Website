// Home page: the "pour your own latte art" toy, in its own section.
// Staff can still switch it off in the admin settings (showLatteArt).
import { lazy, Suspense } from 'react';
import { useSettings } from '@/store';
import { AnimatedHeading, Eyebrow, Reveal } from './ui';

const LatteArt = lazy(() => import('./LatteArt'));

export default function LatteCorner() {
  const show = useSettings((s) => s.settings.showLatteArt) ?? true;
  if (!show) return null;
  return (
    <section id="latte-art" className="relative py-16 sm:py-24 lg:py-28">
      <div className="container-x">
        <Eyebrow className="mb-2 sm:mb-4">A little fun while you wait</Eyebrow>
        <AnimatedHeading className="h2 max-w-2xl" text="Play barista for a moment." highlight="barista" />
        <Reveal delay={0.15} className="mt-8 sm:mt-12">
          <Suspense fallback={<div className="h-[420px] rounded-2xl sm:h-[340px] sm:rounded-3xl bg-espresso" />}>
            <LatteArt wide />
          </Suspense>
        </Reveal>
      </div>
    </section>
  );
}
