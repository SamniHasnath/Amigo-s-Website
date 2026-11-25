# Amigo's Café - Website

A responsive website for **Amigo's Café**, a coffee and food stop on Main Street, Trincomalee, Sri Lanka.
Visitors can browse the menu, view dishes in 3D, order ahead for pickup and book a table.

## Features

- **Hero and about sections** with looping café videos
- **Full menu** with categories and search. Each dish can be opened in an interactive **3D preview**
- **Order ahead**: add dishes to a cart and send a pickup order
- **Table reservations** with date, time and party size
- **Gallery** of café photos, plus a small interactive latte-art game
- **Visit section** with an embedded map, opening hours and contact details
- **Live open/closed status**, based on Sri Lanka time
- **Light and dark themes**
- **Responsive layout** for phones, tablets and desktops

## Tech stack

| Area | Tools |
| --- | --- |
| Framework | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| 3D | Three.js, React Three Fiber, Drei |
| State | Zustand |
| HTTP | Axios |

## Getting started

**Requirements:** Node.js 18 or later, and npm.

```bash
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

The site runs on **built-in demo data** by default, so no backend is needed. Orders and reservations are saved in the browser's local storage.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Type-check and build for production (output in `dist/`) |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Connecting a backend (optional)

To use a real API instead of the demo data, copy `.env.example` to `.env` and set the API URL:

```env
VITE_API_URL=http://localhost:3000/api
```

Leave `VITE_API_URL` empty to keep using the demo data.

## Project structure

```
src/
├── components/   Page sections and UI (Hero, Menu, Reserve, Footer, …)
├── three/        3D scenes and models
├── lib/          API client, demo data API, opening-hours helpers
├── data/         Default menu, gallery and café settings
├── store/        Global state (menu, cart, theme, settings)
├── types/        Shared TypeScript types
├── App.tsx       Page layout
└── main.tsx      Entry point
public/
├── menu/         Dish photos
├── gallery/      Gallery photos
└── video/        Hero and about-section videos
```

Designed and developed by [Neirah Tech](https://neirahtech.com).
