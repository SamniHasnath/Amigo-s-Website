// These types mirror the NestJS DTOs and Prisma models in /backend.

export interface Category {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  /** Price in Sri Lankan rupees (whole rupees). */
  price: number;
  section: string;
  categoryId: number;
  category?: Category;
  isPopular: boolean;
  isAvailable: boolean;
  sortOrder: number;
  /** Photo of the dish: a cut-out PNG/WebP with a transparent background looks best on the plate. */
  imageUrl?: string | null;
  /** Optional real 3D model of the dish (.glb), e.g. scanned with a phone app. Shown instead of the photo. */
  modelUrl?: string | null;
}

export type MenuItemInput = Omit<MenuItem, 'id' | 'category'>;

export type OrderType = 'DINE_IN' | 'TAKEAWAY';
export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
  id: number;
  menuItemId: number;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  phone: string;
  type: OrderType;
  note?: string | null;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  createdAt: string;
}

export interface CreateOrderDto {
  customerName: string;
  phone: string;
  type: OrderType;
  note?: string;
  items: { menuItemId: number; quantity: number }[];
}

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface Reservation {
  id: number;
  name: string;
  phone: string;
  /** yyyy-mm-dd */
  date: string;
  /** HH:mm, 24-hour */
  time: string;
  guests: number;
  note?: string | null;
  status: ReservationStatus;
  createdAt: string;
}

export interface CreateReservationDto {
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  note?: string;
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN';
}

export interface AuthResponse {
  accessToken: string;
  user: AdminUser;
}

/** Editable café settings (GET/PATCH /api/settings). */
export interface CafeSettings {
  cafeName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  instagram: string;
  tiktok: string;
  mapsUrl: string;
  /** HH:mm, 24-hour */
  openTime: string;
  closeTime: string;
  /** 0 = Sunday … 6 = Saturday */
  closedDays: number[];
  orderingEnabled: boolean;
  reservationsEnabled: boolean;
  announcementEnabled: boolean;
  announcementText: string;
  rating: string;
  reviews: number;
  pricePerPerson: string;
  /** Photos in the "A place to gather" gallery, in order (max 12). */
  gallery: GalleryPhoto[];
  /** Show the "draw your own latte art" game on the home page. */
  showLatteArt: boolean;
}

/** One photo in the website gallery. src is a /uploads/… URL, a bundled gallery/… path or (demo mode) a data URL. */
export interface GalleryPhoto {
  src: string;
  alt: string;
  caption: string;
}

export interface CategoryWithCount extends Category {
  _count?: { items: number };
}
