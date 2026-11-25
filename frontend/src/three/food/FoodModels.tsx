// Procedural 3D food for the menu showcase. Every dish sits on a plate whose top is at y = 0.
// No .glb files: everything is built from simple shapes so it loads instantly.
import { useMemo, type ReactNode } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { citrusTexture, cupTopTexture, grillTexture, type CupTop } from './textures';
import { Croissant, Steam } from '../models';

/* ---------------- dish descriptions ---------------- */
export type GlassStyle = 'tall' | 'shake' | 'smoothie' | 'sparkling';
export type Dish =
  | { kind: 'cup'; top: CupTop; small?: boolean }
  | { kind: 'affogato' }
  | { kind: 'glass'; style: GlassStyle; liquid: string; garnish?: 'lime' | 'orange' | 'mint' | 'strawberry' | 'banana' | 'watermelon' | 'pineapple' | 'none'; drizzle?: string }
  | { kind: 'croissant' } | { kind: 'cinnamon'; choc?: boolean } | { kind: 'painchoc' }
  | { kind: 'pasta'; topping: 'chicken' | 'prawn' | 'bacon' }
  | { kind: 'shakshuka' }
  | { kind: 'fries'; topping?: 'chicken' | 'cheese' | 'prawn' }
  | { kind: 'panini'; veg?: boolean }
  | { kind: 'wrap'; filling: 'devilled' | 'crispy' | 'tuna' }
  | { kind: 'burger'; patty: 'chicken' | 'mushroom' }
  | { kind: 'sandwich'; filling: 'chicken' | 'tuna' }
  | { kind: 'syrup'; color: string } | { kind: 'sauce'; color: string } | { kind: 'cookies'; biscoff?: boolean }
  | { kind: 'bars'; color: string } | { kind: 'egg' } | { kind: 'bread' } | { kind: 'cheese' } | { kind: 'pickle' };

/** Height of the point the info card's line points at. */
export function dishTop(d: Dish): number {
  switch (d.kind) {
    case 'cup': return d.small ? 0.55 : 0.9;
    case 'glass': return d.style === 'shake' ? 2.0 : 1.75;
    case 'affogato': return 0.85;
    case 'burger': return 1.15;
    case 'wrap': return 1.0;
    case 'syrup': return 0.95;
    case 'shakshuka': return 0.45;
    case 'pasta': case 'fries': return 0.6;
    default: return 0.5;
  }
}

/* ---------------- small helpers ---------------- */
type V3 = [number, number, number];
function Std({ color, rough = 0.6, metal = 0, children, ...p }: { color: string; rough?: number; metal?: number; children: ReactNode } & JSX.IntrinsicElements['mesh']) {
  return <mesh castShadow receiveShadow {...p}>{children}<meshStandardMaterial color={color} roughness={rough} metalness={metal} /></mesh>;
}
function rand(seed: number) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
const glassMat = { transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0, clearcoat: 1, color: '#ffffff' };

function Lathe({ pts, color, phys, opacity, ...p }: { pts: number[][]; color?: string; phys?: boolean; opacity?: number } & JSX.IntrinsicElements['mesh']) {
  const geo = useMemo(() => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 64), [pts]);
  return (
    <mesh geometry={geo} castShadow={!phys} receiveShadow {...p}>
      {phys ? <meshPhysicalMaterial {...glassMat} side={THREE.DoubleSide} depthWrite={false} /> : <meshStandardMaterial color={color} roughness={0.35} transparent={opacity !== undefined} opacity={opacity ?? 1} side={THREE.DoubleSide} />}
    </mesh>
  );
}

/* ---------------- plate ---------------- */
export function Plate() {
  const pts = useMemo(() => [[0, -0.06], [1.0, -0.06], [1.25, -0.02], [1.42, 0.07], [1.4, 0.09], [1.22, 0.02], [0.98, 0.0], [0, 0.0]], []);
  return (
    <group>
      <Lathe pts={pts} color="#24201e" />
      {/* soft highlight on the rim so the dark plate reads against the counter */}
      <mesh position={[0, 0.085, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.41, 0.012, 8, 96]} /><meshStandardMaterial color="#6a5a4e" roughness={0.3} metalness={0.4} /></mesh>
    </group>
  );
}

