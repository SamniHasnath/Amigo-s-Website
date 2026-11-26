import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { hoursLabel, isOpenNow, telHref, timeSlots, to12h, todayISO } from '@/lib/hours';
import { DAY_NAMES } from '@/data/settings';
import { useCart, useSettings } from '@/store';
import type { Reservation } from '@/types';
import { AnimatedHeading, Eyebrow, Reveal, Spinner, Tilt } from './ui';

export default function Reserve() {
  const s = useSettings((st) => st.settings);
  const slots = timeSlots(s);
  const closedDay = s.closedDays.includes(new Date(todayISO() + 'T00:00:00Z').getUTCDay());
  const [f, setF] = useState({ name: '', phone: '', date: todayISO(), time: '', guests: 2, note: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState<Reservation | null>(null);
  const openCart = useCart((st) => st.setOpen);
  const count = useCart((st) => st.lines.reduce((n, l) => n + l.qty, 0));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try { setDone(await api.createReservation({ ...f, time: f.time || slots[Math.floor(slots.length * 0.66)] || s.openTime, note: f.note || undefined })); }
    catch (e2) { setErr((e2 as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <section id="reserve" className="relative bg-espresso-800 py-16 sm:py-24 lg:py-28">
      <div className="container-x grid items-center gap-8 sm:gap-12 lg:grid-cols-2">
        <div>
          <Eyebrow className="mb-2 sm:mb-4">Tables & Takeaway</Eyebrow>
          <AnimatedHeading className="h2" text="Drop in, order ahead, or book a table." highlight="book a table." />
          <Reveal delay={0.2}>
            <p className="mt-4 sm:mt-6 max-w-md text-base sm:text-lg text-crema-200">
              Planning lunch with family, dinner with friends, or picking up breakfast on your way to the beach? Order online for quick counter pickup, or let us know when to expect you.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="mt-6 sm:mt-8 rounded-2xl sm:rounded-3xl border border-crema/10 bg-espresso/60 p-5 sm:p-6">
              <p className="flex items-center gap-2 text-xs sm:text-sm text-crema-400">
                <span className={`h-2 w-2 rounded-full ${isOpenNow(s) ? 'bg-mint' : 'bg-crema-400'}`} />
                {isOpenNow(s) ? 'Open now' : 'Closed now'} · {hoursLabel(s)}
              </p>
              <h3 className="mt-2.5 sm:mt-3 font-display text-xl sm:text-2xl">Order ahead for pickup</h3>
              <p className="mt-1 text-xs sm:text-sm text-crema-200">
                Browse our menu, customize your order, and we'll have it ready for you. Pay at the counter when you arrive.
              </p>
              {s.orderingEnabled ? (
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <a href="#menu" className="btn-gold w-full sm:w-auto text-center">Browse the menu</a>
                  {count > 0 && <button className="btn-ghost w-full sm:w-auto" onClick={() => openCart(true)}>View my order ({count})</button>}
                </div>
              ) : (
                <p className="mt-2 text-xs sm:text-sm text-crema-200">Online ordering is paused right now. Call us on <a className="text-caramel underline font-semibold" href={telHref(s.phone)}>{s.phone}</a> or order at the counter.</p>
              )}
            </div>
          </Reveal>
        </div>
        <Reveal delay={0.15}>
          <Tilt className="glass p-5 sm:p-8">
            {!s.reservationsEnabled ? (
              <div className="py-8 sm:py-10 text-center">
                <p className="font-display text-2xl sm:text-3xl">Table bookings paused</p>
                <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-crema-200">We are currently accepting walk-ins only. Please call us directly on <a className="text-caramel underline font-semibold" href={telHref(s.phone)}>{s.phone}</a> for large group inquiries.</p>
              </div>
            ) : done ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-8 sm:py-10 text-center">
                <p className="font-display text-2xl sm:text-3xl text-caramel">Table requested!</p>
                <p className="mt-2 sm:mt-3 text-sm text-crema-200">
                  Table for {done.guests} on {new Date(done.date + 'T00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} at {to12h(done.time)}.
                </p>
                <p className="mt-1 text-xs text-crema-400">
                  We'll call you on {done.phone} to confirm availability. See you soon!
                </p>
                <button className="btn-ghost mt-6 sm:mt-8 w-full sm:w-auto" onClick={() => setDone(null)}>Make another booking</button>
              </motion.div>
            ) : (
              <form onSubmit={submit} className="grid gap-3.5 sm:gap-4">
                <div>
                  <h3 className="font-display text-xl sm:text-2xl">Reserve a table</h3>
                  <p className="text-xs text-crema-400 mt-0.5">Save your spot for lunch, dinner, or a celebration.</p>
                </div>
                <div className="grid gap-3.5 sm:gap-4 sm:grid-cols-2">
                  <label className="field">Your name<input className="input" required minLength={2} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" placeholder="e.g. Priyantha" /></label>
                  <label className="field">Phone number<input className="input" required inputMode="tel" placeholder="07X XXX XXXX" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} autoComplete="tel" /></label>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3">
                  <label className="field col-span-2 sm:col-span-1">Date<input className="input" type="date" required min={todayISO()} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
                  <label className="field">Time
                    <select className="input" value={f.time || slots[Math.floor(slots.length * 0.66)] || ''} onChange={(e) => setF({ ...f, time: e.target.value })}>
                      {slots.map((t) => <option key={t} value={t}>{to12h(t)}</option>)}
                    </select>
                  </label>
                  <label className="field">Number of guests
                    <select className="input" value={f.guests} onChange={(e) => setF({ ...f, guests: Number(e.target.value) })}>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} {n === 1 ? 'person' : 'guests'}</option>)}
                    </select>
                  </label>
                </div>
                <label className="field">Special requests (optional)<textarea className="input min-h-[76px] sm:min-h-[80px] py-2.5 sm:py-3 text-sm" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="E.g., birthday celebration, quiet corner, baby high chair..." /></label>
                {s.closedDays.length > 0 && <p className="text-xs text-crema-400">Please note we are closed on {s.closedDays.map((d) => DAY_NAMES[d]).join(', ')}{closedDay ? ' (including today)' : ''}.</p>}
                {err && <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-xs sm:text-sm text-danger">{err}</p>}
                <button className="btn-gold mt-2 w-full" disabled={busy}>{busy && <Spinner />} Submit table request</button>
              </form>
            )}
          </Tilt>
        </Reveal>
      </div>
    </section>
  );
}
