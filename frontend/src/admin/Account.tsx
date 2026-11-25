import { useState, type FormEvent } from 'react';
import { api, USING_MOCK } from '@/lib/api';
import { mockApi } from '@/lib/mockApi';
import { useAuth, useToast } from '@/store';
import { Spinner } from '@/components/ui';
import { Card, PageHead } from './ui';
import { handleAdminError } from './store';

export default function Account() {
  const { token, user, logout } = useAuth();
  const toast = useToast((s) => s.show);
  const [f, setF] = useState({ current: '', next: '', again: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr('');
    if (f.next.length < 8) return setErr('New password must be at least 8 characters.');
    if (f.next !== f.again) return setErr('The two new passwords don’t match.');
    setBusy(true);
    try { await api.changePassword(token, f.current, f.next); setF({ current: '', next: '', again: '' }); toast('Password changed'); }
    catch (e2) { const m = (e2 as Error).message; if (/current password/i.test(m)) setErr(m); else handleAdminError(e2); }
    finally { setBusy(false); }
  };

  return (
    <div className="grid max-w-2xl gap-6">
      <PageHead title="Account" sub={`Logged in as ${user?.email ?? ''}`} />
      <Card title="Change password">
        <form onSubmit={submit} className="grid gap-4">
          <label className="field">Current password<input className="input" type="password" required value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} autoComplete="current-password" /></label>
          <label className="field">New password<input className="input" type="password" required value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} autoComplete="new-password" /><span className="text-xs font-normal text-crema-400">At least 8 characters.</span></label>
          <label className="field">New password again<input className="input" type="password" required value={f.again} onChange={(e) => setF({ ...f, again: e.target.value })} autoComplete="new-password" /></label>
          {err && <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{err}</p>}
          <div><button className="btn-gold" disabled={busy}>{busy && <Spinner />} Change password</button></div>
        </form>
      </Card>
      <Card title="Session">
        <p className="text-sm text-crema-200">Log out when you use a shared computer at the counter.</p>
        <button className="btn-ghost mt-4" onClick={logout}>Log out</button>
      </Card>
      {USING_MOCK && (
        <Card title="Demo data">
          <p className="text-sm text-crema-200">This preview runs without a server. Reset to put the menu, settings and password back to how they started and clear test orders.</p>
          <button className="btn-ghost mt-4" onClick={() => { mockApi.reset(); logout(); window.location.reload(); }}>Reset demo data</button>
        </Card>
      )}
    </div>
  );
}
