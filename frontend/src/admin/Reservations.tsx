import { useMemo, useState } from 'react';
import { telHref, to12h, todayISO } from '@/lib/hours';
import { Card, Icon, PageHead, StatusBadge, timeAgo } from './ui';
import { useAdmin } from './store';

type Tab = 'upcoming' | 'today' | 'past';

export default function Reservations() {
  const { reservations, setReservationStatus } = useAdmin();
  const [tab, setTab] = useState<Tab>('upcoming');
  const today = todayISO();

  const list = useMemo(() => reservations.filter((r) =>
    tab === 'today' ? r.date === today : tab === 'upcoming' ? r.date >= today : r.date < today), [reservations, tab, today]);
  const byDate = useMemo(() => {
    const m = new Map<string, typeof list>();
    (tab === 'past' ? [...list].reverse() : list).forEach((r) => m.set(r.date, [...(m.get(r.date) ?? []), r]));
    return [...m.entries()];
  }, [list, tab]);
  const pending = reservations.filter((r) => r.status === 'PENDING' && r.date >= today).length;

  return (
    <div>
      <PageHead title="Reservations" sub={pending ? `${pending} request${pending > 1 ? 's' : ''} waiting for you to confirm. Call the guest, then press Confirm.` : 'All table requests are answered.'}
        action={
          <div className="flex rounded-full border border-crema/15 p-1">
            {(['upcoming', 'today', 'past'] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`min-h-[38px] rounded-full px-4 text-sm font-semibold capitalize ${tab === t ? 'bg-crema text-espresso' : 'text-crema-200'}`}>{t}</button>
            ))}
          </div>
        } />
      {!byDate.length && <Card><p className="text-crema-400">No reservations here.</p></Card>}
      <div className="grid gap-6">
        {byDate.map(([date, rs]) => (
          <Card key={date} title={date === today ? 'Today' : new Date(date + 'T00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            action={<span className="text-sm text-crema-400">{rs.filter((r) => r.status !== 'CANCELLED').reduce((s, r) => s + r.guests, 0)} guests</span>}>
            <ul className="divide-y divide-crema/10">
              {rs.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-4 py-4">
                  <span className="w-24 font-display text-2xl">{to12h(r.time)}</span>
                  <div className="min-w-[180px] flex-1">
                    <p className="font-semibold">{r.name} <span className="font-normal text-crema-400">· {r.guests} guest{r.guests > 1 ? 's' : ''}</span></p>
                    <p className="text-sm text-crema-400">{r.phone} · requested {timeAgo(r.createdAt)}</p>
                    {r.note && <p className="mt-1 text-sm italic text-crema-200">“{r.note}”</p>}
                  </div>
                  <StatusBadge status={r.status} />
                  <div className="flex gap-2">
                    <a className="chip grid place-items-center" href={telHref(r.phone)} aria-label={`Call ${r.name}`}><Icon name="phone" className="h-4 w-4" /></a>
                    {r.status !== 'CONFIRMED' && <button className="chip text-mint" onClick={() => setReservationStatus(r.id, 'CONFIRMED')}>Confirm</button>}
                    {r.status !== 'CANCELLED' && <button className="chip text-danger" onClick={() => setReservationStatus(r.id, 'CANCELLED')}>Cancel</button>}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