/* ---------------- drinks ---------------- */
function Cup({ top, small }: { top: CupTop; small?: boolean }) {
  const tex = cupTopTexture(top);
  const cup = useMemo(() => [[0, 0], [0.4, 0], [0.44, 0.03], [0.5, 0.2], [0.58, 0.5], [0.63, 0.74], [0.62, 0.775], [0.585, 0.765], [0.545, 0.5], [0.465, 0.22], [0.385, 0.07], [0, 0.07]], []);
  const saucer = useMemo(() => [[0, 0], [0.55, 0], [0.92, 0.04], [1.0, 0.1], [0.98, 0.12], [0.88, 0.07], [0.55, 0.05], [0, 0.05]], []);
  return (
    <group scale={small ? 0.62 : 1}>
      <Lathe pts={saucer} color="#f4efe8" />
      <group position={[0, 0.05, 0]}>
        <Lathe pts={cup} color="#f6f1ea" />
        <mesh position={[0.64, 0.42, 0]} rotation={[0, 0, -Math.PI * 0.6]} castShadow>
          <torusGeometry args={[0.18, 0.045, 16, 48, Math.PI * 1.2]} /><meshStandardMaterial color="#f6f1ea" roughness={0.35} />
        </mesh>
        <mesh position={[0, top === 'cappuccino' ? 0.69 : 0.66, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
          <circleGeometry args={[top === 'cappuccino' ? 0.57 : 0.562, 64]} /><meshStandardMaterial map={tex} roughness={0.35} />
        </mesh>
        <group scale={0.9}><Steam /></group>
      </group>
    </group>
  );
}

function Affogato() {
  const bowl = useMemo(() => [[0, 0], [0.3, 0], [0.32, 0.08], [0.25, 0.12], [0.3, 0.2], [0.55, 0.45], [0.62, 0.72], [0.6, 0.73]], []);
  return (
    <group>
      <Std color="#3a1e0e" rough={0.2} position={[0, 0.27, 0]}><cylinderGeometry args={[0.46, 0.33, 0.1, 48]} /></Std>
      <mesh position={[0, 0.5, 0]} scale={[1, 0.85, 1]} castShadow>
        <icosahedronGeometry args={[0.34, 3]} /><meshStandardMaterial color="#f7ecd6" roughness={0.8} flatShading />
      </mesh>
      <Std color="#4a2610" rough={0.15} position={[0.05, 0.72, 0.1]} scale={[0.25, 0.05, 0.2]}><sphereGeometry args={[1, 16, 12]} /></Std>
      <Lathe pts={bowl} phys />
    </group>
  );
}

function Straw({ color = '#F3E7D5', h = 2.1, at = [0.18, 0.9, 0] as V3 }) {
  return <Std color={color} rough={0.4} position={at} rotation={[0, 0, -0.18]}><cylinderGeometry args={[0.035, 0.035, h, 12]} /></Std>;
}

function Garnish({ g, y, r }: { g: NonNullable<Extract<Dish, { kind: 'glass' }>['garnish']>; y: number; r: number }) {
  const lime = citrusTexture('#7fb544', 'lime');
  const orange = citrusTexture('#f39b2a', 'orange');
  if (g === 'lime' || g === 'orange') {
    const tex = g === 'lime' ? lime : orange;
    return (
      <mesh position={[r - 0.05, y, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.24, 0.24, 0.04, 40]} />
        <meshStandardMaterial attach="material-0" color={g === 'lime' ? '#6aa838' : '#ee8f22'} />
        <meshStandardMaterial attach="material-1" map={tex} />
        <meshStandardMaterial attach="material-2" map={tex} />
      </mesh>
    );
  }
  if (g === 'mint') return (
    <group position={[-0.1, y + 0.02, 0.05]}>
      {[0, 1.3, 2.6, 3.9].map((a) => <Std key={a} color="#3f9a4a" rough={0.5} position={[Math.cos(a) * 0.1, 0.03, Math.sin(a) * 0.1]} rotation={[0.6, a, 0]} scale={[0.13, 0.02, 0.07]}><sphereGeometry args={[1, 12, 8]} /></Std>)}
    </group>
  );
  if (g === 'strawberry') return <Std color="#d8243f" rough={0.35} position={[r - 0.05, y + 0.05, 0]} scale={[0.17, 0.2, 0.17]}><sphereGeometry args={[1, 16, 12]} /></Std>;
  if (g === 'banana') return <Std color="#f2dc7a" position={[r - 0.05, y, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]}><cylinderGeometry args={[0.16, 0.16, 0.05, 24]} /></Std>;
  if (g === 'watermelon') return (
    <group position={[r - 0.02, y + 0.05, 0]} rotation={[0, 0, -0.3]}>
      <Std color="#e8455a"><cylinderGeometry args={[0, 0.28, 0.05, 3, 1, false, 0, Math.PI]} /></Std>
      <Std color="#3d8a3a" position={[0, -0.01, 0]}><cylinderGeometry args={[0.29, 0.29, 0.06, 24, 1, false, Math.PI / 2, Math.PI]} /></Std>
    </group>
  );
  if (g === 'pineapple') return <Std color="#f5cf3f" position={[r - 0.05, y, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]}><cylinderGeometry args={[0.22, 0.22, 0.06, 6]} /></Std>;
  return null;
}

function Glass({ style, liquid, garnish = 'none', drizzle }: Extract<Dish, { kind: 'glass' }>) {
  const shake = style === 'shake';
  const smooth = style === 'smoothie';
  const outer = useMemo(() => shake
    ? [[0, 0], [0.3, 0], [0.32, 0.06], [0.12, 0.12], [0.1, 0.35], [0.2, 0.42], [0.45, 0.6], [0.56, 1.45], [0.58, 1.5]]
    : smooth ? [[0, 0], [0.38, 0], [0.4, 0.08], [0.36, 0.3], [0.5, 0.9], [0.52, 1.35], [0.5, 1.42]]
      : [[0, 0], [0.42, 0], [0.44, 0.1], [0.48, 1.4], [0.49, 1.45]], [shake, smooth]);
  const fill = useMemo(() => shake
    ? [[0, 0.43], [0.43, 0.62], [0.53, 1.35], [0, 1.35]]
    : smooth ? [[0, 0.1], [0.34, 0.1], [0.32, 0.3], [0.46, 0.9], [0.48, 1.25], [0, 1.25]]
      : [[0, 0.1], [0.41, 0.1], [0.445, 1.15], [0, 1.15]], [shake, smooth]);
  const top = shake ? 1.35 : smooth ? 1.25 : 1.15;
  const r = rand(liquid.length * 31);
  return (
    <group>
      <Lathe pts={fill} color={liquid} opacity={style === 'tall' || style === 'sparkling' ? 0.85 : undefined} />
      {style === 'sparkling' && <Lathe pts={[[0, 0.85], [0.44, 0.85], [0.445, 1.15], [0, 1.15]]} color="#2b1508" />}
      {(style === 'tall' || style === 'sparkling') && Array.from({ length: 5 }, (_, i) => (
        <RoundedBox key={i} args={[0.24, 0.24, 0.24]} radius={0.04} position={[(r() - 0.5) * 0.4, top - 0.12 - r() * 0.5, (r() - 0.5) * 0.4]} rotation={[r() * 3, r() * 3, 0]}>
          <meshPhysicalMaterial color="#ffffff" transparent opacity={0.45} roughness={0.05} clearcoat={1} />
        </RoundedBox>
      ))}
      {shake && (
        <group position={[0, top, 0]}>
          {[0.5, 0.42, 0.32, 0.2].map((s, i) => (
            <mesh key={i} position={[0, i * 0.13, 0]} castShadow><torusGeometry args={[s * 0.75, s * 0.32, 16, 32]} /><meshStandardMaterial color="#fffaf2" roughness={0.9} /></mesh>
          ))}
          <Std color="#fffaf2" rough={0.9} position={[0, 0.58, 0]}><coneGeometry args={[0.1, 0.22, 16]} /></Std>
          {drizzle && <Drizzle color={drizzle} />}
        </group>
      )}
      <Lathe pts={outer} phys />
      <Straw color={shake ? '#E3AA65' : '#F3E7D5'} h={shake ? 2.4 : 2.0} at={[0.2, shake ? 1.2 : 1.0, 0]} />
      {garnish !== 'none' && <Garnish g={garnish} y={(shake ? 1.5 : smooth ? 1.42 : 1.45) - 0.05} r={shake ? 0.58 : 0.5} />}
      {garnish === 'mint' && <Garnish g="lime" y={1.4} r={0.5} />}
    </group>
  );
}

function Drizzle({ color }: { color: string }) {
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let t = 0; t < 1; t += 0.01) {
      const a = t * Math.PI * 8;
      const rr = 0.45 - t * 0.35;
      pts.push(new THREE.Vector3(Math.cos(a) * rr, 0.12 + t * 0.5 + Math.sin(a * 3) * 0.02, Math.sin(a) * rr));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, 0.025, 8, false);
  }, []);
  return <mesh geometry={geo}><meshStandardMaterial color={color} roughness={0.2} /></mesh>;
}

