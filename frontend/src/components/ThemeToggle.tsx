import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '@/store';

/** Sun / moon button that switches the whole site between the light and dark theme. */
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button type="button" onClick={toggle} aria-pressed={dark} title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-crema/20 text-crema transition hover:border-caramel hover:text-caramel ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.svg key={theme} viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"
          initial={{ rotate: -90, scale: 0.4, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} exit={{ rotate: 90, scale: 0.4, opacity: 0 }} transition={{ duration: 0.3 }}>
          {dark
            ? <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            : <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>}
        </motion.svg>
      </AnimatePresence>
    </button>
  );
}
