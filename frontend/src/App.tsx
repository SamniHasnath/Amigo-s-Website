import { lazy, Suspense, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { applyTheme, useMenu, useSettings, useTheme } from '@/store';
import StaffButton from '@/components/StaffButton';
import Logo from '@/components/Logo';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Experience from '@/components/Experience';
import Favourites from '@/components/Favourites';
import Gather from '@/components/Gather';
import { hasWebGL } from '@/lib/webgl';
import { HAS_ADMIN, loadAdmin } from '@/lib/staffPanelLoader';
import { daypart } from '@/lib/hours';
import { SHOTS } from '@/data/gallery';
import Menu from '@/components/Menu';
import Reserve from '@/components/Reserve';
import Visit from '@/components/Visit';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import FloatingOrderBar from '@/components/FloatingOrderBar';
import { Toast } from '@/components/ui';

const CafeScene = lazy(() => import('@/three/CafeScene'));
const AdminApp = loadAdmin ? lazy(loadAdmin) : null;

/** '#admin' opens the staff panel; any other hash is a section on the home page. */
function useIsAdmin() {
  const [admin, setAdmin] = useState(() => HAS_ADMIN && window.location.hash === '#admin');
  useEffect(() => {
    const on = () => setAdmin(HAS_ADMIN && window.location.hash === '#admin');
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return admin;
}

function Intro() {
  const [show, setShow] = useState(true);
  useEffect(() => { const t = setTimeout(() => setShow(false), 1400); return () => clearTimeout(t); }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="fixed inset-0 z-[80] grid place-items-center bg-espresso" exit={{ opacity: 0, transition: { duration: 0.8 } }}>
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}>
            <Logo className="text-6xl sm:text-8xl" sub />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  const admin = useIsAdmin();
  const theme = useTheme((s) => s.theme);
  useEffect(() => applyTheme(theme), [theme]);
  const load = useMenu((s) => s.load);
  const loadSettings = useSettings((s) => s.load);
  const cafeName = useSettings((s) => s.settings.cafeName);
  useEffect(() => { load(); loadSettings(); }, [load, loadSettings, admin]);
  useEffect(() => { document.title = admin ? `Admin · ${cafeName}` : `${cafeName} · Trincomalee`; }, [admin, cafeName]);
  useEffect(() => { if (!admin) window.scrollTo({ top: 0 }); }, [admin]);

  if (admin && AdminApp) {
    return (
      <Suspense fallback={<div className="grid min-h-screen place-items-center">Loading…</div>}>
        <AdminApp />
        <Toast />
      </Suspense>
    );
  }

  return (
    <div className="grain">
      <div className="vignette fixed inset-0 -z-20" data-time={daypart()} />
      {hasWebGL() ? (
        <Suspense fallback={null}><CafeScene /></Suspense>
      ) : (
        /* no 3D available: a real photo stands in for the cup */
        <img src={SHOTS.latteArt.src} alt="" aria-hidden="true" className="pointer-events-none absolute right-[6%] top-[18vh] -z-10 hidden w-[34vw] max-w-[460px] rounded-[40px] opacity-90 shadow-2xl md:block" />
      )}
      <Intro />
      <Navbar />
      <main>
        <Hero />
        <Experience />
        <Menu />
        <Favourites />
        <Gather />
        <Visit />
        <Reserve />
      </main>
      <Footer />
      <CartDrawer />
      <FloatingOrderBar />
      <StaffButton />
      <Toast />
    </div>
  );
}
