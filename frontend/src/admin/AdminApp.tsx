// Admin panel: login + sidebar layout. Open it from the "Staff login" button in the
// corner of the website, the footer link, or by going to /#admin.
import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { USING_MOCK } from '@/lib/api';
import { MOCK_ADMIN } from '@/lib/mockApi';
import { useAuth, useSettings } from '@/store';
import { Spinner } from '@/components/ui';
import { Icon } from './ui';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import { useAdmin } from './store';

const Dashboard = lazy(() => import('./Dashboard'));
const Orders = lazy(() => import('./Orders'));
const Reservations = lazy(() => import('./Reservations'));
const MenuManager = lazy(() => import('./MenuManager'));
const Categories = lazy(() => import('./Categories'));
const Gallery = lazy(() => import('./Gallery'));
const Settings = lazy(() => import('./Settings'));
const Account = lazy(() => import('./Account'));

export type Page = 'dashboard' | 'orders' | 'reservations' | 'menu' | 'categories' | 'gallery' | 'settings' | 'account';
const NAV: { id: Page; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'orders', label: 'Orders', icon: 'orders' },
  { id: 'reservations', label: 'Reservations', icon: 'reservations' },
  { id: 'menu', label: 'Menu items', icon: 'menu' },
  { id: 'categories', label: 'Categories', icon: 'categories' },
  { id: 'gallery', label: 'Gallery', icon: 'gallery' },
  { id: 'settings', label: 'Café settings', icon: 'settings' },
  { id: 'account', label: 'Account', icon: 'account' },
];

export default function AdminApp() {
  const token = useAuth((s) => s.token);
  return token ? <Layout /> : <Login />;
}

