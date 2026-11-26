import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api, rs } from '@/lib/api';
import { cartTotal, useCart, useSettings, type CartLine } from '@/store';
import { telHref } from '@/lib/hours';
import type { Order, OrderType } from '@/types';
import { Spinner } from './ui';

export default function CartDrawer() {
  const { lines, open, setOpen, setQty, clear, remove, restore } = useCart();
  // "Undo" bar: remembers the order as it was before the last removal, for a few seconds
  const [undo, setUndo] = useState<{ before: CartLine[]; label: string } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const undoTimer = useRef<ReturnType<typeof setTimeout>>();
  const offerUndo = (label: string) => {
    setUndo({ before: lines, label });
    clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo(null), 5000);
  };
  const removeLine = (l: CartLine) => { offerUndo(`${l.name} removed`); remove(l.id); };
  const minusOne = (l: CartLine) => { if (l.qty === 1) removeLine(l); else setQty(l.id, l.qty - 1); };
  const clearAll = () => { offerUndo('Order cleared'); clear(); setConfirmClear(false); };
  const doUndo = () => { if (undo) restore(undo.before); setUndo(null); clearTimeout(undoTimer.current); };
  useEffect(() => () => clearTimeout(undoTimer.current), []);
  // forget pending undo / confirm when the drawer closes
  useEffect(() => { if (!open) { setUndo(null); setConfirmClear(false); } }, [open]);
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
                  {lines.length > 1 && (
                    <div className="mb-1 flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-crema-400">{lines.length} dishes</span>
                      {confirmClear ? (
                        <span className="flex items-center gap-2">
                          <span className="text-crema-200">Remove everything?</span>
                          <button onClick={clearAll} className="rounded-full bg-danger/15 px-3 py-1.5 font-semibold text-danger hover:bg-danger/25">Yes, clear</button>
                          <button onClick={() => setConfirmClear(false)} className="rounded-full px-3 py-1.5 text-crema-200 hover:text-crema">Cancel</button>
                        </span>
                      ) : (
                        <button onClick={() => setConfirmClear(true)} className="rounded-full px-3 py-1.5 text-crema-400 transition hover:bg-danger/10 hover:text-danger">
                          Clear all
                        </button>
                      )}
                    </div>
                  )}
                  <ul className="divide-y divide-crema/10">
                    <AnimatePresence initial={false}>
                    {lines.map((l) => (
                      <motion.li
                        key={l.id}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, x: 60, height: 0, transition: { duration: 0.25 } }}
                        className="overflow-hidden"
                      >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 py-3.5 sm:py-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base leading-snug">{l.name}</p>
                          <p className="text-xs sm:text-sm text-crema-400">{rs(l.price)} each</p>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                          <div className="flex items-center rounded-full border border-crema/20 bg-espresso/50">
                            <button
                              className="h-8 w-8 sm:h-9 sm:w-9 text-base active:scale-90"
                              onClick={() => minusOne(l)}
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
                          <span className="ml-auto text-right font-semibold text-sm sm:text-base text-caramel min-w-[70px] sm:w-24">
                            {rs(l.price * l.qty)}
                          </span>
                          <button
                            onClick={() => removeLine(l)}
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-crema-400 transition hover:bg-danger/10 hover:text-danger active:scale-90"
                            aria-label={`Remove ${l.name} from order`}
                            title="Remove"
                          >
                            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      </motion.li>
                    ))}
                    </AnimatePresence>
                  </ul>
                </div>

                {/* Undo bar */}
                <AnimatePresence>
                  {undo && (
                    <motion.div
                      role="status"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 16 }}
                      className="mx-4 sm:mx-6 mb-3 flex items-center justify-between gap-3 rounded-xl border border-crema/15 bg-espresso px-4 py-2.5 text-sm shadow-lg"
                    >
                      <span className="truncate text-crema-200">{undo.label}</span>
                      <button onClick={doUndo} className="shrink-0 font-semibold text-caramel hover:underline">Undo</button>
                    </motion.div>
                  )}
                </AnimatePresence>
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
