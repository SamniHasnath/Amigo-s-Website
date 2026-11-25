import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api, rs } from '@/lib/api';
import { cartTotal, useCart, useSettings } from '@/store';
import { telHref } from '@/lib/hours';
import type { Order, OrderType } from '@/types';
import { Spinner } from './ui';

export default function CartDrawer() {
  const { lines, open, setOpen, setQty, clear } = useCart();
  const [step, setStep] = useState<'cart' | 'details' | 'done'>('cart');
  const [form, setForm] = useState({ customerName: '', phone: '', type: 'TAKEAWAY' as OrderType, note: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [placed, setPlaced] = useState<Order | null>(null);
  const total = cartTotal(lines);
  const settings = useSettings((s) => s.settings);

  const close = () => { setOpen(false); if (step === 'done') setStep('cart'); };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const order = await api.createOrder({ ...form, note: form.note || undefined, items: lines.map((l) => ({ menuItemId: l.id, quantity: l.qty })) });
      setPlaced(order); clear(); setStep('done');
    } catch (e2) { setErr((e2 as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Your order"
            className="fixed inset-y-0 right-0 z-[56] flex w-full max-w-md flex-col border-l border-crema/10 bg-espresso-800 shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          >
            <header className="flex items-center justify-between border-b border-crema/10 px-4 sm:px-6 py-4 sm:py-5">
              <h2 className="font-display text-xl sm:text-2xl">
                {step === 'done' ? 'Order confirmed' : step === 'details' ? 'Pickup & details' : 'Your order'}
              </h2>
              <button
                onClick={close}
                className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-full border border-crema/20 active:scale-95 text-base sm:text-lg"
                aria-label="Close"
              >
                ✕
              </button>
            </header>

            {step === 'cart' && (
              <>
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
                  {!lines.length && (
                    <div className="grid h-full place-items-center text-center text-crema-200 py-12">
                      <div>
                        <p className="font-display text-xl text-crema">Your order is empty</p>
                        <p className="mt-2 text-xs sm:text-sm max-w-[28ch] mx-auto text-crema-400">
                          Browse our menu to pick your favorite coffee, pasta, panini, or cold drink.
                        </p>
                        <a href="#menu" onClick={close} className="btn-gold mt-6 inline-flex">Explore the menu</a>
                      </div>
                    </div>
                  )}
                  <ul className="divide-y divide-crema/10">
                    {lines.map((l) => (
                      <li key={l.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 py-3.5 sm:py-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base leading-snug">{l.name}</p>
                          <p className="text-xs sm:text-sm text-crema-400">{rs(l.price)} each</p>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3">
                          <div className="flex items-center rounded-full border border-crema/20 bg-espresso/50">
                            <button
                              className="h-8 w-8 sm:h-9 sm:w-9 text-base active:scale-90"
                              onClick={() => setQty(l.id, l.qty - 1)}
                              aria-label={`Remove one ${l.name}`}
                            >
                              −
                            </button>
                            <span className="w-6 text-center text-xs sm:text-sm font-semibold">{l.qty}</span>
                            <button
                              className="h-8 w-8 sm:h-9 sm:w-9 text-base active:scale-90"
                              onClick={() => setQty(l.id, l.qty + 1)}
                              aria-label={`Add one ${l.name}`}
                            >
                              +
                            </button>
                          </div>
                          <span className="text-right font-semibold text-sm sm:text-base text-caramel min-w-[70px] sm:w-24">
                            {rs(l.price * l.qty)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                {lines.length > 0 && (
                  <footer className="border-t border-crema/10 px-4 sm:px-6 py-4 sm:py-5 pb-safe bg-espresso-800">
                    <div className="flex justify-between text-base sm:text-lg">
                      <span>Total</span>
                      <span className="font-display text-xl sm:text-2xl text-caramel font-semibold">{rs(total)}</span>
                    </div>
                    {settings.orderingEnabled ? (
                      <button className="btn-gold mt-3 sm:mt-4 w-full" onClick={() => setStep('details')}>
                        Proceed to details →
                      </button>
                    ) : (
                      <p className="mt-3 sm:mt-4 rounded-xl bg-caramel/10 px-4 py-3 text-xs sm:text-sm">
                        Online ordering is paused right now. Please call us directly on{' '}
                        <a className="font-semibold text-caramel underline" href={telHref(settings.phone)}>
                          {settings.phone}
                        </a>{' '}
                        or order in person at the counter.
                      </p>
                    )}
                  </footer>
                )}
              </>
            )}

            {step === 'details' && (
              <form onSubmit={submit} className="flex flex-1 flex-col overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">
                <div className="grid gap-3.5 sm:gap-4">
                  <label className="field">Your name<input className="input" required minLength={2} value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} autoComplete="name" placeholder="e.g. Sahan" /></label>
                  <label className="field">Phone number<input className="input" required inputMode="tel" placeholder="07X XXX XXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" /></label>
                  <fieldset className="field">
                    <legend className="mb-1.5">Dining preference</legend>
                    <div className="grid grid-cols-2 gap-2">
                      {(['TAKEAWAY', 'DINE_IN'] as OrderType[]).map((t) => (
                        <button type="button" key={t} onClick={() => setForm({ ...form, type: t })} className={`chip ${form.type === t ? 'chip-on' : ''}`}>
                          {t === 'TAKEAWAY' ? 'Takeaway' : 'Dine in'}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <label className="field">Special requests (optional)<textarea className="input min-h-[80px] sm:min-h-[90px] py-2.5 sm:py-3 text-sm" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="E.g., less sugar, extra spicy, sauce on the side..." /></label>
                </div>
                {err && <p role="alert" className="mt-4 rounded-xl bg-danger/10 px-3 py-2 text-xs sm:text-sm text-danger">{err}</p>}
                <div className="mt-auto pt-5 sm:pt-6 pb-safe border-t border-crema/10">
                  <div className="flex justify-between text-base sm:text-lg">
                    <span>Total</span>
                    <span className="font-display text-xl sm:text-2xl text-caramel font-semibold">{rs(total)}</span>
                  </div>
                  <p className="mt-1 text-xs text-crema-400">Pay with cash or card at the counter when you collect.</p>
                  <div className="mt-3 sm:mt-4 flex gap-2.5 sm:gap-3">
                    <button type="button" className="btn-ghost" onClick={() => setStep('cart')}>Back</button>
                    <button className="btn-gold flex-1" disabled={busy}>{busy && <Spinner />} Place order</button>
                  </div>
                </div>
              </form>
            )}

            {step === 'done' && placed && (
              <div className="flex flex-1 flex-col items-center justify-center px-6 sm:px-8 py-8 text-center pb-safe">
                <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring' }} className="grid h-16 w-16 sm:h-20 sm:w-20 place-items-center rounded-full bg-caramel text-3xl sm:text-4xl text-espresso">
                  ✓
                </motion.div>
                <p className="mt-5 sm:mt-6 font-display text-2xl sm:text-3xl">Thank you, {placed.customerName.split(' ')[0]}!</p>
                <p className="mt-2 text-xs sm:text-sm text-crema-200">We've received your order</p>
                <p className="mt-1 font-display text-3xl sm:text-4xl text-caramel">#{placed.orderNumber}</p>
                <p className="mt-3 text-xs sm:text-sm text-crema-200">
                  {placed.items.length} item{placed.items.length > 1 ? 's' : ''} · {rs(placed.total)} · {placed.type === 'TAKEAWAY' ? 'Takeaway' : 'Dine in'}
                </p>
                <p className="mt-2 text-xs text-crema-400 max-w-[32ch]">
                  We're preparing your food now. Just give your order number at the counter when you arrive.
                </p>
                <button className="btn-gold mt-6 sm:mt-8 w-full sm:w-auto" onClick={close}>Done</button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
