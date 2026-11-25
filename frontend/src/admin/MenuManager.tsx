import { useMemo, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api, imageSrc, rs, uploadImage, uploadModel } from '@/lib/api';
import { useAuth, useMenu, useToast } from '@/store';
import type { MenuItem, MenuItemInput } from '@/types';
import FoodArt from '@/components/FoodArt';
import DishThumb from '@/components/DishThumb';
import { Spinner } from '@/components/ui';
import { Modal, PageHead, Switch } from './ui';
import { handleAdminError } from './store';

const empty: MenuItemInput = { name: '', description: '', price: 0, section: '', categoryId: 0, isPopular: false, isAvailable: true, sortOrder: 999 };

export default function MenuManager() {
  const onError = handleAdminError;
  const token = useAuth((s) => s.token);
  const { items, categories, load } = useMenu();
  const toast = useToast((s) => s.show);
  const [cat, setCat] = useState<number | 'all'>('all');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<{ id: number | null; data: MenuItemInput } | null>(null);
  const [deleting, setDeleting] = useState<MenuItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const list = useMemo(() => items.filter((m) => (cat === 'all' || m.categoryId === cat) && m.name.toLowerCase().includes(q.toLowerCase())), [items, cat, q]);

  const save = async (e: FormEvent) => {
    e.preventDefault(); if (!editing) return;
    setBusy(true);
    try {
      if (editing.id) await api.updateMenuItem(token, editing.id, editing.data);
      else await api.createMenuItem(token, editing.data);
      await load(); toast(editing.id ? 'Item updated' : 'Item added'); setEditing(null);
    } catch (e2) { onError(e2); } finally { setBusy(false); }
  };
  const toggle = async (m: MenuItem, key: 'isAvailable' | 'isPopular') => {
    try { await api.updateMenuItem(token, m.id, { [key]: !m[key] }); await load(); } catch (e) { onError(e); }
  };
  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try { await api.deleteMenuItem(token, deleting.id); await load(); toast(`${deleting.name} deleted`); setDeleting(null); }
    catch (e) { onError(e); } finally { setBusy(false); }
  };
  const d = editing?.data;
  const set = (patch: Partial<MenuItemInput>) => editing && setEditing({ ...editing, data: { ...editing.data, ...patch } });

  return (
    <section>
      <PageHead title="Menu items" sub={`${items.filter((m) => m.isAvailable).length} of ${items.length} items on sale. Switch “On sale” off when something runs out.`} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <select className="input !w-auto" value={cat} onChange={(e) => setCat(e.target.value === 'all' ? 'all' : Number(e.target.value))} aria-label="Category">
            <option value="all">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input className="input !w-56" type="search" placeholder="Search items" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search items" />
        </div>
        <button className="btn-gold" onClick={() => setEditing({ id: null, data: { ...empty, categoryId: cat === 'all' ? categories[0]?.id ?? 0 : cat } })}>+ Add item</button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-crema/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-espresso-800 text-crema-400">
            <tr><th className="p-3">Item</th><th className="p-3">Category</th><th className="p-3 text-right">Price</th><th className="p-3">On sale</th><th className="p-3">Popular</th><th className="p-3 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-crema/10">
            {list.map((m) => (
              <tr key={m.id} className="hover:bg-espresso-800/60">
                <td className="p-3"><div className="flex items-center gap-3"><DishThumb item={m} className="h-11 w-11" /><div><p className="font-semibold">{m.name}</p><p className="text-xs text-crema-400">{m.section}{m.modelUrl ? ' · 3D model' : m.imageUrl ? ' · photo' : ''}</p></div></div></td>
                <td className="p-3 text-crema-200">{m.category?.name}</td>
                <td className="whitespace-nowrap p-3 text-right font-semibold text-caramel">{rs(m.price)}</td>
                <td className="p-3"><Switch on={m.isAvailable} onClick={() => toggle(m, 'isAvailable')} label={`${m.name} on sale`} /></td>
                <td className="p-3"><Switch on={m.isPopular} onClick={() => toggle(m, 'isPopular')} label={`${m.name} popular`} /></td>
                <td className="whitespace-nowrap p-3 text-right">
                  <button className="chip mr-2" onClick={() => setEditing({ id: m.id, data: { name: m.name, description: m.description, price: m.price, section: m.section, categoryId: m.categoryId, isPopular: m.isPopular, isAvailable: m.isAvailable, sortOrder: m.sortOrder, imageUrl: m.imageUrl ?? null, modelUrl: m.modelUrl ?? null } })}>Edit</button>
                  <button className="chip text-danger" onClick={() => setDeleting(m)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && <p className="p-6 text-center text-crema-400">No items match.</p>}
      </div>

      <AnimatePresence>
        {editing && d && (
          <Modal wide onClose={() => setEditing(null)} title={editing.id ? 'Edit item' : 'Add item'}>
            <form onSubmit={save} className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <div className="grid gap-4">
                <label className="field">Name<input className="input" required minLength={2} value={d.name} onChange={(e) => set({ name: e.target.value })} /></label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="field">Category
                    <select className="input" value={d.categoryId} onChange={(e) => set({ categoryId: Number(e.target.value) })}>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </label>
                  <label className="field">Price (Rs)<input className="input" type="number" min={0} step={50} required value={d.price} onChange={(e) => set({ price: Number(e.target.value) })} /></label>
                </div>
                <label className="field">Section<input className="input" required placeholder="e.g. Milkshakes" value={d.section} onChange={(e) => set({ section: e.target.value })} /></label>
                <label className="field">Description<textarea className="input min-h-[90px] py-3" value={d.description} onChange={(e) => set({ description: e.target.value })} /></label>
                <div className="field">
                  Photo
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="btn-ghost cursor-pointer !min-h-[42px]">
                      {uploading ? <Spinner /> : null}{d.imageUrl ? 'Change photo' : 'Upload photo'}
                      <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={uploading}
                        onChange={async (e) => {
                          const f = e.target.files?.[0]; e.target.value = '';
                          if (!f) return;
                          setUploading(true);
                          try { set({ imageUrl: await uploadImage(token, f) }); } catch (e2) { onError(e2); } finally { setUploading(false); }
                        }} />
                    </label>
                    {d.imageUrl && <button type="button" className="chip text-danger" onClick={() => set({ imageUrl: null })}>Remove photo</button>}
                  </div>
                  <span className="text-xs font-normal text-crema-400">A real photo of the dish. Without one, a drawn 3D illustration is shown.</span>
                </div>
                <div className="field">
                  Real 3D model (optional)
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="btn-ghost cursor-pointer !min-h-[42px]">
                      {uploading ? <Spinner /> : null}{d.modelUrl ? 'Change model' : 'Upload .glb model'}
                      <input type="file" accept=".glb,model/gltf-binary" className="sr-only" disabled={uploading}
                        onChange={async (e) => {
                          const f = e.target.files?.[0]; e.target.value = '';
                          if (!f) return;
                          setUploading(true);
                          try { set({ modelUrl: await uploadModel(token, f) }); } catch (e2) { onError(e2); } finally { setUploading(false); }
                        }} />
                    </label>
                    {d.modelUrl && <button type="button" className="chip text-danger" onClick={() => set({ modelUrl: null })}>Remove model</button>}
                  </div>
                  <span className="text-xs font-normal text-crema-400">Scan the real dish with a phone app (e.g. Polycam, Luma) and export a .glb under 15 MB. Customers can then turn it in the 3D menu.</span>
                </div>
                <div className="flex gap-6 text-sm">
                  <label className="flex items-center gap-2"><input type="checkbox" className="h-5 w-5 accent-[#E3AA65]" checked={d.isAvailable} onChange={(e) => set({ isAvailable: e.target.checked })} /> On sale</label>
                  <label className="flex items-center gap-2"><input type="checkbox" className="h-5 w-5 accent-[#E3AA65]" checked={d.isPopular} onChange={(e) => set({ isPopular: e.target.checked })} /> Popular</label>
                </div>
              </div>
              {/* live preview card */}
              <div className="tilt hidden self-start rounded-2xl border border-crema/10 bg-espresso-700 p-4 sm:block">
                <p className="text-xs text-crema-400">Preview</p>
                <motion.div key={(d.imageUrl ?? '') + d.categoryId} initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} className="grid place-items-center py-3">
                  {d.imageUrl
                    ? <img src={imageSrc(d.imageUrl)} alt="" className="h-28 w-28 object-contain drop-shadow-xl" />
                    : <FoodArt slug={categories.find((c) => c.id === d.categoryId)?.slug ?? ''} className="h-24 w-24" />}
                </motion.div>
                <p className="font-display text-lg leading-tight">{d.name || 'Item name'}</p>
                <p className="mt-1 font-semibold text-caramel">{rs(d.price || 0)}</p>
              </div>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
                <button className="btn-gold" disabled={busy}>{busy && <Spinner />} Save</button>
              </div>
            </form>
          </Modal>
        )}
        {deleting && (
          <Modal onClose={() => setDeleting(null)} title="Delete this item?">
            <p className="text-crema-200"><b className="text-crema">{deleting.name}</b> will be removed from the menu. This can't be undone. To hide it for now, switch off “On sale” instead.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setDeleting(null)}>Keep it</button>
              <button className="btn bg-danger text-white hover:bg-danger/85" disabled={busy} onClick={remove}>{busy && <Spinner />} Delete</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </section>
  );
}
