// Tiny hash router: each important part of the site is its own page.
//   #/            Home (hero, dish strip, about, favourites)
//   #/menu        Menu
//   #/gallery     Gallery
//   #/visit       Visit
//   #/reserve     Reserve
//   #/about, #/favourites   Home, scrolled to that section
//   #admin        staff panel (handled in App)
// Hash URLs need no server setup and work with the relative build (vite base './').
// Old one-page links (#menu, #gather, …) are redirected to the new pages.
import { useSyncExternalStore } from 'react';

export type Page = 'home' | 'menu' | 'gallery' | 'visit' | 'reserve';
export const PAGES: Page[] = ['home', 'menu', 'gallery', 'visit', 'reserve'];

/** Sections on the home page that a link can jump to: route name -> element id */
const HOME_SECTIONS: Record<string, string> = { about: 'experience', favourites: 'favourites' };
/** Old single-page anchors -> new routes */
const LEGACY: Record<string, string> = {
  '#hero': '#/', '#experience': '#/about', '#favourites': '#/favourites',
  '#menu': '#/menu', '#gather': '#/gallery', '#visit': '#/visit', '#reserve': '#/reserve',
};

export interface Route { page: Page; section: string | null }

function parse(hash: string): Route {
  const name = hash.replace(/^#\/?/, '').split(/[?/]/)[0];
  if (PAGES.includes(name as Page) && name !== 'home') return { page: name as Page, section: null };
  return { page: 'home', section: HOME_SECTIONS[name] ?? null };
}

function redirectLegacy() {
  const to = LEGACY[window.location.hash];
  if (to) history.replaceState(null, '', to);
}
redirectLegacy();

let current = parse(window.location.hash);
const listeners = new Set<() => void>();
window.addEventListener('hashchange', () => {
  redirectLegacy();
  // always a new object, so following the same section link again scrolls to it again
  current = parse(window.location.hash);
  listeners.forEach((l) => l());
});

export function useRoute(): Route {
  return useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, () => current);
}

/** href for a page, e.g. href('menu') -> '#/menu' */
export const href = (page: Page | 'about' | 'favourites') => (page === 'home' ? '#/' : `#/${page}`);

export function navigate(page: Page | 'about' | 'favourites') {
  const h = href(page);
  if (window.location.hash === h) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else window.location.hash = h;
}

/* A dish asked for from another page (Favourites "View in 3D", the dish strip):
   the Menu page picks it up when it mounts. */
let pendingDish: number | null = null;
export const setPendingDish = (id: number) => { pendingDish = id; };
export const currentPage = () => current.page;
export const takePendingDish = () => { const id = pendingDish; pendingDish = null; return id; };