/* ---------------- pastries ---------------- */
function Cinnamon({ choc }: { choc?: boolean }) {
  // a rolled spiral of dough with a darker cinnamon (or Nutella) line following the groove
  const { dough, swirl } = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const turns = 3.4;
    for (let t = 0; t <= 1; t += 0.004) {
      const a = t * Math.PI * 2 * turns;
      const rr = 0.1 + t * 0.55;
      pts.push(new THREE.Vector3(Math.cos(a) * rr, 0, Math.sin(a) * rr));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    return { dough: new THREE.TubeGeometry(curve, 500, 0.09, 14, false), swirl: new THREE.TubeGeometry(curve, 500, 0.035, 8, false) };
  }, []);
  const icing = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 7; i++) pts.push(new THREE.Vector3(-0.5 + i * 0.17, 0, (i % 2 ? 1 : -1) * 0.42));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.018, 8, false);
  }, []);
  return (
    <group position={[0, 0.17, 0]}>
      <mesh geometry={dough} scale={[1, 1.9, 1]} castShadow><meshStandardMaterial color="#d39a55" roughness={0.6} /></mesh>
      <mesh geometry={swirl} position={[0.045, 0.14, 0.045]}><meshStandardMaterial color={choc ? '#3a1a0c' : '#8a4a1e'} roughness={0.45} /></mesh>
      {!choc && <mesh geometry={icing} position={[0, 0.2, 0]}><meshStandardMaterial color="#fff8ec" roughness={0.3} /></mesh>}
    </group>
  );
}

