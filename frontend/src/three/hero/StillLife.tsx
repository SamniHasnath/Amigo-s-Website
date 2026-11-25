// Hero still life: a glazed ceramic cup of latte on its saucer, a flaky croissant and a few
// roasted beans, with soft contact shadows — a small café table scene rather than a lone cup.
// Built only for the hero background; the 3D menu keeps its own models.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Steam } from '../models';

/* ---------------- textures (canvas, made once) ---------------- */
const texCache = new Map<string, THREE.Texture>();
function canvasTex(key: string, size: number, draw: (g: CanvasRenderingContext2D, s: number) => void, color = true) {
  const hit = texCache.get(key); if (hit) return hit;
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d')!, size);
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  texCache.set(key, t);
  return t;
}
const rnd = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

function latteTex() {
  return canvasTex('hero-latte', 1024, (g, s) => {
    const c = s / 2;
    const grd = g.createRadialGradient(c, c, s * 0.05, c, c, c);
    grd.addColorStop(0, '#c8915a'); grd.addColorStop(0.55, '#a0612f'); grd.addColorStop(0.85, '#7a4420'); grd.addColorStop(1, '#5a3014');
    g.fillStyle = grd; g.fillRect(0, 0, s, s);
    // crema micro-bubbles
    const r = rnd(17);
    for (let i = 0; i < 4000; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * c;
      g.fillStyle = `rgba(${200 + r() * 40},${140 + r() * 40},${80 + r() * 30},${r() * 0.18})`;
      g.beginPath(); g.arc(c + Math.cos(a) * d, c + Math.sin(a) * d, r() * 2.4, 0, 7); g.fill();
    }
    // rosetta: soft-edged foam leaves narrowing toward the top
    g.save(); g.shadowColor = 'rgba(255,248,236,.9)'; g.shadowBlur = 10; g.fillStyle = '#fbf4ea';
    for (let i = 0; i < 9; i++) {
      const y = c + s * 0.3 - i * s * 0.056, w = s * (0.3 - i * 0.026), h = s * (0.06 - i * 0.003);
      g.beginPath();
      g.ellipse(c, y, w, h, 0, Math.PI * 0.04, Math.PI * 0.96, false);
      g.ellipse(c, y - h * 0.38, w * 0.84, h * 0.55, 0, Math.PI * 0.96, Math.PI * 0.04, true);
      g.fill();
    }
    g.beginPath();
    g.moveTo(c, c - s * 0.21);
    g.bezierCurveTo(c - s * 0.1, c - s * 0.29, c - s * 0.07, c - s * 0.39, c, c - s * 0.34);
    g.bezierCurveTo(c + s * 0.07, c - s * 0.39, c + s * 0.1, c - s * 0.29, c, c - s * 0.21);
    g.fill(); g.restore();
    g.strokeStyle = 'rgba(160,98,48,.9)'; g.lineWidth = s * 0.011; g.lineCap = 'round';
    g.beginPath(); g.moveTo(c, c - s * 0.33); g.quadraticCurveTo(c + s * 0.01, c, c, c + s * 0.4); g.stroke();
  });
}

/** Flaky, uneven pastry surface used as a bump map. */
function flakeBump() {
  return canvasTex('hero-flake', 512, (g, s) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, s, s);
    const r = rnd(5);
    for (let i = 0; i < 900; i++) {
      const v = Math.floor(90 + r() * 120);
      g.strokeStyle = `rgb(${v},${v},${v})`; g.lineWidth = 1 + r() * 3;
      const x = r() * s, y = r() * s;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 60, y + (r() - 0.2) * 10); g.stroke();
    }
  }, false);
}

/** Soft round shadow on the (invisible) table. */
function shadowTex() {
  return canvasTex('hero-shadow', 256, (g, s) => {
    const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grd.addColorStop(0, 'rgba(40,22,10,.55)'); grd.addColorStop(0.45, 'rgba(40,22,10,.28)'); grd.addColorStop(1, 'rgba(40,22,10,0)');
    g.fillStyle = grd; g.fillRect(0, 0, s, s);
  });
}

/* ---------------- materials ---------------- */
const glaze = new THREE.MeshPhysicalMaterial({ color: '#f7f2ea', roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0.4, sheenColor: new THREE.Color('#ffffff'), ior: 1.5 });
const glazeInner = new THREE.MeshPhysicalMaterial({ color: '#efe7db', roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.1 });
const goldRim = new THREE.MeshStandardMaterial({ color: '#c8964f', metalness: 1, roughness: 0.28 });
const steel = new THREE.MeshPhysicalMaterial({ color: '#d8d4cf', metalness: 1, roughness: 0.18, clearcoat: 0.5 });
const beanMat = new THREE.MeshPhysicalMaterial({ color: '#3b2010', roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.35 });

