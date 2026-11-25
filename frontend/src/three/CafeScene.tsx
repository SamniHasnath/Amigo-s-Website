// The fixed 3D background for the top of the page (hero → experience → start of the menu):
// a few soft, distant café accents drifting with the scroll. The experience section uses a video.
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { CinnamonStick, Croissant as SmallCroissant } from './models';
import { RealBean } from './hero/StillLife';
import { useScene, useTheme } from '@/store';
import { daypart } from '@/lib/hours';

/** Scroll progress through the sections: 0 = hero, 1 = experience, 2 = menu, 3 = favourites. */
const STOPS = ['hero', 'experience', 'menu', 'favourites'];
const scroll = { p: 0 };
const pointer = { x: 0, y: 0 };

function updateScroll() {
  const y = window.scrollY + window.innerHeight * 0.35;
  const tops = STOPS.map((id) => document.getElementById(id)?.offsetTop ?? Infinity);
  let p = 0;
  for (let i = 0; i < tops.length - 1; i++) {
    if (y >= tops[i]) p = i + Math.min(1, (y - tops[i]) / Math.max(1, tops[i + 1] - tops[i]));
  }
  scroll.p = p;
}

/** A few soft, distant café accents, kept to the outer edges and far back so they never sit on text. */
function Accents({ reduced, fogColor }: { reduced: boolean; fogColor: string }) {
  const g = useRef<THREE.Group>(null);
  const { size } = useThree();
  const mobile = size.width < 768;
  const items = useMemo(() => {
    const list: { kind: 'bean' | 'cinnamon' | 'croissant'; pos: [number, number, number]; rot: [number, number, number]; s: number }[] = [
      { kind: 'bean', pos: [-7.2, 2.6, -6], rot: [0.4, 1, 0.2], s: 1.6 },
      { kind: 'cinnamon', pos: [7.4, 1.8, -7], rot: [0.3, 0.6, 0.9], s: 0.9 },
      { kind: 'bean', pos: [7.8, -2.6, -6], rot: [1.2, 0.3, 0.5], s: 1.5 },
      { kind: 'croissant', pos: [-7.6, -3.4, -7.5], rot: [0.6, 0.4, 0.4], s: 0.7 },
      { kind: 'bean', pos: [-6.8, -7.5, -6], rot: [0.2, 2.2, 0.4], s: 1.4 },
      { kind: 'bean', pos: [7.2, -8.4, -6.5], rot: [0.9, 1.4, 0.1], s: 1.5 },
    ];
    return mobile ? list.filter((_, i) => i % 2 === 0).map((it) => ({ ...it, pos: [it.pos[0] * 0.55, it.pos[1], it.pos[2]] as [number, number, number] })) : list;
  }, [mobile]);
  useFrame(({ clock }, dt) => {
    if (!g.current) return;
    // slower than the page: a soft parallax as you scroll
    g.current.position.y = THREE.MathUtils.lerp(g.current.position.y, scroll.p * 3.2, 1 - Math.pow(0.02, dt));
    if (!reduced) g.current.children.forEach((c, i) => { c.rotation.y += dt * (0.08 + i * 0.015); c.position.y += Math.sin(clock.elapsedTime * 0.6 + i) * 0.0015; });
  });
  return (
    <group ref={g}>
      {items.map((it, i) => (
        <group key={i} position={it.pos} rotation={it.rot} scale={it.s}>
          {it.kind === 'bean' && <RealBean scale={1.6} />}
          {it.kind === 'cinnamon' && <CinnamonStick />}
          {it.kind === 'croissant' && <SmallCroissant />}
        </group>
      ))}
      <Sparkles count={reduced ? 0 : mobile ? 10 : 22} scale={[16, 12, 4]} position={[0, 0, -5]} size={2.2} speed={0.18} color={fogColor === '#F6EFE4' ? '#C77A35' : '#E3AA65'} opacity={0.45} />
    </group>
  );
}

export default function CafeScene() {
  const reduced = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const menuVisible = useScene((s) => s.menuVisible);
  // pause only after the fade-out has finished
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!menuVisible) { setPaused(false); return; }
    const t = setTimeout(() => setPaused(true), 500);
    return () => clearTimeout(t);
  }, [menuVisible]);
  const theme = useTheme((s) => s.theme);
  const [time, setTime] = useState(daypart());
  useEffect(() => {
    const onScroll = () => updateScroll();
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    updateScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('pointermove', onMove);
    const t = setInterval(() => setTime(daypart()), 5 * 60000);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('pointermove', onMove);
      clearInterval(t);
    };
  }, []);
  const day = time === 'day';
  const dark = theme === 'dark';
  // distant objects fade into the page colour, like depth haze
  const fogColor = dark ? '#2a1a12' : '#F6EFE4';

  return (
    // while the menu is on screen the scene is paused (saves battery) and hidden, so a paused frame never shows over it
    <div className={`pointer-events-none fixed inset-0 -z-10 transition-opacity duration-500 ${menuVisible ? 'opacity-0' : 'opacity-100'}`} aria-hidden="true">
      <Canvas frameloop={paused ? 'never' : 'always'} dpr={[1, 1.75]} camera={{ position: [0, 1.3, 6.8], fov: 36 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: dark ? 1.0 : 1.08 }}
        shadows={{ type: THREE.PCFSoftShadowMap }}>
        <fog attach="fog" args={[fogColor, 9, 17]} />
        {/* soft fill so shadows are never black */}
        <hemisphereLight args={[dark ? '#f3dcc0' : '#fff6ea', dark ? '#3a2416' : '#e8d6bf', dark ? 0.55 : 0.85]} />
        {/* key light: warm, from upper left — window light by day, café lamp in the evening */}
        <directionalLight position={[-4, 6, 4]} intensity={day ? 2.4 : 1.9} color={day ? '#fff0db' : '#ffd29a'} castShadow
          shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.02} shadow-radius={6}
          shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-camera-near={0.5} shadow-camera-far={30} />
        {/* rim light from behind for a crisp glaze edge */}
        <directionalLight position={[3, 3, -5]} intensity={dark ? 1.6 : 1.1} color="#ffe2b8" />
        <pointLight position={[3, -1, 3]} intensity={dark ? 6 : 4} color="#C77A35" distance={12} />
        <Suspense fallback={null}>
          <Environment resolution={256}>
            <Lightformer form="rect" intensity={2.2} color="#fff5e6" position={[-3, 4, 3]} scale={[5, 3, 1]} />
            <Lightformer form="rect" intensity={1.2} color="#ffd9a8" position={[4, 1, 2]} rotation-y={-Math.PI / 2.5} scale={[3, 3, 1]} />
            <Lightformer form="rect" intensity={0.8} color="#ffffff" position={[0, 3, -5]} rotation-y={Math.PI} scale={[6, 2, 1]} />
          </Environment>

          <Accents reduced={reduced} fogColor={fogColor} />
        </Suspense>
      </Canvas>
    </div>
  );
}
