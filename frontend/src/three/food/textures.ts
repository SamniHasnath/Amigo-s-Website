// Canvas-drawn textures (no image downloads), cached so each is made once.
import * as THREE from 'three';

const cache = new Map<string, THREE.CanvasTexture>();

function make(key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  cache.set(key, t);
  return t;
}

/** Seeded random so textures look the same every load. */
function rng(seed: number) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}

/** Dark marble counter top with soft light veins. */
export function marbleTexture() {
  return make('marble', 1024, 1024, (g, w, h) => {
    const r = rng(7);
    g.fillStyle = '#26211e'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.025})`; g.fillRect(r() * w, r() * h, 2, 2); }
    for (let v = 0; v < 9; v++) {
      g.beginPath();
      let x = r() * w, y = r() * h;
      g.moveTo(x, y);
      for (let s = 0; s < 40; s++) { x += (r() - 0.3) * 60; y += (r() - 0.5) * 50; g.lineTo(x, y); }
      g.strokeStyle = `rgba(214,206,196,${0.1 + r() * 0.18})`;
      g.lineWidth = 0.6 + r() * 2.2;
      g.stroke();
    }
  });
}

/** Back wall: dark plaster with a soft (out-of-focus) gold AMIGO'S sign. */
export function wallTexture() {
  return make('wall', 1024, 512, (g, w, h) => {
    const grd = g.createRadialGradient(w / 2, h * 0.35, 20, w / 2, h * 0.4, w * 0.7);
    grd.addColorStop(0, '#3a2418'); grd.addColorStop(1, '#180d09');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    const r = rng(3);
    for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(255,240,220,${r() * 0.02})`; g.fillRect(r() * w, r() * h, 2, 2); }
    g.filter = 'blur(3px)';
    g.fillStyle = 'rgba(214,163,92,.55)';
    g.textAlign = 'center';
    g.font = '600 96px Georgia, "Playfair Display", serif';
    g.fillText("AMIGO'S", w / 2, h * 0.46);
    g.font = '500 24px Georgia, serif';
    g.fillText('—  CAFE  ·  TRINCOMALEE  —', w / 2, h * 0.56);
    // small cup emblem
    g.lineWidth = 6; g.strokeStyle = 'rgba(214,163,92,.5)';
    g.beginPath(); g.moveTo(w / 2 - 28, h * 0.22); g.lineTo(w / 2 - 22, h * 0.3); g.lineTo(w / 2 + 22, h * 0.3); g.lineTo(w / 2 + 28, h * 0.22); g.stroke();
    g.beginPath(); g.arc(w / 2 + 33, h * 0.255, 8, -Math.PI / 2, Math.PI / 2); g.stroke();
    g.filter = 'none';
  });
}

export type CupTop = 'latte' | 'cappuccino' | 'crema' | 'americano' | 'choc' | 'spanish';

/** The surface of a coffee drink, seen from above. */
export function cupTopTexture(kind: CupTop) {
  return make('top-' + kind, 512, 512, (g) => {
    const base: Record<CupTop, [string, string, string]> = {
      latte: ['#c08550', '#8c5326', '#5a3014'],
      spanish: ['#d29a62', '#a5683a', '#6a3d1c'],
      cappuccino: ['#e9d7bf', '#c79a6c', '#7a4a26'],
      crema: ['#c98a4a', '#9a5a24', '#4a2610'],
      americano: ['#5b3218', '#3a1e0e', '#1d0e06'],
      choc: ['#6a3a22', '#4c2614', '#2c140a'],
    };
    const [a, b, c] = base[kind];
    const grd = g.createRadialGradient(256, 256, 30, 256, 256, 256);
    grd.addColorStop(0, a); grd.addColorStop(0.65, b); grd.addColorStop(1, c);
    g.fillStyle = grd; g.fillRect(0, 0, 512, 512);
    if (kind === 'crema' || kind === 'americano') {
      const r = rng(11);
      for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(230,170,100,${r() * 0.18})`; g.beginPath(); g.arc(r() * 512, r() * 512, r() * 3, 0, 7); g.fill(); }
      return;
    }
    g.fillStyle = '#fbf3e8';
    if (kind === 'cappuccino') {
      g.globalAlpha = 0.9; g.beginPath(); g.arc(256, 256, 170, 0, 7); g.fill();
      g.globalAlpha = 1; g.fillStyle = 'rgba(120,70,30,.5)';
      const r = rng(5);
      for (let i = 0; i < 400; i++) { g.beginPath(); g.arc(256 + (r() - 0.5) * 260, 256 + (r() - 0.5) * 260, 2, 0, 7); g.fill(); }
      return;
    }
    if (kind === 'choc') {
      g.beginPath(); g.arc(256, 256, 150, 0, 7); g.fill();
      g.strokeStyle = '#6a3a22'; g.lineWidth = 10;
      g.beginPath(); for (let t = 0; t < 14; t += 0.1) g.lineTo(256 + Math.cos(t) * t * 10, 256 + Math.sin(t) * t * 10); g.stroke();
      return;
    }
    // latte art: rosetta + heart
    for (let i = 0; i < 7; i++) {
      const y = 360 - i * 36, w2 = 150 - i * 17, h2 = 34 - i * 2;
      g.beginPath();
      g.ellipse(256, y, w2, h2, 0, Math.PI * 0.05, Math.PI * 0.95, false);
      g.ellipse(256, y - 10, w2 * 0.82, h2 * 0.6, 0, Math.PI * 0.95, Math.PI * 0.05, true);
      g.fill();
    }
    g.beginPath(); g.moveTo(256, 150); g.bezierCurveTo(200, 110, 210, 60, 256, 80); g.bezierCurveTo(302, 60, 312, 110, 256, 150); g.fill();
    g.strokeStyle = '#b07440'; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(256, 92); g.lineTo(256, 420); g.stroke();
  });
}

/** Toasted bread with grill marks (panini / sandwiches). */
export function grillTexture() {
  return make('grill', 256, 256, (g) => {
    g.fillStyle = '#d9a35e'; g.fillRect(0, 0, 256, 256);
    const r = rng(9);
    for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(120,70,20,${r() * 0.15})`; g.fillRect(r() * 256, r() * 256, 3, 3); }
    g.strokeStyle = 'rgba(70,35,10,.75)'; g.lineWidth = 12;
    for (let i = -256; i < 512; i += 52) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 256, 256); g.stroke(); }
  });
}

/** Citrus slice face (lime / orange). */
export function citrusTexture(color: string, key: string) {
  return make('citrus-' + key, 256, 256, (g) => {
    g.fillStyle = color; g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill();
    g.fillStyle = '#f6f8e6'; g.beginPath(); g.arc(128, 128, 112, 0, 7); g.fill();
    g.fillStyle = color; g.globalAlpha = 0.75;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      g.beginPath(); g.moveTo(128, 128);
      g.arc(128, 128, 104, a + 0.06, a + Math.PI / 5 - 0.06); g.closePath(); g.fill();
    }
  });
}
