// A small, playful latte-art toy: draw on the milk foam with mouse or finger.
// Plain 2D canvas, no libraries, nothing to do with ordering.
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';

const SIZE = 520;

export default function LatteArt() {
  const ref = useRef<HTMLCanvasElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [brush, setBrush] = useState<'pour' | 'etch'>('pour');
  const [drawn, setDrawn] = useState(false);

  const reset = useCallback(() => {
    const c = ref.current; if (!c) return;
    const g = c.getContext('2d')!;
    g.clearRect(0, 0, SIZE, SIZE);
    // Cup rim and coffee surface
    g.fillStyle = '#efe7dc'; g.beginPath(); g.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 2, 0, Math.PI * 2); g.fill();
    const grd = g.createRadialGradient(SIZE / 2, SIZE / 2, 20, SIZE / 2, SIZE / 2, SIZE / 2 - 26);
    grd.addColorStop(0, '#c68a52'); grd.addColorStop(0.7, '#9a5a2a'); grd.addColorStop(1, '#5c3317');
    g.fillStyle = grd; g.beginPath(); g.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 26, 0, Math.PI * 2); g.fill();
    // Crema speckles
    for (let i = 0; i < 700; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * (SIZE / 2 - 30);
      g.fillStyle = `rgba(230,170,100,${Math.random() * 0.2})`;
      g.beginPath(); g.arc(SIZE / 2 + Math.cos(a) * r, SIZE / 2 + Math.sin(a) * r, Math.random() * 2.2, 0, Math.PI * 2); g.fill();
    }
    setDrawn(false);
  }, []);
  useEffect(reset, [reset]);

  const pos = (e: PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * SIZE, y: ((e.clientY - r.top) / r.height) * SIZE };
  };
  const inside = (p: { x: number; y: number }) => Math.hypot(p.x - SIZE / 2, p.y - SIZE / 2) < SIZE / 2 - 30;

  const dab = (p: { x: number; y: number }, from?: { x: number; y: number }) => {
    const g = ref.current!.getContext('2d')!;
    g.save();
    g.beginPath(); g.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 28, 0, Math.PI * 2); g.clip();
    if (brush === 'pour') {
      const steps = from ? Math.max(1, Math.ceil(Math.hypot(p.x - from.x, p.y - from.y) / 3)) : 1;
      for (let i = 0; i < steps; i++) {
        const x = from ? from.x + ((p.x - from.x) * (i + 1)) / steps : p.x, y = from ? from.y + ((p.y - from.y) * (i + 1)) / steps : p.y;
        const grd = g.createRadialGradient(x, y, 0, x, y, 26);
        grd.addColorStop(0, 'rgba(252,245,235,0.95)'); grd.addColorStop(0.6, 'rgba(250,240,226,0.55)'); grd.addColorStop(1, 'rgba(250,240,226,0)');
        g.fillStyle = grd; g.beginPath(); g.arc(x, y, 26, 0, Math.PI * 2); g.fill();
      }
    } else if (from) {
      g.strokeStyle = 'rgba(150,90,45,0.85)'; g.lineWidth = 4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(from.x, from.y); g.lineTo(p.x, p.y); g.stroke();
    }
    g.restore();
  };

  const down = (e: PointerEvent<HTMLCanvasElement>) => {
    const p = pos(e); if (!inside(p)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    last.current = p; dab(p); setDrawn(true);
  };
  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!last.current) return;
    const p = pos(e); dab(p, last.current); last.current = p;
  };
  const up = () => { last.current = null; };

  const heart = () => {
    reset();
    const g = ref.current!.getContext('2d')!;
    const pts: { x: number; y: number }[] = [];
    for (let t = 0; t <= Math.PI * 2; t += 0.05) {
      pts.push({ x: SIZE / 2 + 9 * 16 * Math.sin(t) ** 3 / 1.6, y: SIZE / 2 - 8 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 1.6 + 10 });
    }
    g.save(); g.fillStyle = 'rgba(252,245,235,0.95)'; g.shadowColor = 'rgba(252,245,235,.9)'; g.shadowBlur = 18;
    g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.fill(); g.restore();
    g.strokeStyle = 'rgba(150,90,45,0.8)'; g.lineWidth = 4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(SIZE / 2, SIZE / 2 - 90); g.lineTo(SIZE / 2, SIZE / 2 + 110); g.stroke();
    setDrawn(true);
  };

  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl sm:rounded-3xl border border-crema/10 bg-espresso p-4 sm:p-5 sm:flex-row sm:items-center lg:flex-col lg:items-stretch">
      <div className="relative mx-auto w-[min(100%,220px)] sm:w-[240px] shrink-0 sm:mx-0 lg:mx-auto lg:w-[min(100%,240px)]">
        <canvas
          ref={ref}
          width={SIZE}
          height={SIZE}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          className="aspect-square w-full cursor-crosshair touch-none rounded-full shadow-[0_20px_40px_-12px_rgba(0,0,0,.7)]"
          role="img"
          aria-label="Draw your own latte art. Tap or drag across the coffee to pour milk foam."
        />
        {!drawn && (
          <p className="pointer-events-none absolute inset-0 grid place-items-center text-center text-xs sm:text-sm font-semibold text-crema/90">
            Draw here
          </p>
        )}
      </div>
      <div className="min-w-0">
        <h3 className="font-display text-xl sm:text-2xl">Pour your own latte art</h3>
        <p className="mt-1 text-xs sm:text-sm text-crema-200">
          While our baristas steam and pour by hand at the counter, try sketching a pattern right on the foam below. Click or drag to pour milk, or switch to etch to draw detail.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(['pour', 'etch'] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBrush(b)}
              aria-pressed={brush === b}
              className={`chip ${brush === b ? 'chip-on' : 'text-crema-200'}`}
            >
              {b === 'pour' ? 'Pour milk' : 'Etch lines'}
            </button>
          ))}
          <button className="chip text-crema-200" onClick={heart}>Heart design</button>
          <button className="chip text-crema-200" onClick={reset}>Fresh cup</button>
        </div>
      </div>
    </div>
  );
}
