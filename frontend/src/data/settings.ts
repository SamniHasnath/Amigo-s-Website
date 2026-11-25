import type { CafeSettings } from '@/types';
import { SHOTS } from './gallery';

/** Defaults until the café saves its own (keep in sync with backend/src/settings/defaults.ts). */
export const DEFAULT_SETTINGS: CafeSettings = {
  cafeName: "Amigo's Cafe",
  tagline: 'Good Coffee • Great Food • Good Times',
  address: '280 Main Street, Trincomalee 31000',
  phone: '077 838 2367',
  email: '',
  instagram: 'https://www.instagram.com/amigos_trinco/',
  tiktok: 'https://www.tiktok.com/@amigos_trinco',
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Amigo's+Cafe+280+Main+St+Trincomalee",
  openTime: '11:00',
  closeTime: '23:00',
  closedDays: [],
  orderingEnabled: true,
  reservationsEnabled: true,
  announcementEnabled: false,
  announcementText: '',
  rating: '5.0',
  reviews: 65,
  pricePerPerson: 'Rs 1,000–2,000',
  gallery: [SHOTS.coffeeBar, SHOTS.icedLatte, SHOTS.caramelShake, SHOTS.sandwichTable, SHOTS.brownieServed, SHOTS.barDrink, SHOTS.chocoAvalanche]
    .map(({ src, alt, caption }) => ({ src, alt, caption })),
  showLatteArt: true,
};

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