function PainChoc() {
  return (
    <group position={[0, 0.2, 0]} rotation={[0, 0.4, 0]}>
      <RoundedBox args={[1.2, 0.38, 0.7]} radius={0.17} smoothness={6} castShadow><meshStandardMaterial color="#c98a3e" roughness={0.55} /></RoundedBox>
      {[-0.4, -0.2, 0, 0.2, 0.4].map((x) => <Std key={x} color="#a8692a" position={[x, 0.19, 0]} scale={[0.02, 0.02, 0.6]}><boxGeometry /></Std>)}
      {[-1, 1].map((s) => <Std key={s} color="#3a1a0c" rough={0.3} position={[s * 0.6, -0.02, 0.12]} scale={[0.05, 0.1, 0.16]}><boxGeometry /></Std>)}
    </group>
  );
}

/* ---------------- mains ---------------- */
function Noodles({ seed = 3 }) {
  const geos = useMemo(() => {
    const r = rand(seed);
    return Array.from({ length: 26 }, () => {
      const pts: THREE.Vector3[] = [];
      const a0 = r() * Math.PI * 2;
      for (let i = 0; i < 8; i++) {
        const a = a0 + i * 0.7;
        const rr = 0.15 + r() * 0.65;
        pts.push(new THREE.Vector3(Math.cos(a) * rr, 0.08 + (1 - rr / 0.85) * 0.45 * r() + 0.05, Math.sin(a) * rr));
      }
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.045, 6, false);
    });
  }, [seed]);
  return <group>{geos.map((g, i) => <mesh key={i} geometry={g} castShadow><meshStandardMaterial color="#f0d9a0" roughness={0.45} /></mesh>)}</group>;
}