function Login() {
  const login = useAuth((s) => s.login);
  const cafe = useSettings((s) => s.settings);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await login(email, password); } catch (e2) { setErr((e2 as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="theme-dark relative hidden flex-col justify-between overflow-hidden bg-espresso-800 p-12 lg:flex">
        <a href="#"><Logo className="text-4xl" sub /></a>
        <div>
          <p className="eyebrow">Staff area</p>
          <h1 className="mt-3 font-display text-5xl leading-[1.05]">Run the café<br /><em className="text-caramel">from one place.</em></h1>
          <ul className="mt-8 grid gap-3 text-crema-200">
            {['See new orders and table requests the moment they arrive', 'Change prices, gallery photos and what’s on sale', 'Update opening hours, contact details and announcements'].map((t) => (
              <li key={t} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-caramel" />{t}</li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-crema-400">{cafe.address}</p>
      </div>
      <div className="grid place-items-center px-5 py-12">
        <motion.form onSubmit={submit} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="grid w-full max-w-sm gap-4">
          <a href="#" className="lg:hidden"><Logo className="text-4xl" /></a>
          <div className="flex items-center justify-between gap-3"><h2 className="font-display text-3xl">Staff login</h2><ThemeToggle /></div>
          <label className="field">Email<input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></label>
          <label className="field">Password<input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>
          {err && <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{err}</p>}
          <button className="btn-gold" disabled={busy}>{busy && <Spinner />} Log in</button>
          {USING_MOCK && (
            <div className="rounded-xl border border-crema/15 bg-espresso/60 px-3.5 py-3 text-xs text-crema-200">
              <p className="font-semibold text-crema">Demo login</p>
              <p className="mt-1.5">Email: <span className="select-all font-mono text-crema">{MOCK_ADMIN.email}</span></p>
              <p className="mt-0.5">Password: <span className="select-all font-mono text-crema">{MOCK_ADMIN.password}</span></p>
              <p className="mt-2 text-crema-400">Demo mode (no backend connected): changes are saved in this browser only.</p>
            </div>
          )}
          <a href="#" className="text-sm text-crema-200 hover:text-caramel">← Back to the website</a>
        </motion.form>
      </div>
    </div>
  );
}

function Layout() {
  const { user, logout } = useAuth();
  const { orders, reservations, refresh, lastSync } = useAdmin();
  const settings = useSettings((s) => s.settings);
  const [page, setPage] = useState<Page>('dashboard');
  const [drawer, setDrawer] = useState(false);

  // first load + check for new orders every 20 seconds
  useEffect(() => {
    refresh();
    const t = setInterval(() => refresh({ quiet: true }), 20000);
    return () => clearInterval(t);
  }, [refresh]);

  const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
  const pendingRes = reservations.filter((r) => r.status === 'PENDING').length;
  const badges: Partial<Record<Page, number>> = { orders: pendingOrders, reservations: pendingRes };
  useEffect(() => {
    const n = pendingOrders + pendingRes;
    document.title = `${n ? `(${n}) ` : ''}Admin · ${settings.cafeName}`;
  }, [pendingOrders, pendingRes, settings.cafeName]);

  const go = (p: Page) => { setPage(p); setDrawer(false); window.scrollTo({ top: 0 }); };

  const nav = (
    <nav className="flex h-full flex-col gap-1 p-4" aria-label="Admin">
      <a href="#" className="mb-6 flex items-end gap-2 px-3 pt-2"><Logo className="text-[28px]" /><span className="pb-1 text-xs text-crema-400">Admin</span></a>
      {NAV.map((n) => (
        <button key={n.id} onClick={() => go(n.id)} aria-current={page === n.id ? 'page' : undefined}
          className={`flex min-h-[46px] items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition ${page === n.id ? 'bg-caramel text-espresso' : 'text-crema-200 hover:bg-crema/5 hover:text-crema'}`}>
          <Icon name={n.icon} />
          <span className="flex-1">{n.label}</span>
          {!!badges[n.id] && <span className={`grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs font-bold ${page === n.id ? 'bg-espresso text-caramel' : 'bg-caramel text-espresso'}`}>{badges[n.id]}</span>}
        </button>
      ))}
      <div className="mt-auto grid gap-1 border-t border-crema/10 pt-4">
        <a href="#" className="flex min-h-[46px] items-center gap-3 rounded-xl px-3 text-sm text-crema-200 hover:bg-crema/5"><Icon name="globe" /> View website</a>
        <button onClick={logout} className="flex min-h-[46px] items-center gap-3 rounded-xl px-3 text-left text-sm text-crema-200 hover:bg-crema/5"><Icon name="logout" /> Log out</button>
        <p className="px-3 pt-2 text-xs text-crema-400">{user?.email}</p>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-espresso lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-crema/10 bg-espresso lg:block">{nav}</aside>

      {/* mobile drawer */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-black/60 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} />
            <motion.aside className="fixed inset-y-0 left-0 z-50 w-72 bg-espresso lg:hidden pb-safe overflow-y-auto" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 30, stiffness: 280 }}>
              {nav}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-14 sm:h-16 items-center gap-2 sm:gap-3 border-b border-crema/10 bg-espresso/90 px-3 sm:px-8 backdrop-blur">
          <button className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-xl border border-crema/15 lg:hidden active:scale-95" onClick={() => setDrawer(true)} aria-label="Open menu"><Icon name="burger" /></button>
          <p className="flex-1 truncate text-xs sm:text-sm text-crema-400">
            {USING_MOCK ? 'Demo mode · saved locally' : `Synced ${lastSync ? new Date(lastSync).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '…'}`}
          </p>
          <ThemeToggle className="!h-10 !w-10 sm:!h-11 sm:!w-11 !rounded-xl !border-crema/15" />
          <button onClick={() => go('orders')} className="relative grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-xl border border-crema/15 active:scale-95" aria-label={`${pendingOrders} new orders`}>
            <Icon name="bell" />
            {pendingOrders + pendingRes > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 sm:h-5 sm:min-w-5 place-items-center rounded-full bg-caramel px-1 text-[10px] sm:text-[11px] font-bold text-espresso">{pendingOrders + pendingRes}</span>}
          </button>
          <button onClick={() => refresh()} className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-xl border border-crema/15 active:scale-95" aria-label="Refresh"><Icon name="refresh" /></button>
        </header>

        <main className="px-3 sm:px-8 py-6 sm:py-8 pb-safe">
          <Suspense fallback={<p className="flex items-center gap-3 text-crema-200"><Spinner /> Loading…</p>}>
            <motion.div key={page} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              {page === 'dashboard' && <Dashboard go={go} />}
              {page === 'orders' && <Orders />}
              {page === 'reservations' && <Reservations />}
              {page === 'menu' && <MenuManager />}
              {page === 'categories' && <Categories />}
              {page === 'gallery' && <Gallery />}
              {page === 'settings' && <Settings />}
              {page === 'account' && <Account />}
            </motion.div>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
