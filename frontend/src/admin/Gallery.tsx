// Gallery manager: the café adds, re-orders, captions and removes the photos shown in the
// "A place to gather" section, and turns the latte-art drawing toy on or off.
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api, imageSrc, uploadImage } from '@/lib/api';
import { DEFAULT_SETTINGS } from '@/data/settings';
import { useAuth, useSettings, useToast } from '@/store';
import type { GalleryPhoto } from '@/types';
import { Spinner } from '@/components/ui';
import { Card, Icon, PageHead, Switch } from './ui';
import { handleAdminError } from './store';

const MAX = 12;

export default function Gallery() {
  const token = useAuth((s) => s.token);
  const { settings, set: setSaved } = useSettings();
  const toast = useToast((s) => s.show);
  const [photos, setPhotos] = useState<GalleryPhoto[]>(settings.gallery ?? []);
  const [latte, setLatte] = useState<boolean>(settings.showLatteArt ?? true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(0);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => { setPhotos(settings.gallery ?? []); setLatte(settings.showLatteArt ?? true); }, [settings]);
  const dirty = useMemo(
    () => JSON.stringify(photos) !== JSON.stringify(settings.gallery ?? []) || latte !== (settings.showLatteArt ?? true),
    [photos, latte, settings],
  );

  const edit = (i: number, p: Partial<GalleryPhoto>) => setPhotos(photos.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d; if (j < 0 || j >= photos.length) return;
    const next = [...photos]; [next[i], next[j]] = [next[j], next[i]]; setPhotos(next);
  };
  const remove = (i: number) => setPhotos(photos.filter((_, j) => j !== i));

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX - photos.length;
    if (room <= 0) { toast(`The gallery holds up to ${MAX} photos. Remove one first.`); return; }
    const list = Array.from(files).slice(0, room);
    setUploading(list.length);
    const added: GalleryPhoto[] = [];
    for (const f of list) {
      try {
        const src = await uploadImage(token, f);
        added.push({ src, alt: '', caption: f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').slice(0, 80) });
      } catch (e) { handleAdminError(e); }
      setUploading((n) => n - 1);
    }
    // new photos go to the front so they show first
    setPhotos((cur) => [...added, ...cur].slice(0, MAX));
    if (files.length > room) toast(`Only ${room} photo${room === 1 ? '' : 's'} added — the gallery holds up to ${MAX}.`);
    if (file.current) file.current.value = '';
  };

  const save = async () => {
    setBusy(true);
    try {
      const clean = photos.map((p) => ({ src: p.src, caption: p.caption.trim(), alt: (p.alt.trim() || p.caption.trim() || 'Photo from Amigo’s Cafe').slice(0, 200) }));
      setSaved(await api.updateSettings(token, { gallery: clean, showLatteArt: latte }));
      toast('Gallery saved. The website is updated.');
    } catch (e) { handleAdminError(e); } finally { setBusy(false); }
  };

  return (
    <div className="max-w-5xl pb-28">
      <PageHead
        title="Gallery"
        sub="The photos in the “A place to gather” section. Change them whenever you like — new dishes, seasonal drinks, the café at night."
        action={
          <button className="btn-gold" onClick={() => file.current?.click()} disabled={photos.length >= MAX || uploading > 0}>
            {uploading > 0 ? <Spinner /> : <Icon name="plus" />} {uploading > 0 ? `Uploading ${uploading}…` : 'Add photos'}
          </button>
        }
      />
      <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={(e) => add(e.target.files)} />

      <div className="grid gap-6">
        <Card title="Latte-art drawing" action={<Switch on={latte} onClick={() => setLatte(!latte)} label="Show the latte-art drawing toy" />}>
          <p className="text-sm text-crema-200">
            A small “Try your hand at latte art” card in the gallery. Visitors drag on a cup of coffee to pour foam, etch lines or pour a heart.
            It’s just for fun — nothing is saved or sent to you. Turn it off if you’d rather show only photos.
          </p>
        </Card>

        <Card title={`Photos (${photos.length}/${MAX})`} action={
          <button className="text-sm text-crema-400 underline-offset-4 hover:text-caramel hover:underline"
            onClick={() => { if (confirm('Put back the original gallery photos? Your own photos will be removed from the list (until you save, nothing changes on the website).')) setPhotos(DEFAULT_SETTINGS.gallery); }}>
            Reset to original photos
          </button>
        }>
          <p className="mb-4 text-sm text-crema-400">
            Shown in this order (top first). Use real photos of your food, drinks and café — please only post photos of customers if they’ve agreed.
            Photos are resized automatically.
          </p>
          {photos.length === 0 ? (
            <button onClick={() => file.current?.click()} className="grid w-full place-items-center gap-2 rounded-2xl border-2 border-dashed border-crema/15 py-14 text-crema-400 hover:border-caramel hover:text-caramel">
              <Icon name="plus" className="h-8 w-8" /> No photos yet — add your first photos
            </button>
          ) : (
            <ul className="grid gap-3">
              <AnimatePresence initial={false}>
                {photos.map((p, i) => (
                  <motion.li key={p.src.slice(-60) + i} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col gap-4 rounded-2xl border border-crema/10 bg-espresso p-3 sm:flex-row sm:items-center">
                    <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl bg-espresso-800 sm:w-36">
                      <img src={imageSrc(p.src)} alt="" className="h-full w-full object-cover" />
                      <span className="absolute left-2 top-2 grid h-6 min-w-6 place-items-center rounded-full bg-black/60 px-1.5 text-xs font-bold text-white">{i + 1}</span>
                    </div>
                    <div className="grid min-w-0 flex-1 gap-2">
                      <label className="field">Caption <span className="sr-only">for photo {i + 1}</span>
                        <input className="input" maxLength={80} value={p.caption} onChange={(e) => edit(i, { caption: e.target.value })} placeholder="e.g. New: Biscoff frappe" />
                      </label>
                      <label className="field text-xs">Description for screen readers (optional)
                        <input className="input !py-2 text-sm" maxLength={200} value={p.alt} onChange={(e) => edit(i, { alt: e.target.value })} placeholder="What's in the photo, e.g. An iced latte on a wooden table" />
                      </label>
                    </div>
                    <div className="flex shrink-0 gap-2 sm:flex-col">
                      <button className="grid h-10 w-10 place-items-center rounded-xl border border-crema/15 disabled:opacity-30" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move photo ${i + 1} up`}><Icon name="up" /></button>
                      <button className="grid h-10 w-10 place-items-center rounded-xl border border-crema/15 disabled:opacity-30" onClick={() => move(i, 1)} disabled={i === photos.length - 1} aria-label={`Move photo ${i + 1} down`}><Icon name="down" /></button>
                      <button className="grid h-10 w-10 place-items-center rounded-xl border border-danger/30 text-danger" onClick={() => remove(i)} aria-label={`Remove photo ${i + 1}`}><Icon name="trash" /></button>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </Card>
      </div>

      <AnimatePresence>
        {dirty && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-caramel/40 bg-espresso-700/95 p-3 pl-5 shadow-2xl backdrop-blur lg:left-[260px]">
            <p className="flex-1 text-sm">You have unsaved changes</p>
            <button className="btn-ghost !min-h-[42px]" onClick={() => { setPhotos(settings.gallery ?? []); setLatte(settings.showLatteArt ?? true); }}>Undo</button>
            <button className="btn-gold !min-h-[42px]" onClick={save} disabled={busy || uploading > 0}>{busy && <Spinner />} Save gallery</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