function Bits({ kind, n = 8, spread = 0.6, y = 0.45, seed = 1 }: { kind: 'chicken' | 'prawn' | 'bacon' | 'cheese' | 'parsley' | 'mozzarella'; n?: number; spread?: number; y?: number; seed?: number }) {
  const r = rand(seed * 97 + kind.length);
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const p: V3 = [(r() - 0.5) * spread * 2, y + r() * 0.1, (r() - 0.5) * spread * 2];
        const rot: V3 = [r() * 3, r() * 3, r() * 3];
        if (kind === 'chicken') return <RoundedBox key={i} args={[0.18, 0.12, 0.14]} radius={0.04} position={p} rotation={rot} castShadow><meshStandardMaterial color="#d9a066" roughness={0.7} /></RoundedBox>;
        if (kind === 'prawn') return <mesh key={i} position={p} rotation={rot} castShadow><torusGeometry args={[0.1, 0.05, 10, 20, Math.PI * 1.3]} /><meshStandardMaterial color="#f08a5d" roughness={0.5} /></mesh>;
        if (kind === 'bacon') return <Std key={i} color="#a8443a" rough={0.5} position={p} rotation={rot} scale={[0.26, 0.025, 0.09]}><boxGeometry /></Std>;
        if (kind === 'cheese') return <Std key={i} color="#f0b84a" rough={0.6} position={p}><icosahedronGeometry args={[0.1, 1]} /></Std>;
        if (kind === 'mozzarella') return <Std key={i} color="#fbf6ea" rough={0.5} position={p} scale={[1, 0.4, 1]}><sphereGeometry args={[0.12, 12, 10]} /></Std>;
        return <Std key={i} color="#3f8f3a" position={p} scale={[0.04, 0.01, 0.03]}><boxGeometry /></Std>;
      })}
    </group>
  );
}

function Pasta({ topping }: { topping: 'chicken' | 'prawn' | 'bacon' }) {
  return (
    <group>
      <Std color="#f2e2c2" rough={0.3} position={[0, 0.1, 0]} scale={[0.85, 0.12, 0.85]}><sphereGeometry args={[1, 32, 16]} /></Std>
      <Noodles seed={topping.length} />
      <Bits kind={topping} n={7} spread={0.4} y={0.38} seed={2} />
      <Bits kind="parsley" n={30} spread={0.55} y={0.45} seed={5} />
    </group>
  );
}

function Shakshuka() {
  const r = rand(4);
  return (
    <group>
      <Std color="#1d1b1a" rough={0.4} metal={0.6} position={[0, 0.1, 0]}><cylinderGeometry args={[0.98, 0.9, 0.2, 48]} /></Std>
      <Std color="#1d1b1a" rough={0.4} metal={0.6} position={[1.35, 0.15, 0]} scale={[0.7, 0.06, 0.12]}><boxGeometry /></Std>
      <Std color="#b2321d" rough={0.4} position={[0, 0.2, 0]}><cylinderGeometry args={[0.9, 0.9, 0.04, 48]} /></Std>
      {Array.from({ length: 14 }, (_, i) => <Std key={i} color={i % 3 ? '#c8441f' : '#6c8f2f'} position={[(r() - 0.5) * 1.4, 0.23, (r() - 0.5) * 1.4]} scale={[0.09, 0.04, 0.07]}><sphereGeometry args={[1, 10, 8]} /></Std>)}
      {[[-0.3, 0.1], [0.32, -0.15]].map(([x, z], i) => (
        <group key={i} position={[x, 0.23, z]}>
          <Std color="#fbf7ef" rough={0.4} scale={[0.32, 0.03, 0.28]}><sphereGeometry args={[1, 24, 12]} /></Std>
          <Std color="#f0a01a" rough={0.2} position={[0.02, 0.03, 0]} scale={[0.11, 0.07, 0.11]}><sphereGeometry args={[1, 20, 12]} /></Std>
        </group>
      ))}
      <Bits kind="mozzarella" n={5} spread={0.5} y={0.24} seed={8} />
      <Bits kind="parsley" n={40} spread={0.7} y={0.27} seed={9} />
    </group>
  );
}

function FriesPile({ n = 34, topping }: { n?: number; topping?: 'chicken' | 'cheese' | 'prawn' }) {
  const r = rand(21);
  const boat = useMemo(() => [[0, 0], [0.75, 0], [0.95, 0.35], [0.93, 0.36], [0.72, 0.03], [0, 0.03]], []);
  return (
    <group>
      <Lathe pts={boat} color="#b98a55" />
      {Array.from({ length: n }, (_, i) => (
        <Std key={i} color={i % 4 ? '#f1c25a' : '#e3a63c'} rough={0.7}
          position={[(r() - 0.5) * 1.1, 0.12 + r() * 0.3, (r() - 0.5) * 1.1]} rotation={[r() * 1.2 - 0.6, r() * 3, r() * 1.2 - 0.6]} scale={[0.07, 0.07, 0.55]}><boxGeometry /></Std>
      ))}
      {topping && <Bits kind={topping} n={9} spread={0.45} y={0.45} seed={6} />}
      {topping && <Drizzle color="#f4f0e0" />}
    </group>
  );
}

