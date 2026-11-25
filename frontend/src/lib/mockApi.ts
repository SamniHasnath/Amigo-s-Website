// A tiny in-browser stand-in for the NestJS API, used when VITE_API_URL is empty.
// It behaves like the real endpoints (same shapes, same validation rules)
// and keeps its data in localStorage, so the site works with no backend running.
import { CATEGORIES, PHOTOS, SEED_MENU } from '@/data/menu';
import { DEFAULT_SETTINGS } from '@/data/settings';
import { toMin } from './hours';
import type {
  AuthResponse, CafeSettings, Category, CategoryWithCount, CreateOrderDto, CreateReservationDto, MenuItem, MenuItemInput,
  Order, OrderStatus, Reservation, ReservationStatus,
} from '@/types';

export const MOCK_ADMIN = { email: 'admin@amigos.lk', password: 'amigos123' };

interface DB {
  menu: MenuItem[]; categories: Category[]; orders: Order[]; reservations: Reservation[];
  settings: CafeSettings; adminPassword: string; seq: number;
}
const KEY = 'amigos-mock-db-v5';
let memory: DB | null = null;

function load(): DB {
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      memory = JSON.parse(raw) as DB;
      // Auto-populate photos for any items missing real images
      let updated = false;
      memory.menu.forEach((m) => {
        if (!m.imageUrl && PHOTOS[m.name]) {
          m.imageUrl = PHOTOS[m.name];
          updated = true;
        }
      });
      if (updated) save(memory);
      return memory;
    }
  } catch { /* storage unavailable: keep in memory */ }
  memory = {
    menu: structuredClone(SEED_MENU), categories: structuredClone(CATEGORIES), orders: [], reservations: [],
    settings: { ...DEFAULT_SETTINGS }, adminPassword: MOCK_ADMIN.password, seq: 1000,
  };
  return memory;
}
function save(db: DB, strict = false) {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { if (strict) throw e; }
  memory = db;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const delay = <T,>(v: T, ms = 250) => new Promise<T>((r) => setTimeout(() => r(structuredClone(v)), ms));
const withCategory = (db: DB) => (m: MenuItem): MenuItem => ({ ...m, category: db.categories.find((c) => c.id === m.categoryId) });
const requireAdmin = (token?: string | null) => {
  if (!token || !token.startsWith('mock.')) throw new ApiError(401, 'Please log in again.');
};
const phoneOk = (p: string) => /^(?:\+94|0)7\d{8}$/.test(p.replace(/[\s-]/g, ''));
const slugify = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const mockApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    await delay(null, 400);
    if (email.trim().toLowerCase() !== MOCK_ADMIN.email || password !== load().adminPassword)
      throw new ApiError(401, 'Wrong email or password.');
    return { accessToken: `mock.${btoa(email)}.${Date.now()}`, user: { id: 1, email, name: 'Amigo Admin', role: 'ADMIN' } };
  },

  async changePassword(token: string | null, currentPassword: string, newPassword: string) {
    requireAdmin(token);
    const db = load();
    if (currentPassword !== db.adminPassword) throw new ApiError(401, 'Your current password is not correct.');
    if (newPassword.length < 8) throw new ApiError(400, 'New password must be at least 8 characters.');
    db.adminPassword = newPassword; save(db);
    return delay({ ok: true });
  },

  /* ---------- settings ---------- */
  async settings(): Promise<CafeSettings> { return delay({ ...DEFAULT_SETTINGS, ...load().settings }, 150); },
  async updateSettings(token: string | null, dto: Partial<CafeSettings>): Promise<CafeSettings> {
    requireAdmin(token);
    const db = load();
    const next = { ...DEFAULT_SETTINGS, ...db.settings, ...dto };
    if (toMin(next.closeTime) <= toMin(next.openTime)) throw new ApiError(400, 'Closing time must be after opening time.');
    if (next.gallery.length > 12) throw new ApiError(400, 'The gallery can hold up to 12 photos.');
    const prev = db.settings;
    db.settings = next;
    try { save(db, true); } catch { db.settings = prev; throw new ApiError(400, 'This browser is out of space for more photos (demo mode). Remove a photo or use smaller ones.'); }
    return delay(next);
  },

  /* ---------- categories ---------- */
  async categories(): Promise<CategoryWithCount[]> {
    const db = load();
    return delay([...db.categories].sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => ({ ...c, _count: { items: db.menu.filter((m) => m.categoryId === c.id).length } })));
  },
  async createCategory(token: string | null, name: string): Promise<Category> {
    requireAdmin(token);
    const db = load();
    const slug = slugify(name);
    if (name.trim().length < 2) throw new ApiError(400, 'Please enter a category name.');
    if (db.categories.some((c) => c.slug === slug)) throw new ApiError(400, 'A category with that name already exists.');
    const c: Category = { id: Math.max(0, ...db.categories.map((x) => x.id)) + 1, name: name.trim(), slug, sortOrder: Math.max(0, ...db.categories.map((x) => x.sortOrder)) + 1 };
    db.categories.push(c); save(db);
    return delay(c);
  },
  async updateCategory(token: string | null, id: number, dto: Partial<Pick<Category, 'name' | 'sortOrder'>>): Promise<Category> {
    requireAdmin(token);
    const db = load();
    const c = db.categories.find((x) => x.id === id);
    if (!c) throw new ApiError(404, 'Category not found.');
    Object.assign(c, dto); save(db);
    return delay(c);
  },
  async deleteCategory(token: string | null, id: number): Promise<void> {
    requireAdmin(token);
    const db = load();
    const n = db.menu.filter((m) => m.categoryId === id).length;
    if (n) throw new ApiError(400, `This category still has ${n} item(s). Move or delete them first.`);
    db.categories = db.categories.filter((c) => c.id !== id); save(db);
    await delay(null);
  },

  /* ---------- menu ---------- */
  async menu(): Promise<MenuItem[]> {
    const db = load();
    const order = new Map(db.categories.map((c) => [c.id, c.sortOrder]));
    return delay(db.menu.map(withCategory(db)).sort((a, b) => (order.get(a.categoryId) ?? 0) - (order.get(b.categoryId) ?? 0) || a.sortOrder - b.sortOrder));
  },
  async createMenuItem(token: string | null, dto: MenuItemInput): Promise<MenuItem> {
    requireAdmin(token);
    const db = load();
    const item: MenuItem = { ...dto, id: Math.max(0, ...db.menu.map((m) => m.id)) + 1 };
    db.menu.push(item); save(db);
    return delay(withCategory(db)(item));
  },
  async updateMenuItem(token: string | null, id: number, dto: Partial<MenuItemInput>): Promise<MenuItem> {
    requireAdmin(token);
    const db = load();
    const i = db.menu.findIndex((m) => m.id === id);
    if (i < 0) throw new ApiError(404, 'Menu item not found.');
    db.menu[i] = { ...db.menu[i], ...dto }; save(db);
    return delay(withCategory(db)(db.menu[i]));
  },
  async deleteMenuItem(token: string | null, id: number): Promise<void> {
    requireAdmin(token);
    const db = load();
    db.menu = db.menu.filter((m) => m.id !== id); save(db);
    await delay(null);
  },

  /* ---------- orders ---------- */
  async createOrder(dto: CreateOrderDto): Promise<Order> {
    const db = load();
    if (!db.settings.orderingEnabled) throw new ApiError(400, `Online ordering is paused right now. Please call us on ${db.settings.phone}.`);
    if (dto.customerName.trim().length < 2) throw new ApiError(400, 'Please enter your name.');
    if (!phoneOk(dto.phone)) throw new ApiError(400, 'Please enter a valid Sri Lankan mobile number.');
    if (!dto.items.length) throw new ApiError(400, 'Your order is empty.');
    const items = dto.items.map((it, idx) => {
      const m = db.menu.find((x) => x.id === it.menuItemId && x.isAvailable);
      if (!m) throw new ApiError(400, 'An item in your order is no longer available.');
      return { id: idx + 1, menuItemId: m.id, name: m.name, unitPrice: m.price, quantity: it.quantity };
    });
    db.seq += 1;
    const order: Order = {
      id: db.seq, orderNumber: `AM-${db.seq}`, customerName: dto.customerName.trim(), phone: dto.phone.replace(/[\s-]/g, ''),
      type: dto.type, note: dto.note || null, status: 'PENDING',
      total: items.reduce((s, i) => s + i.unitPrice * i.quantity, 0), items, createdAt: new Date().toISOString(),
    };
    db.orders.unshift(order); save(db);
    return delay(order, 600);
  },
  async orders(token: string | null): Promise<Order[]> { requireAdmin(token); return delay(load().orders); },
  async setOrderStatus(token: string | null, id: number, status: OrderStatus): Promise<Order> {
    requireAdmin(token);
    const db = load();
    const o = db.orders.find((x) => x.id === id);
    if (!o) throw new ApiError(404, 'Order not found.');
    o.status = status; save(db);
    return delay(o);
  },

  /* ---------- reservations ---------- */
  async createReservation(dto: CreateReservationDto): Promise<Reservation> {
    const db = load(); const s = db.settings;
    if (!s.reservationsEnabled) throw new ApiError(400, 'Table bookings are paused right now. Please call us.');
    if (dto.name.trim().length < 2) throw new ApiError(400, 'Please enter your name.');
    if (!phoneOk(dto.phone)) throw new ApiError(400, 'Please enter a valid Sri Lankan mobile number.');
    if (dto.guests < 1 || dto.guests > 20) throw new ApiError(400, 'Guests must be between 1 and 20.');
    if (s.closedDays.includes(new Date(dto.date + 'T00:00:00Z').getUTCDay())) throw new ApiError(400, 'We are closed on that day. Please pick another date.');
    const t = toMin(dto.time);
    if (t < toMin(s.openTime) || t > toMin(s.closeTime) - 30) throw new ApiError(400, 'Please pick a time within our opening hours.');
    db.seq += 1;
    const r: Reservation = { id: db.seq, ...dto, phone: dto.phone.replace(/[\s-]/g, ''), note: dto.note || null, status: 'PENDING', createdAt: new Date().toISOString() };
    db.reservations.unshift(r); save(db);
    return delay(r, 600);
  },
  async reservations(token: string | null): Promise<Reservation[]> {
    requireAdmin(token);
    return delay([...load().reservations].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)));
  },
  async setReservationStatus(token: string | null, id: number, status: ReservationStatus): Promise<Reservation> {
    requireAdmin(token);
    const db = load();
    const r = db.reservations.find((x) => x.id === id);
    if (!r) throw new ApiError(404, 'Reservation not found.');
    r.status = status; save(db);
    return delay(r);
  },

  reset() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } memory = null; },
};