const smoothProfile = (pts: number[][], n = 120) =>
  new THREE.SplineCurve(pts.map(([x, y]) => new THREE.Vector2(x, y))).getPoints(n);

/* ---------------- pieces ---------------- */
function Cup() {
  const latte = latteTex();
  const outer = useMemo(() => new THREE.LatheGeometry(smoothProfile([[0, 0], [0.36, 0], [0.43, 0.04], [0.5, 0.22], [0.58, 0.5], [0.625, 0.74], [0.63, 0.78]]), 128), []);
  const inner = useMemo(() => new THREE.LatheGeometry(smoothProfile([[0.6, 0.78], [0.585, 0.72], [0.54, 0.5], [0.46, 0.22], [0.37, 0.08], [0, 0.07]]), 128), []);
  const lip = useMemo(() => new THREE.TorusGeometry(0.615, 0.018, 16, 128), []);
  return (
    <group>
      <mesh geometry={outer} material={glaze} castShadow receiveShadow />
      <mesh geometry={inner} material={glazeInner} receiveShadow />
      <mesh geometry={lip} material={glaze} position={[0, 0.78, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow />
      <mesh position={[0, 0.72, 0]} rotation={[Math.PI / 2, 0, 0]} material={goldRim}><torusGeometry args={[0.62, 0.006, 8, 128]} /></mesh>
      {/* handle */}
      <mesh position={[0.66, 0.43, 0]} rotation={[0, 0, -Math.PI * 0.6]} material={glaze} castShadow>
        <torusGeometry args={[0.17, 0.042, 24, 64, Math.PI * 1.2]} />
      </mesh>
      {/* latte surface, very slightly domed */}
      <mesh position={[0, 0.69, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
        <circleGeometry args={[0.565, 96]} />
        <meshPhysicalMaterial map={latte} roughness={0.32} clearcoat={0.3} clearcoatRoughness={0.4} />
      </mesh>
    </group>
  );
}

function Saucer() {
  const geo = useMemo(() => new THREE.LatheGeometry(smoothProfile([[0, 0], [0.5, 0.0], [0.82, 0.035], [1.0, 0.1], [1.04, 0.125], [1.0, 0.13], [0.86, 0.075], [0.56, 0.05], [0.4, 0.06], [0, 0.06]]), 128), []);
  return (
    <group>
      <mesh geometry={geo} material={glaze} castShadow receiveShadow />
      <mesh position={[0, 0.128, 0]} rotation={[Math.PI / 2, 0, 0]} material={goldRim}><torusGeometry args={[1.03, 0.008, 8, 128]} /></mesh>
    </group>
  );
}

function Spoon() {
  return (
    <group position={[-0.2, 0.1, 0.74]} rotation={[0.04, 0.45, 0]}>
      <mesh material={steel} position={[0.32, 0.01, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.55]} castShadow>
        <capsuleGeometry args={[0.02, 0.52, 6, 16]} />
      </mesh>
      <mesh material={steel} scale={[0.15, 0.03, 0.1]} castShadow><sphereGeometry args={[1, 32, 16]} /></mesh>
    </group>
  );
}

/** A croissant built as a lobed, tapering crescent with a flaky bump map and baked colour. */
function Croissant() {
  const bump = flakeBump();
  const geo = useMemo(() => {
    const U = 160, V = 40, R = 0.5, arc = 2.2;
    const pos: number[] = [], col: number[] = [], uv: number[] = [], idx: number[] = [];
    const light = new THREE.Color('#e7b066'), mid = new THREE.Color('#c27a32'), dark = new THREE.Color('#8a4a1c');
    for (let i = 0; i <= U; i++) {
      const u = i / U, a = -arc / 2 + u * arc;
      const cx = Math.sin(a) * R, cz = -Math.cos(a) * R + R;
      const taper = Math.pow(Math.sin(Math.PI * (0.06 + u * 0.88)), 0.85);
      const lobe = 1 + 0.16 * Math.pow(Math.abs(Math.sin(u * Math.PI * 6.5)), 0.6);
      const r = 0.24 * taper * lobe;
      const n = new THREE.Vector3(Math.sin(a), 0, -Math.cos(a)); // outward from the arc centre
      for (let j = 0; j <= V; j++) {
        const v = (j / V) * Math.PI * 2;
        const ox = n.x * Math.cos(v) * r, oz = n.z * Math.cos(v) * r, oy = Math.max(-0.05, Math.sin(v) * r * 0.78);
        pos.push(cx + ox, oy + 0.06, cz + oz);
        const top = Math.max(0, Math.sin(v)), crease = 1 - Math.pow(Math.abs(Math.sin(u * Math.PI * 6.5)), 0.4);
        const c = mid.clone().lerp(light, top * 0.6).lerp(dark, crease * 0.45 + (1 - taper) * 0.3);
        col.push(c.r, c.g, c.b);
        uv.push(u * 4, j / V);
      }
    }
    for (let i = 0; i < U; i++) for (let j = 0; j < V; j++) {
      const a = i * (V + 1) + j, b = a + V + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <meshPhysicalMaterial vertexColors bumpMap={bump} bumpScale={0.6} roughness={0.55} sheen={0.5} sheenColor={new THREE.Color('#ffd49a')} clearcoat={0.25} clearcoatRoughness={0.6} />
    </mesh>
  );
}

/** Roasted bean: an ellipsoid with a pressed-in centre crease. */
const beanGeo = (() => {
  const g = new THREE.SphereGeometry(1, 28, 20);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const crease = y > 0 ? Math.exp(-(x * x) / 0.012) * 0.32 : 0;
    p.setY(i, y - crease * y);
    p.setZ(i, z);
  }
  g.computeVertexNormals();
  g.scale(0.11, 0.06, 0.08);
  return g;
})();
export function RealBean(props: JSX.IntrinsicElements['mesh']) {
  return <mesh geometry={beanGeo} material={beanMat} castShadow receiveShadow {...props} />;
}

function Shadow({ at, scale }: { at: [number, number, number]; scale: [number, number] }) {
  const tex = shadowTex();
  return (
    <mesh position={at} rotation={[-Math.PI / 2, 0, 0]} scale={[scale[0], scale[1], 1]} renderOrder={-1}>
      <planeGeometry /><meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

/** Beans slowly circling the cup, passing in front of and behind it. */
function OrbitBeans({ reduced }: { reduced: boolean }) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (g.current && !reduced) g.current.rotation.y += dt * 0.16; });
  const beans = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2;
    return { p: [Math.cos(a) * 1.55, 0.75 + Math.sin(a * 2) * 0.22, Math.sin(a) * 1.15] as [number, number, number], r: [a, a * 1.7, a * 0.6] as [number, number, number], s: 0.9 + (i % 3) * 0.15 };
  }), []);
  return (
    <group rotation={[0.18, 0, -0.08]}>
      <group ref={g}>
        {beans.map((b, i) => <Spinner key={i} reduced={reduced} speed={0.4 + i * 0.07}><RealBean position={b.p} rotation={b.r} scale={b.s} /></Spinner>)}
      </group>
    </group>
  );
}
function Spinner({ children, speed, reduced }: { children: React.ReactNode; speed: number; reduced: boolean }) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (g.current && !reduced) { g.current.children.forEach((c) => { c.rotation.x += dt * speed; c.rotation.y += dt * speed * 0.6; }); } });
  return <group ref={g}>{children}</group>;
}

/**
 * The whole arrangement. The group origin is the saucer centre, resting on y = 0.
 * Its overall footprint is roughly 3 × 2 units (used for the overlap test).
 */
export default function StillLife({ reduced, steam }: { reduced: boolean; steam: boolean }) {
  return (
    <group>
      <Shadow at={[0, 0.002, 0]} scale={[2.5, 2.5]} />
      <Shadow at={[1.35, 0.002, 0.45]} scale={[1.6, 1.0]} />
      <Saucer />
      <group position={[0, 0.06, 0]}>
        <Cup />
        {steam && <group scale={0.9}><Steam /></group>}
      </group>
      <Spoon />
      <group position={[1.32, 0, 0.48]} rotation={[0, -0.7, 0]} scale={0.95}><Croissant /></group>
      <RealBean position={[-0.95, 0.035, 0.85]} rotation={[0, 0.6, 0]} />
      <RealBean position={[-0.72, 0.035, 1.02]} rotation={[0, 2.1, 0.1]} scale={0.95} />
      <RealBean position={[0.55, 0.14, 0.55]} rotation={[0, 1.2, 0]} scale={0.8} />
      <OrbitBeans reduced={reduced} />
    </group>
  );
}