function Chips({ at = [0.8, 0.05, 0.55] as V3 }) {
  const r = rand(13);
  return (
    <group position={at}>
      {Array.from({ length: 9 }, (_, i) => (
        <Std key={i} color={i % 3 ? '#efc35e' : '#e2ad46'} rough={0.5} position={[(r() - 0.5) * 0.4, 0.03 + i * 0.025, (r() - 0.5) * 0.4]} rotation={[r() - 0.5, r() * 3, r() - 0.5]} scale={[0.17, 0.015, 0.14]}><sphereGeometry args={[1, 14, 8]} /></Std>
      ))}
    </group>
  );
}

function Panini({ veg }: { veg?: boolean }) {
  const tex = grillTexture();
  const half = (key: string, pos: V3, rot: V3) => (
    <group key={key} position={pos} rotation={rot}>
      <RoundedBox args={[0.75, 0.12, 0.55]} radius={0.05} position={[0, 0.06, 0]} castShadow><meshStandardMaterial map={tex} roughness={0.7} /></RoundedBox>
      <Std color={veg ? '#5e8a3a' : '#e8c79a'} position={[0, 0.15, 0]} scale={[0.72, 0.06, 0.54]}><boxGeometry /></Std>
      <Std color="#d23b2a" position={[0.02, 0.19, 0]} scale={[0.7, 0.03, 0.5]}><boxGeometry /></Std>
      <Std color="#fbf6ea" position={[0, 0.215, 0]} scale={[0.73, 0.025, 0.55]}><boxGeometry /></Std>
      <RoundedBox args={[0.75, 0.12, 0.55]} radius={0.05} position={[0, 0.29, 0]} castShadow><meshStandardMaterial map={tex} roughness={0.7} /></RoundedBox>
    </group>
  );
  return (
    <group>
      {half('a', [-0.25, 0, -0.1], [0, 0.4, 0])}
      {half('b', [0.25, 0.12, 0.15], [0.15, -0.3, 0.25])}
      <Chips />
    </group>
  );
}

function Wrap({ filling }: { filling: 'devilled' | 'crispy' | 'tuna' }) {
  const face = useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d')!;
    g.fillStyle = '#e9d3a6'; g.beginPath(); g.arc(128, 128, 128, 0, 7); g.fill();
    g.fillStyle = '#f3e3c0'; g.beginPath(); g.arc(128, 128, 112, 0, 7); g.fill();
    const cols = filling === 'tuna' ? ['#c9a890', '#d23b2a', '#5e9a3a', '#f0c04a'] : filling === 'crispy' ? ['#d99a4a', '#f4f0e0', '#f0c04a', '#5e9a3a'] : ['#b8461f', '#d23b2a', '#5e9a3a', '#f0c04a'];
    const r = rand(filling.length);
    for (let i = 0; i < 70; i++) { g.fillStyle = cols[i % 4]; g.beginPath(); g.arc(128 + (r() - 0.5) * 170, 128 + (r() - 0.5) * 170, 8 + r() * 14, 0, 7); g.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, [filling]);
  const piece = (k: string, pos: V3, rot: V3) => (
    <mesh key={k} position={pos} rotation={rot} castShadow>
      <cylinderGeometry args={[0.28, 0.28, 0.8, 40]} />
      <meshStandardMaterial attach="material-0" color="#e2c48f" roughness={0.7} />
      <meshStandardMaterial attach="material-1" map={face} />
      <meshStandardMaterial attach="material-2" color="#e2c48f" />
    </mesh>
  );
  return (
    <group>
      {piece('a', [-0.22, 0.42, 0], [0, 0, 0.18])}
      {piece('b', [0.24, 0.4, 0.05], [0.1, 0, -0.2])}
      <Chips at={[0.75, 0.05, 0.6]} />
    </group>
  );
}

