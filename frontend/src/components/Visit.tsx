import { useSettings } from '@/store';
import { hoursLabel, telHref } from '@/lib/hours';
import { Reveal } from './ui';
import GoogleMapCard from './GoogleMapCard';

export default function Visit() {
  const s = useSettings((st) => st.settings);
  return (
    <section id="visit" className="relative bg-espresso py-16 sm:py-24 lg:py-28">
      <div className="container-x grid items-center gap-8 sm:gap-12 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <Reveal><p className="eyebrow mb-2 sm:mb-4">Drop by</p></Reveal>
          <Reveal delay={0.1}><h2 className="h2">Come say hi at 280 Main Street.</h2></Reveal>
          <Reveal delay={0.2}>
            <p className="mt-4 text-base sm:text-lg text-crema-200">
              Conveniently located on Main Street in Trincomalee, just a short ride from Dutch Bay and the town center. Perfect for your morning coffee run, escaping the afternoon sun, or unwinding over dinner.
            </p>
            <dl className="mt-6 sm:mt-8 grid gap-4 sm:gap-5 text-base sm:text-lg">
              <div><dt className="text-xs sm:text-sm text-crema-400">Address</dt><dd className="font-medium text-crema">{s.address}</dd></div>
              {s.email && <div><dt className="text-xs sm:text-sm text-crema-400">Email</dt><dd><a className="font-medium text-crema hover:text-caramel transition underline decoration-crema/30" href={`mailto:${s.email}`}>{s.email}</a></dd></div>}
              <div><dt className="text-xs sm:text-sm text-crema-400">Opening hours</dt><dd className="font-medium text-crema">{hoursLabel(s)}</dd></div>
              <div><dt className="text-xs sm:text-sm text-crema-400">Call the café</dt><dd><a className="font-medium text-caramel hover:underline" href={telHref(s.phone)}>{s.phone}</a></dd></div>
            </dl>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3">
              <a className="btn-gold w-full sm:w-auto text-center" href={s.mapsUrl} target="_blank" rel="noreferrer">Get directions</a>
              {s.instagram && <a className="btn-ghost w-full sm:w-auto text-center" href={s.instagram} target="_blank" rel="noreferrer">Instagram</a>}
              {s.tiktok && <a className="btn-ghost w-full sm:w-auto text-center" href={s.tiktok} target="_blank" rel="noreferrer">TikTok</a>}
            </div>
          </Reveal>
        </div>

        {/* Realistic Interactive Google Maps Card */}
        <Reveal delay={0.15}>
          <div className="relative">
            <GoogleMapCard />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
