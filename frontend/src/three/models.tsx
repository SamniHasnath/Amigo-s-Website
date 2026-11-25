// Procedural 3D models (no external .glb files needed).
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ---------- Latte art texture, drawn on a canvas ---------- */
function useLatteTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const g = c.getContext('2d')!;
    const grd = g.createRadialGradient(256, 256, 40, 256, 256, 256);
    grd.addColorStop(0, '#c08550');
    grd.addColorStop(0.65, '#8c5326');
    grd.addColorStop(1, '#5a3014');
    g.fillStyle = grd;
    g.fillRect(0, 0, 512, 512);
    // crema ring
    g.strokeStyle = 'rgba(214,163,92,.55)';
    g.lineWidth = 18;
    g.beginPath(); g.arc(256, 256, 236, 0, Math.PI * 2); g.stroke();
    // rosetta: stacked foam leaves getting smaller toward the top
    g.fillStyle = '#fbf3e8';
    for (let i = 0; i < 7; i++) {
      const y = 360 - i * 36;
      const w = 150 - i * 17;
      const h = 34 - i * 2;
      g.beginPath();
      g.ellipse(256, y, w, h, 0, Math.PI * 0.05, Math.PI * 0.95, false);
      g.ellipse(256, y - 10, w * 0.82, h * 0.6, 0, Math.PI * 0.95, Math.PI * 0.05, true);
      g.fill();
    }
    // heart cap
    g.beginPath();
    g.moveTo(256, 150);
    g.bezierCurveTo(200, 110, 210, 60, 256, 80);
    g.bezierCurveTo(302, 60, 312, 110, 256, 150);
    g.fill();
    // pull-through line
    g.strokeStyle = '#b07440';
    g.lineWidth = 7;
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(256, 92); g.lineTo(256, 420); g.stroke();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, []);
}

/* ---------- Steam: soft animated wisps (custom shader) ---------- */
/** 0 = calm, 1 = the visitor's pointer is over the cup (steam livens up a little). */
export const steamState = { boost: 0 };
const steamVertex = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uSeed;
  void main() {
    vUv = uv;
    vec3 p = position;
    p.x += sin(p.y * 3.0 + uTime * 1.4 + uSeed) * 0.12 * uv.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const steamFragment = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uSeed;
  uniform float uBoost;
  void main() {
    float x = vUv.x - 0.5 + sin(vUv.y * 9.0 - uTime * 2.0 + uSeed) * 0.08;
    float core = smoothstep(0.22, 0.0, abs(x));
    float fadeY = smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.45, vUv.y);
    float flicker = 0.75 + 0.25 * sin(uTime * 1.7 + uSeed * 3.0 + vUv.y * 5.0);
    gl_FragColor = vec4(vec3(1.0), core * fadeY * flicker * (0.3 + uBoost * 0.16));
  }
