import { motion } from 'framer-motion';
import { useAuth } from '@/store';
import { HAS_ADMIN } from '@/lib/staffPanelLoader';

/** Small button in the bottom-left corner that opens the admin panel. */
export default function StaffButton() {
  const loggedIn = useAuth((s) => !!s.token);
  if (!HAS_ADMIN) return null;
  return (
    <motion.a href="#admin" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2 }}
      className="group fixed bottom-5 left-5 z-50 hidden h-12 lg:flex items-center gap-2 overflow-hidden rounded-full border border-crema/20 bg-espresso/80 pl-3.5 pr-3 text-sm font-semibold text-crema shadow-2xl backdrop-blur-md transition-all hover:border-caramel hover:pr-5 hover:text-caramel"
      aria-label={loggedIn ? 'Open the admin panel' : 'Staff login'}>
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        {loggedIn
          ? <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>
          : <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>}
      </svg>
      <span className="max-w-0 whitespace-nowrap opacity-0 transition-all group-hover:max-w-[120px] group-hover:opacity-100 group-focus-visible:max-w-[120px] group-focus-visible:opacity-100">
        {loggedIn ? 'Admin' : 'Staff login'}
      </span>
      {loggedIn && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-mint" aria-hidden="true" />}
    </motion.a>
  );
}
