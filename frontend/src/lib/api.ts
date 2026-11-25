// One API surface for the whole app.
// - VITE_API_URL set  -> real NestJS REST API (axios + JWT bearer token)
// - VITE_API_URL empty -> in-browser mock (src/lib/mockApi.ts)
import axios, { AxiosError } from 'axios';
import { ApiError, mockApi } from './mockApi';
import type {
  AuthResponse, CafeSettings, Category, CategoryWithCount, CreateOrderDto, CreateReservationDto, MenuItem, MenuItemInput,
  Order, OrderStatus, Reservation, ReservationStatus,
} from '@/types';

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || '';
export const USING_MOCK = !BASE;
export { ApiError };

const http = axios.create({ baseURL: BASE, timeout: 10000 });

async function call<T>(p: Promise<{ data: T }>): Promise<T> {
  try {
    return (await p).data;
  } catch (e) {
    const err = e as AxiosError<{ message?: string | string[] }>;
    const msg = err.response?.data?.message;
    throw new ApiError(err.response?.status ?? 0, Array.isArray(msg) ? msg.join(' ') : msg || 'Could not reach the server.');
  }
}
const auth = (token: string | null) => ({ headers: { Authorization: `Bearer ${token ?? ''}` } });

export const api = {
  login: (email: string, password: string) =>
    USING_MOCK ? mockApi.login(email, password) : call<AuthResponse>(http.post('/auth/login', { email, password })),

  changePassword: (token: string | null, currentPassword: string, newPassword: string) =>
    USING_MOCK ? mockApi.changePassword(token, currentPassword, newPassword)
      : call<{ ok: boolean }>(http.patch('/auth/password', { currentPassword, newPassword }, auth(token))),

  settings: () => (USING_MOCK ? mockApi.settings() : call<CafeSettings>(http.get('/settings'))),
  updateSettings: (token: string | null, dto: Partial<CafeSettings>) =>
    USING_MOCK ? mockApi.updateSettings(token, dto) : call<CafeSettings>(http.patch('/settings', dto, auth(token))),

  categories: () => (USING_MOCK ? mockApi.categories() : call<CategoryWithCount[]>(http.get('/categories'))),
  createCategory: (token: string | null, name: string) =>
    USING_MOCK ? mockApi.createCategory(token, name) : call<Category>(http.post('/categories', { name }, auth(token))),
  updateCategory: (token: string | null, id: number, dto: Partial<Pick<Category, 'name' | 'sortOrder'>>) =>
    USING_MOCK ? mockApi.updateCategory(token, id, dto) : call<Category>(http.patch(`/categories/${id}`, dto, auth(token))),
  deleteCategory: (token: string | null, id: number) =>
    USING_MOCK ? mockApi.deleteCategory(token, id) : call<void>(http.delete(`/categories/${id}`, auth(token))),
  menu: () => (USING_MOCK ? mockApi.menu() : call<MenuItem[]>(http.get('/menu-items'))),

  createMenuItem: (token: string | null, dto: MenuItemInput) =>
    USING_MOCK ? mockApi.createMenuItem(token, dto) : call<MenuItem>(http.post('/menu-items', dto, auth(token))),
  updateMenuItem: (token: string | null, id: number, dto: Partial<MenuItemInput>) =>
    USING_MOCK ? mockApi.updateMenuItem(token, id, dto) : call<MenuItem>(http.patch(`/menu-items/${id}`, dto, auth(token))),
  deleteMenuItem: (token: string | null, id: number) =>
    USING_MOCK ? mockApi.deleteMenuItem(token, id) : call<void>(http.delete(`/menu-items/${id}`, auth(token))),

  createOrder: (dto: CreateOrderDto) => (USING_MOCK ? mockApi.createOrder(dto) : call<Order>(http.post('/orders', dto))),
  orders: (token: string | null) => (USING_MOCK ? mockApi.orders(token) : call<Order[]>(http.get('/orders', auth(token)))),
  setOrderStatus: (token: string | null, id: number, status: OrderStatus) =>
    USING_MOCK ? mockApi.setOrderStatus(token, id, status) : call<Order>(http.patch(`/orders/${id}/status`, { status }, auth(token))),

  createReservation: (dto: CreateReservationDto) =>
    USING_MOCK ? mockApi.createReservation(dto) : call<Reservation>(http.post('/reservations', dto)),
  reservations: (token: string | null) =>
    USING_MOCK ? mockApi.reservations(token) : call<Reservation[]>(http.get('/reservations', auth(token))),
  setReservationStatus: (token: string | null, id: number, status: ReservationStatus) =>
    USING_MOCK
      ? mockApi.setReservationStatus(token, id, status)
      : call<Reservation>(http.patch(`/reservations/${id}/status`, { status }, auth(token))),
};

export const rs = (n: number) => `Rs ${n.toLocaleString('en-LK')}`;

/** Turns a stored image path into something an <img> or texture can load:
 *  /uploads/... -> served by the NestJS API; menu/... -> bundled in frontend/public; data:/http -> as is. */
export function imageSrc(url: string): string {
  if (/^(https?:|data:|blob:)/.test(url)) return url;
  if (url.startsWith('/uploads/')) return BASE.replace(/\/api\/?$/, '') + url;
  return import.meta.env.BASE_URL + url.replace(/^\//, '');
}

/** Shrinks a photo in the browser (max 900px, WebP keeps transparency) before upload. */
async function shrink(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, 900 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob((b) => res(b ?? file), 'image/webp', 0.86));
}

/** Uploads a real 3D model (.glb, max 15 MB). In demo mode it stays in this browser only. */
export async function uploadModel(token: string | null, file: File): Promise<string> {
  if (!/\.glb$/i.test(file.name)) throw new ApiError(400, 'Please choose a .glb 3D model file.');
  if (file.size > 15 * 1024 * 1024) throw new ApiError(400, 'The 3D model must be 15 MB or smaller.');
  if (USING_MOCK) {
    if (file.size > 3 * 1024 * 1024) throw new ApiError(400, 'In demo mode models must be under 3 MB (they are kept in the browser). Connect the backend for bigger files.');
    return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(new ApiError(0, 'Could not read the file.')); r.readAsDataURL(file); });
  }
  const form = new FormData();
  form.append('file', file, file.name);
  const { url } = await call<{ url: string }>(http.post('/uploads', form, auth(token)));
  return url;
}

export async function uploadImage(token: string | null, file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new ApiError(400, 'Please choose a PNG, JPG or WebP image.');
  const small = await shrink(file);
  if (USING_MOCK) {
    // demo mode: keep the picture inside the browser as a data URL
    return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(new ApiError(0, 'Could not read the file.')); r.readAsDataURL(small); });
  }
  const form = new FormData();
  form.append('file', small, file.name.replace(/\.[^.]+$/, '') + '.webp');
  const { url } = await call<{ url: string }>(http.post('/uploads', form, auth(token)));
  return url;
}
