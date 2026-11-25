# Amigo's Cafe — 3D animated website

Website for **Amigo's Cafe, 280 Main Street, Trincomalee**: a cinematic, food-and-coffee experience with real online ordering, table reservations and an admin panel the café runs itself.

## The page, top to bottom
1. **Hero** — “Good food. Great coffee. Better moments.” A 3D latte cup with steam (livelier when you hover it) turns and tilts with the mouse; a few coffee beans, cookies, cinnamon, mint, croissants and soft orange/gold sparkles float around it.
2. **The Amigo's experience** — the cup tips forward to show its latte art; real café photos drift past in layers.
3. **Explore our menu (3D)** — each dish sits on a marble counter under the AMIGO'S sign. Swipe, use ← → or tap a name and the plate slides out and the next slides in. Glass price card with description, price, availability and Add to order. Real **.glb 3D models** can be dragged to turn; real **photos** get a gentle zoom/parallax (they don't pretend to rotate); items with neither show a drawn 3D illustration. List view one tap away. **Make it yours**: build a drink from real menu drinks + the café's real add-ons.
4. **Signature favourites** — popular dishes with real photos; hover to swap, add, or jump to the dish in the 3D menu.
5. **A place to gather** — editorial gallery of real café photos revealed on scroll, plus a small latte-art toy (draw on the foam).
6. **Visit Amigo's** — address, hours, phone, directions (all from Café settings).
7. **Order or reserve** — open/closed status, order online, request a table.

**Look:** light bakery-café style — warm cream page `#F6EFE4`, dark-brown text `#4A2C1A`, rust accent `#B4572B`, soft bold serif headings (Fraunces) and handwritten notes (Caveat). The 3D menu stage, the favourites photo frame and the footer are brown "kraft" panels (`.theme-dark`, using the original Espresso `#21130E` / Dark Chocolate `#302018` / Caramel `#E3AA65` / Cream `#F3E7D5`) so the real dish photos sit naturally. All colours are CSS variables in `frontend/src/index.css`. A sun/moon button (top bar, phone menu, admin) switches the whole site between the light and dark theme; the choice is remembered per visitor.

**Atmosphere:** lighting is brighter with warm sunlight in the day (6 AM–5 PM Sri Lanka time) and darker amber in the evening.

**Adding to an order:** the dish (or a gold dot) flies to the Order button, which bumps; the cart, totals, checkout, order numbers and takeaway/dine-in work as before.

**Performance & access:** only one 3D scene renders at a time (the hero pauses while the 3D menu is on screen, and the menu pauses when off screen); fewer floating objects on phones; sections and the drink builder load lazily; tilt effects are off on touch screens; reduced-motion is respected; without WebGL the hero shows a real photo and the menu opens in list view.

## Admin panel (for the café staff)

Open it with the round **staff button in the bottom-left corner** of the website, the **Staff login** link in the footer, or by adding `#admin` to the address.

| Page | What the café can do |
|---|---|
| **Dashboard** | Today's orders, sales and table bookings · switch online orders, table bookings and the announcement bar on/off · orders waiting with one-tap “Start preparing / Mark ready / Collected” · today's tables · last 7 days of sales · best sellers |
| **Orders** | Board with New → Preparing → Ready → Done columns, call the customer, cancel/restore, search, today or all |
| **Reservations** | Upcoming / today / past, grouped by day with guest totals, call, confirm or cancel |
| **Menu items** | Add, edit, delete, change prices, upload dish photos or real 3D models (.glb), switch items on/off sale (shown as “Sold out today” on the site) and mark them popular |
| **Categories** | Add, rename, reorder (arrows) and delete empty categories — these are the menu tabs |
| **Gallery** | Add up to 12 photos (resized automatically), write captions, reorder with arrows, remove photos, reset to the original photos, and show/hide the “draw your own latte art” card. Changes show in the “A place to gather” section after **Save gallery** |
| **Café settings** | Name, tagline, address, phone, email, Google Maps / Instagram / TikTok links, opening hours and closed days, announcement message, rating shown on the home page |
| **Account** | Change the admin password, log out |

New orders and table requests are checked every 20 seconds: a pop-up message appears, the sidebar shows red-dot counts and the browser tab shows the number waiting.

## Tech stack (as required)

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Tailwind CSS (Vite) |
| 3D / animation | three.js via React Three Fiber + drei, Framer Motion |
| Backend | NestJS + TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT (passport-jwt, bcrypt-hashed passwords) |
| API style | REST (`/api/...`) |
| Validation | NestJS DTOs + class-validator |
| Package / version control | npm + Git |
| API testing | Postman (`backend/amigos-cafe.postman_collection.json`, also importable in Bruno) |

## Folder structure

```
amigos-cafe-3d/
├── frontend/                 React + TS + Tailwind
│   └── src/
│       ├── three/            3D background (CafeScene.tsx), cup/beans/croissant
│       │   └── food/         3D menu: ShowcaseScene, ModelDish (.glb), PhotoDish, FoodModels (drawn dishes), dishFor, textures
│       ├── components/       Navbar, Hero, Experience, Menu (+ MenuShowcase, DrinkBuilder), Favourites, Gather (+ LatteArt), Visit, Reserve, CartDrawer, Footer, StaffButton
│       ├── admin/            Admin login, dashboard, menu manager
│       ├── lib/              api.ts (REST client), mockApi.ts (works without backend), hours.ts
│       ├── store/            Zustand stores: menu, cart, auth, toast
│       ├── data/menu.ts      Real menu + café details
│       └── types/            Types matching the backend DTOs
└── backend/                  NestJS + Prisma
    ├── prisma/schema.prisma  Database tables
    ├── prisma/seed.ts        Seeds the full menu + first admin
    └── src/
        ├── auth/             POST /auth/login, GET /auth/me, JWT guard
        ├── categories/       GET /categories
        ├── menu/             CRUD /menu-items (write = admin only)
        ├── orders/           POST /orders (public), GET + PATCH status (admin)
        └── reservations/     POST /reservations (public), GET + PATCH status (admin)
```