`;
function SteamWisp({ x, seed }: { x: number; seed: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uSeed: { value: seed }, uBoost: { value: 0 } }), [seed]);
  useFrame((_, dt) => {
    if (!mat.current) return;
    const u = mat.current.uniforms;
    u.uBoost.value = THREE.MathUtils.lerp(u.uBoost.value, steamState.boost, 1 - Math.pow(0.02, dt));
    u.uTime.value += dt * (1 + u.uBoost.value * 0.7);
  });
  return (
    <mesh position={[x, 1.35, 0]}>
      <planeGeometry args={[0.5, 1.3, 1, 24]} />
      <shaderMaterial ref={mat} vertexShader={steamVertex} fragmentShader={steamFragment} uniforms={uniforms}
        transparent depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}
export function Steam() {
  const g = useRef<THREE.Group>(null);
  // keep the wisps facing the camera horizontally
  useFrame(({ camera }) => {
    if (!g.current) return;
    const parentQ = new THREE.Quaternion();
    g.current.parent?.getWorldQuaternion(parentQ);
    g.current.quaternion.copy(parentQ.invert().multiply(camera.quaternion));
  });
  return (
    <group ref={g}>
      <SteamWisp x={-0.16} seed={0.3} />
      <SteamWisp x={0.05} seed={2.1} />
      <SteamWisp x={0.22} seed={4.4} />
    </group>
  );
}

/* ---------- Ceramic cup + saucer + spoon ---------- */
const ceramic = new THREE.MeshPhysicalMaterial({ color: '#f6f1ea', roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.15 });
const gold = new THREE.MeshStandardMaterial({ color: '#E3AA65', metalness: 1, roughness: 0.3 });
const steel = new THREE.MeshStandardMaterial({ color: '#d9d4cf', metalness: 1, roughness: 0.2 });

export function CoffeeCup({ steam = true }: { steam?: boolean }) {
  const latte = useLatteTexture();
  const cupGeo = useMemo(() => {
    const pts = [
      [0, 0], [0.4, 0], [0.44, 0.03], [0.5, 0.2], [0.58, 0.5], [0.63, 0.74], [0.62, 0.775],
      [0.585, 0.765], [0.545, 0.5], [0.465, 0.22], [0.385, 0.07], [0, 0.07],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 96);
  }, []);
  const saucerGeo = useMemo(() => {
    const pts = [[0, 0], [0.55, 0.0], [0.95, 0.04], [1.05, 0.11], [1.03, 0.13], [0.92, 0.08], [0.56, 0.055], [0, 0.055]]
      .map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 96);
  }, []);
  return (
    <group>
      <mesh geometry={saucerGeo} material={ceramic} castShadow receiveShadow />
      {/* gold rim on the saucer */}
      <mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]} material={gold}>
        <torusGeometry args={[1.04, 0.012, 8, 96]} />
      </mesh>
      <group position={[0, 0.055, 0]}>
        <mesh geometry={cupGeo} material={ceramic} castShadow />
        <mesh position={[0, 0.77, 0]} rotation={[Math.PI / 2, 0, 0]} material={gold}>
          <torusGeometry args={[0.603, 0.012, 8, 96]} />
        </mesh>
        {/* handle */}
        <mesh position={[0.64, 0.42, 0]} rotation={[0, 0, -Math.PI * 0.6]} material={ceramic} castShadow>
          <torusGeometry args={[0.18, 0.045, 16, 48, Math.PI * 1.2]} />
        </mesh>
        {/* coffee + latte art */}
        <mesh position={[0, 0.66, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
          <circleGeometry args={[0.562, 64]} />
          <meshStandardMaterial map={latte} roughness={0.35} />
        </mesh>
        {steam && <Steam />}
      </group>
      {/* spoon */}
      <group position={[-0.25, 0.1, 0.72]} rotation={[0, 0.5, 0]}>
        <mesh material={steel} position={[0.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.022, 0.5, 4, 12]} />
        </mesh>
        <mesh material={steel} scale={[0.14, 0.03, 0.1]}>
          <sphereGeometry args={[1, 24, 16]} />
        </mesh>
      </group>
    </group>
  );
}

/* ---------- Coffee bean (two halves with a crease) ---------- */
const beanMat = new THREE.MeshStandardMaterial({ color: '#4a2a17', roughness: 0.45, metalness: 0.05 });
const halfBean = new THREE.SphereGeometry(1, 20, 14, 0, Math.PI);
export function Bean(props: JSX.IntrinsicElements['group']) {
  return (
    <group {...props}>
      <group scale={[0.11, 0.075, 0.065]}>
        <mesh geometry={halfBean} material={beanMat} position={[0, 0, 0.09]} />
        <mesh geometry={halfBean} material={beanMat} position={[0, 0, -0.09]} rotation={[0, Math.PI, 0]} />
      </group>
    </group>
  );
}

/* ---------- Croissant (tapered segments along an arc) ---------- */
const pastry = new THREE.MeshStandardMaterial({ color: '#c98a3e', roughness: 0.55 });
const pastryDark = new THREE.MeshStandardMaterial({ color: '#a8692a', roughness: 0.6 });
export function Croissant(props: JSX.IntrinsicElements['group']) {
  const segs = [-1, -0.6, -0.2, 0.2, 0.6, 1];
  return (
    <group {...props}>
      {segs.map((t, i) => {
        const a = t * 1.05;
        const size = 0.3 - Math.abs(t) * 0.17;
        return (
          <mesh key={i} material={i % 2 ? pastryDark : pastry} position={[Math.sin(a) * 0.55, Math.cos(a) * 0.55 - 0.55, 0]}
            rotation={[0, 0, -a]} scale={[size * 0.9, size * 1.25, size]}>
            <sphereGeometry args={[1, 20, 14]} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ---------- small floating ingredients for the hero ---------- */
export function Cookie(props: JSX.IntrinsicElements['group']) {
  const chips = useMemo(() => Array.from({ length: 7 }, (_, i) => [Math.cos(i * 2.4) * 0.17 * ((i % 3) + 1) / 2, Math.sin(i * 2.4) * 0.17 * ((i % 3) + 1) / 2] as [number, number]), []);
  return (
    <group {...props}>
      <mesh castShadow><cylinderGeometry args={[0.38, 0.38, 0.08, 28]} /><meshStandardMaterial color="#c9904f" roughness={0.85} /></mesh>
      {chips.map(([x, z], i) => <mesh key={i} position={[x, 0.045, z]} scale={0.045}><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color="#3a1a0c" roughness={0.5} /></mesh>)}
    </group>
  );
}
export function CinnamonStick(props: JSX.IntrinsicElements['group']) {
  return (
    <group {...props}>
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.07, 0.07, 1.1, 14, 1, true]} /><meshStandardMaterial color="#8a4a24" roughness={0.8} side={THREE.DoubleSide} /></mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0.02, 0.01, 0]}><cylinderGeometry args={[0.05, 0.05, 1.1, 14, 1, true]} /><meshStandardMaterial color="#6e3618" roughness={0.8} side={THREE.DoubleSide} /></mesh>
    </group>
  );
}
export function MintLeaf(props: JSX.IntrinsicElements['group']) {
  return (
    <group {...props}>
      <mesh castShadow scale={[0.26, 0.03, 0.14]}><sphereGeometry args={[1, 16, 10]} /><meshStandardMaterial color="#4c9a52" roughness={0.45} /></mesh>
      <mesh position={[0, 0.03, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.005, 0.24, 0.005]}><cylinderGeometry /><meshStandardMaterial color="#8cc78c" /></mesh>
    </group>
  );
}