function Burger({ patty }: { patty: 'chicken' | 'mushroom' }) {
  const r = rand(5);
  return (
    <group>
      <Std color="#c98a3e" rough={0.55} position={[0, 0.1, 0]} scale={[0.62, 0.12, 0.62]}><cylinderGeometry args={[1, 0.95, 1.6, 40]} /></Std>
      <mesh position={[0, 0.34, 0]} scale={[0.68, 0.17, 0.66]} castShadow>
        <icosahedronGeometry args={[1, 3]} /><meshStandardMaterial color={patty === 'mushroom' ? '#b88745' : '#d39a4a'} roughness={0.9} flatShading />
      </mesh>
      <Std color="#f0a63a" rough={0.3} position={[0, 0.5, 0]}><cylinderGeometry args={[0.64, 0.64, 0.03, 40]} /></Std>
      <Std color={patty === 'mushroom' ? '#f2efe4' : '#d23b2a'} position={[0, 0.55, 0]}><cylinderGeometry args={[0.55, 0.55, 0.07, 40]} /></Std>
      <mesh position={[0, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <circleGeometry args={[0.72, 18]} /><meshStandardMaterial color="#6aa83a" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.62, 0]} scale={[0.66, 0.42, 0.66]} castShadow>
        <sphereGeometry args={[1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#c47f34" roughness={0.45} />
      </mesh>
      {Array.from({ length: 22 }, (_, i) => {
        const a = r() * Math.PI * 2, b = r() * 1.1;
        return <Std key={i} color="#fbf1da" position={[Math.cos(a) * Math.sin(b) * 0.66, 0.62 + Math.cos(b) * 0.42, Math.sin(a) * Math.sin(b) * 0.66]} scale={[0.03, 0.015, 0.018]}><sphereGeometry args={[1, 8, 6]} /></Std>;
      })}
      <Chips at={[0.9, 0.05, 0.55]} />
    </group>
  );
}

function Sandwich({ filling }: { filling: 'chicken' | 'tuna' }) {
  const tri = useMemo(() => { const s = new THREE.Shape(); s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0, 0.85); s.closePath(); return s; }, []);
  const tex = grillTexture();
  const half = (k: string, pos: V3, rot: V3) => (
    <group key={k} position={pos} rotation={rot}>
      <mesh castShadow><extrudeGeometry args={[tri, { depth: 0.1, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03 }]} /><meshStandardMaterial map={tex} roughness={0.7} /></mesh>
      <mesh position={[0, 0, 0.13]}><extrudeGeometry args={[tri, { depth: 0.1, bevelEnabled: false }]} /><meshStandardMaterial color={filling === 'tuna' ? '#d8b99a' : '#b8461f'} /></mesh>
      <mesh position={[0, 0, 0.22]} scale={[1.04, 1.02, 1]}><extrudeGeometry args={[tri, { depth: 0.03, bevelEnabled: false }]} /><meshStandardMaterial color="#5e9a3a" /></mesh>
      <mesh castShadow position={[0, 0, 0.27]}><extrudeGeometry args={[tri, { depth: 0.1, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03 }]} /><meshStandardMaterial map={tex} roughness={0.7} /></mesh>
    </group>
  );
  return (
    <group>
      {half('a', [-0.3, 0.02, 0.1], [-Math.PI / 2, 0, 0.3])}
      {half('b', [0.2, 0.0, -0.1], [-1.2, 0.1, -0.4])}
      <Chips at={[0.85, 0.05, 0.55]} />
    </group>
  );
}

/* ---------------- add-ons ---------------- */
function Ramekin({ color, children }: { color: string; children?: ReactNode }) {
  const pts = useMemo(() => [[0, 0], [0.42, 0], [0.48, 0.35], [0.44, 0.36], [0.39, 0.04], [0, 0.04]], []);
  return (
    <group>
      <Lathe pts={pts} color="#f4efe8" />
      <Std color={color} rough={0.15} position={[0, 0.28, 0]}><cylinderGeometry args={[0.43, 0.4, 0.04, 40]} /></Std>
      {children}
    </group>
  );
}
function SyrupJug({ color }: { color: string }) {
  const jug = useMemo(() => [[0, 0], [0.32, 0], [0.36, 0.3], [0.28, 0.6], [0.16, 0.75], [0.17, 0.85]], []);
  const fill = useMemo(() => [[0, 0.02], [0.3, 0.02], [0.33, 0.3], [0.26, 0.55], [0, 0.55]], []);
  return <group><Lathe pts={fill} color={color} opacity={0.9} /><Lathe pts={jug} phys /><Ramekin color={color} /></group>;
}
function Cookies({ biscoff }: { biscoff?: boolean }) {
  const r = rand(3);
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <group key={i} position={[i === 2 ? 0.35 : 0, 0.06 + (i < 2 ? i * 0.11 : 0), i === 2 ? 0.4 : 0]} rotation={[0, i, i === 2 ? 0.2 : 0]}>
          {biscoff
            ? <RoundedBox args={[0.7, 0.08, 0.45]} radius={0.03} castShadow><meshStandardMaterial color="#b9773a" roughness={0.7} /></RoundedBox>
            : <Std color="#c99355" rough={0.8}><cylinderGeometry args={[0.42, 0.42, 0.09, 32]} /></Std>}
          {!biscoff && Array.from({ length: 7 }, (_, k) => <Std key={k} color="#3a1a0c" position={[(r() - 0.5) * 0.55, 0.05, (r() - 0.5) * 0.55]} scale={0.045}><sphereGeometry args={[1, 8, 6]} /></Std>)}
        </group>
      ))}
    </group>
  );
}
function Bars({ color }: { color: string }) {
  return <group>{[0, 1, 2].map((i) => <RoundedBox key={i} args={[0.9, 0.16, 0.26]} radius={0.05} position={[0, 0.08 + i * 0.17, (i - 1) * 0.08]} rotation={[0, i * 0.3, 0]} castShadow><meshStandardMaterial color={color} roughness={0.5} /></RoundedBox>)}</group>;
}
function FriedEgg() {
  return (
    <group>
      <Std color="#fbf7ef" rough={0.35} position={[0, 0.03, 0]} scale={[0.6, 0.04, 0.5]}><sphereGeometry args={[1, 32, 12]} /></Std>
      <Std color="#f0a01a" rough={0.2} position={[0.05, 0.08, 0]} scale={[0.2, 0.12, 0.2]}><sphereGeometry args={[1, 24, 16]} /></Std>
    </group>
  );
}
function BreadSlices() {
  return <group>{[0, 1].map((i) => <RoundedBox key={i} args={[0.8, 0.1, 0.8]} radius={0.06} position={[i * 0.15, 0.06 + i * 0.12, i * 0.1]} rotation={[0, i * 0.4, 0]} castShadow><meshStandardMaterial color={i ? '#e8c48a' : '#d9a35e'} roughness={0.8} /></RoundedBox>)}</group>;
}
function CheeseSlices() {
  return <group>{[0, 1, 2].map((i) => <Std key={i} color="#f4c24a" rough={0.4} position={[i * 0.06, 0.03 + i * 0.03, i * 0.04]} rotation={[0, i * 0.25, 0]} scale={[0.75, 0.025, 0.75]}><boxGeometry /></Std>)}</group>;
}

