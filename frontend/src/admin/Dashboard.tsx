import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { api, rs } from '@/lib/api';
import { hoursLabel, isOpenNow, telHref, to12h, todayISO } from '@/lib/hours';
import { useAuth, useMenu, useSettings, useToast } from '@/store';
import type { CafeSettings } from '@/types';
import { Card, Icon, StatusBadge, Switch, slDate, timeAgo } from './ui';
import { handleAdminError, useAdmin } from './store';
import type { Page } from './AdminApp';

const NEXT: Record<string, { to: 'PREPARING' | 'READY' | 'COMPLETED'; label: string }> = {
  PENDING: { to: 'PREPARING', label: 'Start preparing' },
  PREPARING: { to: 'READY', label: 'Mark ready' },
  READY: { to: 'COMPLETED', label: 'Collected' },
};

export default function Dashboard({ go }: { go: (p: Page) => void }) {
  const { orders, reservations, setOrderStatus, setReservationStatus } = useAdmin();
  const { settings, set } = useSettings();
  const items = useMenu((s) => s.items);
  const token = useAuth((s) => s.token);
  const toast = useToast((s) => s.show);
  const user = useAuth((s) => s.user);
  const [saving, setSaving] = useState<string | null>(null);
  const today = todayISO();

  const stats = useMemo(() => {
    const todays = orders.filter((o) => slDate(o.createdAt) === today && o.status !== 'CANCELLED');
    const active = orders.filter((o) => ['PENDING', 'PREPARING', 'READY'].includes(o.status));
    const bookingsToday = reservations.filter((r) => r.date === today && r.status !== 'CANCELLED');
    // last 7 days of sales
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() + 330 * 60000 - (6 - i) * 86400000).toISOString().slice(0, 10);
      const total = orders.filter((o) => slDate(o.createdAt) === d && o.status !== 'CANCELLED').reduce((s, o) => s + o.total, 0);
      return { d, total };
    });
    // best sellers (all time, not cancelled)
    const counts = new Map<string, number>();
    orders.filter((o) => o.status !== 'CANCELLED').forEach((o) => o.items.forEach((i) => counts.set(i.name, (counts.get(i.name) ?? 0) + i.quantity)));
    const best = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { todays, active, bookingsToday, days, best, sales: todays.reduce((s, o) => s + o.total, 0) };
  }, [orders, reservations, today]);

  const toggle = async (key: keyof CafeSettings, value: boolean, msg: string) => {
    setSaving(key);
    try { set(await api.updateSettings(token, { [key]: value })); toast(msg); }
    catch (e) { handleAdminError(e); } finally { setSaving(null); }
  };

  const max = Math.max(1, ...stats.days.map((d) => d.total));
  const open = isOpenNow(settings);
  const hour = new Date(Date.now() + 330 * 60000).getUTCHours();
  const hello = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">{hello}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h1>
          <p className="mt-1 text-crema-400">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} · {open ? 'Open now' : 'Closed now'} · {hoursLabel(settings)}</p>
        </div>
      </div>

      {/* quick switches */}
      <div className="grid gap-4 md:grid-cols-3">
        {([
          ['orderingEnabled', 'Online orders', settings.orderingEnabled ? 'Customers can order from the website' : 'Paused: customers are asked to call'],
          ['reservationsEnabled', 'Table bookings', settings.reservationsEnabled ? 'Customers can request a table' : 'Paused: the form is hidden'],
          ['announcementEnabled', 'Announcement bar', settings.announcementEnabled ? (settings.announcementText || 'No text yet') : 'Hidden'],
        ] as const).map(([key, label, sub]) => (
          <div key={key} className="flex items-center gap-4 rounded-3xl border border-crema/10 bg-espresso-800/80 p-5">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{label}</p>
              <p className="truncate text-sm text-crema-400">{sub}</p>
            </div>
            <Switch on={settings[key]} label={label} disabled={saving === key}
              onClick={() => {
                if (key === 'announcementEnabled' && !settings.announcementText) { go('settings'); return; }
                toggle(key, !settings[key], `${label} ${settings[key] ? 'turned off' : 'turned on'}`);
              }} />
          </div>
        ))}
      </div>

      {/* numbers */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { l: "Today's orders", v: String(stats.todays.length), p: 'orders' as Page },
          { l: "Today's sales", v: rs(stats.sales), p: 'orders' as Page },
          { l: 'Orders in progress', v: String(stats.active.length), p: 'orders' as Page },
          { l: 'Tables booked today', v: String(stats.bookingsToday.length), p: 'reservations' as Page },
        ].map((s, i) => (
          <motion.button key={s.l} onClick={() => go(s.p)} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-3xl border border-crema/10 bg-espresso-800/80 p-5 text-left transition hover:border-caramel/50">
            <p className="text-sm text-crema-400">{s.l}</p>
            <p className="mt-2 font-display text-3xl">{s.v}</p>
          </motion.button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card title="Needs your attention" action={<button className="text-sm text-caramel" onClick={() => go('orders')}>All orders →</button>}>
          {!stats.active.length && <p className="text-sm text-crema-400">Nothing waiting. New orders from the website appear here straight away.</p>}
          <ul className="grid gap-3">
            {stats.active.slice(0, 6).map((o) => (
              <li key={o.id} className="rounded-2xl border border-crema/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{o.orderNumber} · {o.customerName}</p>
                  <div className="flex items-center gap-2"><span className="text-xs text-crema-400">{timeAgo(o.createdAt)}</span><StatusBadge status={o.status} /></div>
                </div>
                <p className="mt-1 text-sm text-crema-200">{o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm">{o.type === 'TAKEAWAY' ? 'Takeaway' : 'Dine in'} · <b className="text-caramel">{rs(o.total)}</b></span>
                  <div className="flex gap-2">
                    <a className="chip grid place-items-center" href={telHref(o.phone)} aria-label={`Call ${o.customerName}`}><Icon name="phone" className="h-4 w-4" /></a>
                    {NEXT[o.status] && <button className="btn-gold !min-h-[40px] !px-4" onClick={() => setOrderStatus(o.id, NEXT[o.status].to)}>{NEXT[o.status].label}</button>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <div className="grid content-start gap-6">
          <Card title="Today's tables" action={<button className="text-sm text-caramel" onClick={() => go('reservations')}>All →</button>}>
            {!stats.bookingsToday.length && <p className="text-sm text-crema-400">No tables booked for today.</p>}
            <ul className="divide-y divide-crema/10">
              {stats.bookingsToday.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="w-20 font-display text-lg">{to12h(r.time)}</span>
                  <span className="flex-1 text-sm">{r.name} · {r.guests} guest{r.guests > 1 ? 's' : ''}</span>
                  {r.status === 'PENDING'
                    ? <button className="chip text-mint" onClick={() => setReservationStatus(r.id, 'CONFIRMED')}>Confirm</button>
                    : <StatusBadge status={r.status} />}
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Sales, last 7 days">
            <div className="flex h-40 items-end gap-2" role="img" aria-label="Sales for the last seven days">
              {stats.days.map((d) => (
                <div key={d.d} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-[11px] text-crema-400">{d.total ? `${Math.round(d.total / 1000)}k` : ''}</span>
                  <motion.div initial={{ height: 0 }} animate={{ height: `${(d.total / max) * 100}%` }} transition={{ duration: 0.6 }}
                    className={`w-full rounded-t-lg ${d.d === today ? 'bg-caramel' : 'bg-crema/20'}`} style={{ minHeight: 4 }} />
                  <span className="text-[11px] text-crema-400">{new Date(d.d + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short' })}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Best sellers">
            {!stats.best.length && <p className="text-sm text-crema-400">Appears once orders come in.</p>}
            <ol className="grid gap-2">
              {stats.best.map(([name, qty], i) => (
                <li key={name} className="flex items-center gap-3 text-sm">
                  <span className="w-5 font-display text-caramel">{i + 1}</span>
                  <span className="flex-1">{name}</span>
                  <span className="text-crema-400">{qty} sold</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-crema-400">{items.filter((m) => m.isAvailable).length} of {items.length} menu items on sale · <button className="text-caramel" onClick={() => go('menu')}>Manage menu</button></p>
          </Card>
        </div>
      </div>
    </div>
  );
}
