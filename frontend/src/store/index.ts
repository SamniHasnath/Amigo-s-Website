import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AdminUser, CafeSettings, CategoryWithCount, MenuItem } from '@/types';
import { DEFAULT_SETTINGS } from '@/data/settings';
import { api } from '@/lib/api';

// Safe storage: some browsers/frames block localStorage.
const safeStorage = createJSONStorage(() => {
  try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return localStorage; }
  catch { const m = new Map<string, string>(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) }; }
});

/* ---------------- Menu ---------------- */
interface MenuState {
  items: MenuItem[];
  categories: CategoryWithCount[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
}
export const useMenu = create<MenuState>((set) => ({
  items: [],
  categories: [],
  loading: false,
  error: null,
  load: async () => {
    set({ loading: true, error: null });
    try {
      const [items, categories] = await Promise.all([api.menu(), api.categories()]);
      set({ items, categories, loading: false });
    } catch (e) { set({ error: (e as Error).message, loading: false }); }
  },
}));

/* ---------------- Café settings ---------------- */
interface SettingsState { settings: CafeSettings; loaded: boolean; load: () => Promise<void>; set: (s: CafeSettings) => void }
export const useSettings = create<SettingsState>((set) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,
  load: async () => { try { set({ settings: await api.settings(), loaded: true }); } catch { set({ loaded: true }); } },
  set: (settings) => set({ settings }),
}));

/* ---------------- Cart ---------------- */
export interface CartLine { id: number; name: string; price: number; qty: number }
interface CartState {
  lines: CartLine[];
  open: boolean;
  add: (m: MenuItem) => void;
  setQty: (id: number, qty: number) => void;
  clear: () => void;
  /** take a dish out of the order completely, whatever its quantity */
  remove: (id: number) => void;
  /** put back a previous set of lines (used by "Undo") */
  restore: (lines: CartLine[]) => void;
  setOpen: (o: boolean) => void;
}
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      open: false,
      add: (m) => set((s) => {
        const found = s.lines.find((l) => l.id === m.id);
        return {
          lines: found
            ? s.lines.map((l) => (l.id === m.id ? { ...l, qty: Math.min(20, l.qty + 1) } : l))
            : [...s.lines, { id: m.id, name: m.name, price: m.price, qty: 1 }],
        };
      }),
      setQty: (id, qty) => set((s) => ({
        lines: qty <= 0 ? s.lines.filter((l) => l.id !== id) : s.lines.map((l) => (l.id === id ? { ...l, qty: Math.min(20, qty) } : l)),
      })),
      clear: () => set({ lines: [] }),
      remove: (id) => set((s) => ({ lines: s.lines.filter((l) => l.id !== id) })),
      restore: (lines) => set({ lines }),
      setOpen: (open) => set({ open }),
    }),
    { name: 'amigos-cart', storage: safeStorage, partialize: (s) => ({ lines: s.lines }) },
  ),
);
export const cartTotal = (lines: CartLine[]) => lines.reduce((s, l) => s + l.price * l.qty, 0);
export const cartCount = (lines: CartLine[]) => lines.reduce((s, l) => s + l.qty, 0);

/* ---------------- Auth ---------------- */
interface AuthState {
  token: string | null;
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: async (email, password) => {
        const res = await api.login(email, password);
        set({ token: res.accessToken, user: res.user });
      },
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'amigos-auth', storage: safeStorage },
  ),
);

/* ---------------- Toasts ---------------- */
interface ToastState { msg: string | null; show: (m: string) => void }
let toastTimer: ReturnType<typeof setTimeout> | undefined;
export const useToast = create<ToastState>((set) => ({
  msg: null,
  show: (msg) => {
    clearTimeout(toastTimer);
    set({ msg });
    toastTimer = setTimeout(() => set({ msg: null }), 2600);
  },
}));

/* ---------------- 3D scene coordination ---------------- */
interface SceneState { menuVisible: boolean; setMenuVisible: (v: boolean) => void }
/** When the 3D menu is on screen the background hero scene pauses, so only one canvas renders. */
export const useScene = create<SceneState>((set) => ({ menuVisible: false, setMenuVisible: (menuVisible) => set({ menuVisible }) }));

/* ---------------- Light / dark theme ---------------- */
export type Theme = 'light' | 'dark';
interface ThemeState { theme: Theme; toggle: () => void }
export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({ theme: 'light', toggle: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }) }),
    { name: 'amigos-theme', storage: safeStorage },
  ),
);
/** Puts the theme on <html> so every colour variable flips (see src/index.css). */
export function applyTheme(t: Theme) {
  document.documentElement.classList.toggle('theme-dark', t === 'dark');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#21130E' : '#F6EFE4');
}