/* ---------------- the switch ---------------- */
export function FoodModel({ dish }: { dish: Dish }) {
  switch (dish.kind) {
    case 'cup': return <Cup top={dish.top} small={dish.small} />;
    case 'affogato': return <Affogato />;
    case 'glass': return <Glass {...dish} />;
    case 'croissant': return <group position={[0, 0.25, 0]} rotation={[-Math.PI / 2.4, 0, 0.3]}><Croissant scale={1.25} /></group>;
    case 'cinnamon': return <Cinnamon choc={dish.choc} />;
    case 'painchoc': return <PainChoc />;
    case 'pasta': return <Pasta topping={dish.topping} />;
    case 'shakshuka': return <Shakshuka />;
    case 'fries': return <FriesPile topping={dish.topping} n={dish.topping ? 34 : 26} />;
    case 'panini': return <Panini veg={dish.veg} />;
    case 'wrap': return <Wrap filling={dish.filling} />;
    case 'burger': return <Burger patty={dish.patty} />;
    case 'sandwich': return <Sandwich filling={dish.filling} />;
    case 'syrup': return <SyrupJug color={dish.color} />;
    case 'sauce': return <Ramekin color={dish.color} />;
    case 'pickle': return <Ramekin color="#a7a43a"><Bits kind="parsley" n={20} spread={0.25} y={0.31} seed={2} /></Ramekin>;
    case 'cookies': return <Cookies biscoff={dish.biscoff} />;
    case 'bars': return <Bars color={dish.color} />;
    case 'egg': return <FriedEgg />;
    case 'bread': return <BreadSlices />;
    case 'cheese': return <CheeseSlices />;
  }
}