## Run it (Windows 11, Git Bash)

You need **Node.js 20+** and **PostgreSQL 15+** (installer from postgresql.org; remember the password you set for the `postgres` user).

### 1. Database
Open **pgAdmin** (or `psql`) and create a database called `amigos_cafe`.

### 2. Backend
```bash
cd backend
cp .env.example .env          # then edit DATABASE_URL with your postgres password
npm install
npx prisma migrate dev --name init   # creates the tables
npm run prisma:seed                  # adds the menu + admin user
npm run start:dev                    # API on http://localhost:3000/api
```
Check: open http://localhost:3000/api/health and http://localhost:3000/api/menu-items

### 3. Frontend
```bash
cd frontend
cp .env.example .env
# in .env set:  VITE_API_URL=http://localhost:3000/api
npm install
npm run dev                          # http://localhost:5173
```

- **Website:** http://localhost:5173
- **Admin:** http://localhost:5173/#admin (or "Staff login" in the footer)
- **Admin login:** the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `backend/.env` (default `admin@amigos.lk` / `amigos123`; change it before going live)

> **No backend yet?** Leave `VITE_API_URL` empty. The frontend then uses a built-in mock API that stores data in your browser, so the whole site (orders, reservations, admin) still works for demos and design work.

## API endpoints

| Method | Path | Access | What it does |
|---|---|---|---|
| POST | `/api/auth/login` | public | `{ email, password }` → `{ accessToken, user }` |
| GET | `/api/auth/me` | admin | Current admin |
| GET | `/api/health` | public | Health check |
| GET | `/api/categories` | public | Menu categories |
| GET | `/api/menu-items?category=&search=` | public | Menu (with category) |
| GET | `/api/menu-items/:id` | public | One item |
| POST | `/api/menu-items` | admin | Add item |
| PATCH | `/api/menu-items/:id` | admin | Edit item / toggle on sale / popular |
| DELETE | `/api/menu-items/:id` | admin | Delete item |
| POST | `/api/orders` | public | Place order (server works out prices and total; refused while online orders are paused) |
| GET | `/api/orders` | admin | All orders |
| PATCH | `/api/orders/:id/status` | admin | PENDING → PREPARING → READY → COMPLETED / CANCELLED |
| POST | `/api/reservations` | public | Request a table (within opening hours, not on closed days, 1–20 guests) |
| GET | `/api/reservations` | admin | All requests |
| PATCH | `/api/reservations/:id/status` | admin | CONFIRMED / CANCELLED |
| GET | `/api/settings` | public | Café details, hours, announcement, switches, gallery photos |
| PATCH | `/api/settings` | admin | Update any of them (send only what changed). `gallery` is a list (max 12) of `{ src, alt, caption }`; `src` must be an uploaded `/uploads/…` file or a bundled `gallery/…` photo |
| POST | `/api/categories` | admin | Add a category |
| PATCH | `/api/categories/:id` | admin | Rename / reorder |
| DELETE | `/api/categories/:id` | admin | Delete (only when it has no items) |
| PATCH | `/api/auth/password` | admin | Change password |
| POST | `/api/uploads` | admin | Upload a dish photo (PNG/JPG/WebP ≤ 5 MB) or 3D model (.glb ≤ 15 MB), multipart field `file` |

Admin routes need the header `Authorization: Bearer <accessToken>`.

### Testing with Postman
Import `backend/amigos-cafe.postman_collection.json`. Run **Auth → Login** first: it saves the token automatically, so the **Admin** requests work straight away. (Bruno: *Import collection → Postman collection*.)

## Build for production
```bash
cd frontend && npm run build     # output in frontend/dist (static files, host on Vercel/Netlify)
cd backend  && npm run build && npm run start:prod
```
On Vercel set `VITE_API_URL` to your deployed API URL; on the backend set `CORS_ORIGIN` to your website's URL.

## Notes
- **Real dish photos:** 17 menu items use the café's own photos (from @amigos_trinco), stored in `frontend/public/menu/` and linked in `PHOTOS` (`frontend/src/data/menu.ts` and `backend/prisma/seed.ts`). Items without a photo show their 3D model. The café can upload or change any photo in **Admin → Menu → Edit → Upload photo** (the backend saves uploads in `backend/uploads/` via `POST /api/uploads`). These photos were cropped from an Instagram screenshot, so ask the café for the original full-size photos for the sharpest result.
- Menu and prices come from the café's Google listing ("provided by business"). Update them any time from the admin panel.
- Every menu item gets a 3D dish automatically from its name (`three/food/dishFor.ts`), so items added in the admin panel appear in the 3D menu too. To change how a dish looks, edit `three/food/FoodModels.tsx`.
- **Gallery photos** live in `frontend/public/gallery/` (listed in `src/data/gallery.ts`): food, drinks and coffee-bar shots only — no customers. Add real interior/seating photos there when the café provides them.
- **Real 3D food:** scan a dish with a phone app (Polycam, Luma…), export `.glb` (< 15 MB) and upload it in Admin → Menu items → Edit → Real 3D model.
- **Not built (needs real assets):** a 3D café tour (needs real interior photos or a scan — we don't invent the interior) and AR preview (needs real .glb models first).
- The small food icons in the list view are SVG drawings in `components/FoodArt.tsx`.
- The 3D models are made in code (no .glb downloads), so the site loads fast and works offline.
