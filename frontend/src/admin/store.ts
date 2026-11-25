// Admin-only data: orders and reservations, refreshed automatically.
import { create } from 'zustand';
import { api, ApiError } from '@/lib/api';
import { useAuth, useToast } from '@/store';
import type { Order, OrderStatus, Reservation, ReservationStatus } from '@/types';

interface AdminState {
  orders: Order[];
  reservations: Reservation[];
  loading: boolean;
  lastSync: number;
  /** ids seen so far, so new arrivals can be announced */
  seen: Set<string>;
  refresh: (opts?: { quiet?: boolean }) => Promise<void>;
  setOrderStatus: (id: number, status: OrderStatus) => Promise<void>;
  setReservationStatus: (id: number, status: ReservationStatus) => Promise<void>;
}

const fail = (e: unknown) => {
  if (e instanceof ApiError && e.status === 401) { useAuth.getState().logout(); return; }
  useToast.getState().show((e as Error).message);
};

export const useAdmin = create<AdminState>((set, get) => ({
  orders: [],
  reservations: [],
  loading: true,
  lastSync: 0,
  seen: new Set(),
  refresh: async ({ quiet } = {}) => {
    const token = useAuth.getState().token;
    if (!quiet) set({ loading: true });
    try {
      const [orders, reservations] = await Promise.all([api.orders(token), api.reservations(token)]);
      const { seen, lastSync } = get();
      if (lastSync) {
        const newOrders = orders.filter((o) => !seen.has('o' + o.id));
        const newRes = reservations.filter((r) => !seen.has('r' + r.id));
        if (newOrders.length) useToast.getState().show(`New order ${newOrders[0].orderNumber} from ${newOrders[0].customerName}`);
        else if (newRes.length) useToast.getState().show(`New table request from ${newRes[0].name}`);
      }
      const next = new Set<string>([...orders.map((o) => 'o' + o.id), ...reservations.map((r) => 'r' + r.id)]);
      set({ orders, reservations, loading: false, lastSync: Date.now(), seen: next });
    } catch (e) { set({ loading: false }); fail(e); }
  },
  setOrderStatus: async (id, status) => {
    try {
      const o = await api.setOrderStatus(useAuth.getState().token, id, status);
      set({ orders: get().orders.map((x) => (x.id === id ? o : x)) });
    } catch (e) { fail(e); }
  },
  setReservationStatus: async (id, status) => {
    try {
      const r = await api.setReservationStatus(useAuth.getState().token, id, status);
      set({ reservations: get().reservations.map((x) => (x.id === id ? r : x)) });
    } catch (e) { fail(e); }
  },
}));

export { fail as handleAdminError };
