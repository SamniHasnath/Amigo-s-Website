import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '@/lib/api';
import { DAY_NAMES } from '@/data/settings';
import { useAuth, useSettings, useToast } from '@/store';
import type { CafeSettings } from '@/types';
import { Spinner } from '@/components/ui';
import { Card, PageHead, Switch } from './ui';
import { handleAdminError } from './store';

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="field">{label}{children}{hint && <span className="text-xs font-normal text-crema-400">{hint}</span>}</label>;
}

export default function Settings() {
  const token = useAuth((s) => s.token);
  const { settings, set: setSaved } = useSettings();
  const toast = useToast((s) => s.show);
  const [f, setF] = useState<CafeSettings>(settings);
  const [busy, setBusy] = useState(false);
  useEffect(() => setF(settings), [settings]);
  const dirty = useMemo(() => JSON.stringify(f) !== JSON.stringify(settings), [f, settings]);
  const up = (p: Partial<CafeSettings>) => setF({ ...f, ...p });

  const save = async () => {
    setBusy(true);
    try {
      const changed = Object.fromEntries(Object.entries(f).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(settings[k as keyof CafeSettings])));
      setSaved(await api.updateSettings(token, changed));
      toast('Settings saved. The website is updated.');
    } catch (e) { handleAdminError(e); } finally { setBusy(false); }
  };

  return (
    <div className="max-w-4xl pb-28">
      <PageHead title="Café settings" sub="Everything here shows on the website as soon as you save." />
      <div className="grid gap-6">
        <Card title="Website switches">
          <div className="grid gap-5">
            {([
              ['orderingEnabled', 'Online orders', 'When off, customers can still browse the menu but are asked to call or order at the counter.'],
              ['reservationsEnabled', 'Table bookings', 'When off, the booking form is replaced with your phone number.'],
            ] as const).map(([k, l, h]) => (
              <div key={k} className="flex items-start gap-4">
                <div className="flex-1"><p className="font-semibold">{l}</p><p className="text-sm text-crema-400">{h}</p></div>
                <Switch on={f[k]} onClick={() => up({ [k]: !f[k] })} label={l} />
              </div>
            ))}
          </div>
        </Card>

        <Card title="Announcement bar" action={<Switch on={f.announcementEnabled} onClick={() => up({ announcementEnabled: !f.announcementEnabled })} label="Show announcement bar" />}>
          <Field label="Message" hint="Shown in a gold bar at the very top of the website, e.g. “Closed on Poya day” or “New: Biscoff frappe!”">
            <input className="input" maxLength={160} value={f.announcementText} onChange={(e) => up({ announcementText: e.target.value })} placeholder="Type a short message" />
          </Field>
          {f.announcementText && (
            <div className="mt-4 overflow-hidden rounded-xl border border-crema/10">
              <p className="bg-espresso px-3 py-1 text-xs text-crema-400">Preview</p>
              <div className={`px-4 py-2 text-center text-sm font-semibold ${f.announcementEnabled ? 'bg-caramel text-espresso' : 'bg-crema/10 text-crema-400 line-through'}`}>{f.announcementText}</div>
            </div>
          )}
        </Card>

        <Card title="Opening hours">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Opens at"><input className="input" type="time" step={1800} value={f.openTime} onChange={(e) => up({ openTime: e.target.value })} /></Field>
            <Field label="Closes at"><input className="input" type="time" step={1800} value={f.closeTime} onChange={(e) => up({ closeTime: e.target.value })} /></Field>
          </div>
          <fieldset className="mt-5">
            <legend className="text-sm font-medium text-crema-200">Closed on</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {DAY_NAMES.map((d, i) => {
                const on = f.closedDays.includes(i);
                return <button key={d} type="button" aria-pressed={on} onClick={() => up({ closedDays: on ? f.closedDays.filter((x) => x !== i) : [...f.closedDays, i].sort() })}
                  className={`chip ${on ? 'chip-on' : 'text-crema-200'}`}>{d.slice(0, 3)}</button>;
              })}
            </div>
            <p className="mt-2 text-xs text-crema-400">Open every day? Leave all unselected. Table bookings follow these hours.</p>
          </fieldset>
        </Card>

        <Card title="Café details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Café name"><input className="input" value={f.cafeName} onChange={(e) => up({ cafeName: e.target.value })} /></Field>
            <Field label="Tagline"><input className="input" value={f.tagline} onChange={(e) => up({ tagline: e.target.value })} /></Field>
            <Field label="Address"><input className="input" value={f.address} onChange={(e) => up({ address: e.target.value })} /></Field>
            <Field label="Phone"><input className="input" inputMode="tel" value={f.phone} onChange={(e) => up({ phone: e.target.value })} /></Field>
            <Field label="Email (optional)"><input className="input" type="email" value={f.email} onChange={(e) => up({ email: e.target.value })} /></Field>
            <Field label="Google Maps link" hint="Used by the “Get directions” button"><input className="input" type="url" value={f.mapsUrl} onChange={(e) => up({ mapsUrl: e.target.value })} /></Field>
            <Field label="Instagram link" hint="Leave empty to hide"><input className="input" type="url" value={f.instagram} onChange={(e) => up({ instagram: e.target.value })} /></Field>
            <Field label="TikTok link" hint="Leave empty to hide"><input className="input" type="url" value={f.tiktok} onChange={(e) => up({ tiktok: e.target.value })} /></Field>
          </div>
        </Card>

        <Card title="Shown on the home page">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Google rating"><input className="input" value={f.rating} onChange={(e) => up({ rating: e.target.value })} /></Field>
            <Field label="Number of reviews"><input className="input" type="number" min={0} value={f.reviews} onChange={(e) => up({ reviews: Number(e.target.value) })} /></Field>
            <Field label="Price per person"><input className="input" value={f.pricePerPerson} onChange={(e) => up({ pricePerPerson: e.target.value })} /></Field>
          </div>
          <p className="mt-3 text-xs text-crema-400">Keep the rating and review count the same as your Google listing.</p>
        </Card>
      </div>

      {/* save bar */}
      <AnimatePresence>
        {dirty && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-caramel/40 bg-espresso-700/95 p-3 pl-5 shadow-2xl backdrop-blur lg:left-[260px]">
            <p className="flex-1 text-sm">You have unsaved changes</p>
            <button className="btn-ghost !min-h-[42px]" onClick={() => setF(settings)}>Undo</button>
            <button className="btn-gold !min-h-[42px]" onClick={save} disabled={busy}>{busy && <Spinner />} Save changes</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
