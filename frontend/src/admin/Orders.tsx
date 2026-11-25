import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { rs } from '@/lib/api';
import { telHref, todayISO } from '@/lib/hours';
import type { Order, OrderStatus } from '@/types';
import { Icon, PageHead, StatusBadge, slDate, timeAgo } from './ui';
import { useAdmin } from './store';

const COLUMNS: { status: OrderStatus; title: string; hint: string }[] = [
  { status: 'PENDING', title: 'New', hint: 'Just placed' },
  { status: 'PREPARING', title: 'Preparing', hint: 'In the kitchen' },
  { status: 'READY', title: 'Ready', hint: 'Waiting for pickup' },
  { status: 'COMPLETED', title: 'Done', hint: 'Collected / served' },
];
const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  PENDING: { to: 'PREPARING', label: 'Start preparing' },
  PREPARING: { to: 'READY', label: 'Mark ready' },
  READY: { to: 'COMPLETED', label: 'Collected' },
};

export default function Orders() {
  const { orders, setOrderStatus } = useAdmin();
  const [range, setRange] = useState<'today' | 'all'>('today');
  const [q, setQ] = useState('');
  const [showCancelled, setShowCancelled] = useState(false);
  const today = todayISO();

  const list = useMemo(() => orders.filter((o) =>
    (range === 'all' || slDate(o.createdAt) === today) &&
    (!q || `${o.orderNumber} ${o.customerName} ${o.phone}`.toLowerCase().includes(q.toLowerCase()))), [orders, range, q, today]);
  const cancelled = list.filter((o) => o.status === 'CANCELLED');

  return (
    <div>
      <PageHead title="Orders" sub="Move each order along as you make it. New orders appear automatically."
        action={
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-full border border-crema/15 p-1">
              {(['today', 'all'] as const).map((r) => (
                <button key={r} onClick={() => setRange(r)} className={`min-h-[38px] rounded-full px-4 text-sm font-semibold ${range === r ? 'bg-crema text-espresso' : 'text-crema-200'}`}>{r === 'today' ? 'Today' : 'All'}</button>
              ))}
            </div>
            <input className="input !w-56" type="search" placeholder="Search name, number, phone" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search orders" />
          </div>
        } />

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {COLUMNS.map((c) => {
          const col = list.filter((o) => o.status === c.status);
          return (
            <section key={c.status} className="flex min-h-[200px] flex-col rounded-3xl border border-crema/10 bg-espresso-800/60 p-4">
              <header className="mb-3 flex items-center justify-between">
                <div><h2 className="font-display text-xl">{c.title}</h2><p className="text-xs text-crema-400">{c.hint}</p></div>
                <span className="grid h-8 min-w-8 place-items-center rounded-full bg-crema/10 px-2 text-sm font-semibold">{col.length}</span>
              </header>
              <div className="grid gap-3">
                <AnimatePresence>
                  {col.map((o) => <OrderCard key={o.id} o={o} onStatus={setOrderStatus} />)}
                </AnimatePresence>
                {!col.length && <p className="rounded-2xl border border-dashed border-crema/10 p-4 text-center text-sm text-crema-400">Nothing here</p>}
              </div>
            </section>
          );
        })}
      </div>

      {cancelled.length > 0 && (
        <div className="mt-6">
          <button className="text-sm text-crema-400 hover:text-crema" onClick={() => setShowCancelled(!showCancelled)}>{showCancelled ? 'Hide' : 'Show'} {cancelled.length} cancelled order{cancelled.length > 1 ? 's' : ''}</button>
          {showCancelled && <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{cancelled.map((o) => <OrderCard key={o.id} o={o} onStatus={setOrderStatus} />)}</div>}
        </div>
      )}
    </div>
  );
}

function OrderCard({ o, onStatus }: { o: Order; onStatus: (id: number, s: OrderStatus) => void }) {
  const next = NEXT[o.status];
  return (
    <motion.article layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-2xl border border-crema/10 bg-espresso p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-lg leading-tight">{o.orderNumber}</p>
          <p className="text-sm">{o.customerName}</p>
        </div>
        <div className="text-right"><StatusBadge status={o.status} /><p className="mt-1 text-xs text-crema-400">{timeAgo(o.createdAt)}</p></div>
      </div>
      <ul className="mt-3 grid gap-1 text-sm text-crema-200">
        {o.items.map((i) => <li key={i.id} className="flex justify-between gap-2"><span>{i.quantity}× {i.name}</span><span className="whitespace-nowrap text-crema-400">{rs(i.unitPrice * i.quantity)}</span></li>)}
      </ul>
      {o.note && <p className="mt-2 rounded-lg bg-caramel/10 px-2 py-1 text-sm italic">“{o.note}”</p>}
      <div className="mt-3 flex items-center justify-between border-t border-crema/10 pt-3 text-sm">
        <span>{o.type === 'TAKEAWAY' ? 'Takeaway' : 'Dine in'}</span>
        <b className="text-caramel">{rs(o.total)}</b>
      </div>
      <div className="mt-3 flex gap-2">
        <a className="chip grid place-items-center" href={telHref(o.phone)} aria-label={`Call ${o.customerName} on ${o.phone}`} title={o.phone}><Icon name="phone" className="h-4 w-4" /></a>
        {next && <button className="btn-gold !min-h-[40px] flex-1 !px-3" onClick={() => onStatus(o.id, next.to)}>{next.label}</button>}
        {o.status !== 'CANCELLED' && o.status !== 'COMPLETED' && <button className="chip text-danger" onClick={() => onStatus(o.id, 'CANCELLED')}>Cancel</button>}
        {o.status === 'CANCELLED' && <button className="chip flex-1" onClick={() => onStatus(o.id, 'PENDING')}>Restore</button>}
      </div>
    </motion.article>
  );
}
