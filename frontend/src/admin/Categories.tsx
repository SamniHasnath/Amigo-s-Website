import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth, useMenu, useToast } from '@/store';
import type { CategoryWithCount } from '@/types';
import { Spinner } from '@/components/ui';
import { Card, Icon, Modal, PageHead } from './ui';
import { handleAdminError } from './store';

export default function Categories() {
  const token = useAuth((s) => s.token);
  const { categories, load } = useMenu();
  const toast = useToast((s) => s.show);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState<CategoryWithCount | null>(null);

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true);
    try { await fn(); await load(); toast(msg); return true; } catch (e) { handleAdminError(e); return false; } finally { setBusy(false); }
  };
  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (await run(() => api.createCategory(token, name), `“${name}” added`)) setName('');
  };
  const move = (i: number, dir: -1 | 1) => {
    const a = categories[i], b = categories[i + dir];
    if (!a || !b) return;
    run(() => Promise.all([api.updateCategory(token, a.id, { sortOrder: b.sortOrder }), api.updateCategory(token, b.id, { sortOrder: a.sortOrder })]), 'Order updated');
  };

  return (
    <div className="max-w-3xl">
      <PageHead title="Categories" sub="The tabs customers see on the menu. Use the arrows to change their order." />
      <Card>
        <form onSubmit={add} className="mb-5 flex flex-wrap gap-2">
          <input className="input flex-1" placeholder="New category, e.g. Desserts" value={name} onChange={(e) => setName(e.target.value)} minLength={2} required aria-label="New category name" />
          <button className="btn-gold" disabled={busy}><Icon name="plus" /> Add category</button>
        </form>
        <ul className="divide-y divide-crema/10">
          <AnimatePresence initial={false}>
            {categories.map((c, i) => (
              <motion.li key={c.id} layout className="flex items-center gap-3 py-3">
                <div className="flex flex-col">
                  <button className="grid h-6 w-8 place-items-center rounded text-crema-400 hover:text-caramel disabled:opacity-20" disabled={i === 0 || busy} onClick={() => move(i, -1)} aria-label={`Move ${c.name} up`}><Icon name="up" className="h-4 w-4" /></button>
                  <button className="grid h-6 w-8 place-items-center rounded text-crema-400 hover:text-caramel disabled:opacity-20" disabled={i === categories.length - 1 || busy} onClick={() => move(i, 1)} aria-label={`Move ${c.name} down`}><Icon name="down" className="h-4 w-4" /></button>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-crema-400">{c._count?.items ?? 0} item{(c._count?.items ?? 0) === 1 ? '' : 's'}</p>
                </div>
                <button className="chip" onClick={() => setEditing({ id: c.id, name: c.name })}><Icon name="edit" className="h-4 w-4" /><span className="sr-only">Rename {c.name}</span></button>
                <button className="chip text-danger" onClick={() => setDeleting(c)}><Icon name="trash" className="h-4 w-4" /><span className="sr-only">Delete {c.name}</span></button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </Card>

      <AnimatePresence>
        {editing && (
          <Modal title="Rename category" onClose={() => setEditing(null)}>
            <form onSubmit={async (e) => { e.preventDefault(); if (await run(() => api.updateCategory(token, editing.id, { name: editing.name }), 'Category renamed')) setEditing(null); }} className="grid gap-4">
              <label className="field">Name<input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} minLength={2} required autoFocus /></label>
              <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button><button className="btn-gold" disabled={busy}>{busy && <Spinner />} Save</button></div>
            </form>
          </Modal>
        )}
        {deleting && (
          <Modal title={`Delete “${deleting.name}”?`} onClose={() => setDeleting(null)}>
            {(deleting._count?.items ?? 0) > 0 ? (
              <>
                <p className="text-crema-200">This category still has {deleting._count?.items} item(s). Move them to another category in <b>Menu items</b> (or delete them) first.</p>
                <div className="mt-6 flex justify-end"><button className="btn-ghost" onClick={() => setDeleting(null)}>OK</button></div>
              </>
            ) : (
              <>
                <p className="text-crema-200">The tab will disappear from the menu. This can't be undone.</p>
                <div className="mt-6 flex justify-end gap-2">
                  <button className="btn-ghost" onClick={() => setDeleting(null)}>Keep it</button>
                  <button className="btn bg-danger text-white hover:bg-danger/85" disabled={busy} onClick={async () => { if (await run(() => api.deleteCategory(token, deleting.id), 'Category deleted')) setDeleting(null); }}>{busy && <Spinner />} Delete</button>
                </div>
              </>
            )}
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
