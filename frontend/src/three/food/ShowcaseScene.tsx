// The 3D "counter" scene: marble top, back wall with the café sign, and a plate
// that slides out / in when the dish changes (like a waiter swapping plates).
import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import type { MenuItem } from '@/types';
import { FoodModel, Plate, dishTop } from './FoodModels';
import { dishFor } from './dishFor';
import { marbleTexture, wallTexture } from './textures';
import PhotoDish from './PhotoDish';
import { ModelBoundary, ModelDish, MODEL_TOP } from './ModelDish';
import { daypart } from '@/lib/hours';
import { imageSrc } from '@/lib/api';

/** Dishes that look tiny on the plate get scaled up. */
const SMALL = new Set(['croissant', 'cinnamon', 'painchoc', 'cookies', 'egg', 'bread', 'cheese', 'sauce', 'pickle', 'syrup', 'bars']);

export interface Pointer {
  /** product anchor on screen, in stage pixels */
  x: number; y: number;
  /** 0 while the plate is sliding, 1 when settled */
  visible: number;
}

export interface Drag { rotY: number; spinning: boolean }

function Room() {
  const marble = useMemo(() => { const t = marbleTexture().clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1); t.needsUpdate = true; return t; }, []);
  const wall = wallTexture();
  return (
    <group>
      <mesh position={[0, 1.3, -4]}><planeGeometry args={[16, 8]} /><meshBasicMaterial map={wall} toneMapped={false} /></mesh>
      <mesh position={[0, -0.22, 0]} receiveShadow><boxGeometry args={[18, 0.3, 9]} /><meshStandardMaterial map={marble} roughness={0.42} metalness={0.05} /></mesh>
    </group>
  );
}

function Dish({ items, target, dir, drag, pointer, onShown }: {
  items: MenuItem[]; target: number; dir: MutableRefObject<number>; drag: MutableRefObject<Drag>;
  pointer: MutableRefObject<Pointer>; onShown: (i: number) => void;
}) {
  const [shown, setShown] = useState(target);
  const slide = useRef<THREE.Group>(null);
  const turn = useRef<THREE.Group>(null);
  const anchor = useRef<THREE.Object3D>(null);
  const phase = useRef<'idle' | 'out' | 'in'>('idle');
  const { camera, size } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);
  const item = items[shown] ?? items[0];
  const dish = useMemo(() => (item ? dishFor(item) : null), [item]);
  const photo = item?.imageUrl ? imageSrc(item.imageUrl) : null;
  const model = item?.modelUrl ? imageSrc(item.modelUrl) : null;
  const [photoH, setPhotoH] = useState(1);
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  // keep shown in range if the list changes (new category)
  useEffect(() => { if (shown >= items.length) { setShown(0); onShown(0); } }, [items, shown, onShown]);

  useFrame((_, dt) => {
    const g = slide.current, t = turn.current;
    if (!g || !t) return;
    const k = 1 - Math.pow(0.0005, dt);
    if (phase.current === 'idle' && target !== shown) phase.current = 'out';
    if (phase.current === 'out') {
      g.position.x = THREE.MathUtils.lerp(g.position.x, -dir.current * 7.5, k * 0.9);
      if (Math.abs(g.position.x) > 6.8 || reduced) {
        setShown(target); onShown(target);
        g.position.x = dir.current * 7.5; t.rotation.y = -0.6 * dir.current; drag.current.rotY = 0;
        phase.current = 'in';
      }
    } else if (phase.current === 'in') {
      g.position.x = THREE.MathUtils.lerp(g.position.x, 0, k * 0.7);
      if (Math.abs(g.position.x) < 0.01) { g.position.x = 0; phase.current = 'idle'; }
    }
    // a little tilt while it slides, like a plate being pushed
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, -g.position.x * 0.012, k);
    // drag to turn, otherwise a slow idle turn
    // only real 3D (models or the built-in dishes) can turn; a flat photo stays facing you
    const canTurn = !!model || !photo;
    if (canTurn && !drag.current.spinning && !reduced) drag.current.rotY += dt * 0.18;
    t.rotation.y = THREE.MathUtils.lerp(t.rotation.y, canTurn ? drag.current.rotY : 0, k);

    // project the anchor to stage pixels for the card's pointer line
    if (anchor.current) {
      anchor.current.getWorldPosition(v).project(camera);
      pointer.current.x = (v.x + 1) / 2 * size.width;
      pointer.current.y = (1 - v.y) / 2 * size.height;
      pointer.current.visible = Math.max(0, 1 - Math.abs(g.position.x) * 1.5);
    }
  });

  if (!dish) return null;
  return (
    <group ref={slide}>
      <group ref={turn}>
        {(model || !photo) && <Plate />}
        {model ? (
          <ModelBoundary resetKey={model} fallback={photo ? <PhotoDish key={photo} url={photo} onHeight={setPhotoH} /> : <FoodModel dish={dish} />}>
            <Suspense fallback={null}><ModelDish url={model} /></Suspense>
          </ModelBoundary>
        ) : photo
          ? <PhotoDish key={photo} url={photo} onHeight={setPhotoH} />
          : <group scale={SMALL.has(dish.kind) ? 1.3 : 1}><FoodModel dish={dish} /></group>}
      </group>
      <object3D ref={anchor} position={[0, (model ? MODEL_TOP : photo ? photoH * 0.55 : dishTop(dish) * (SMALL.has(dish.kind) ? 1.3 : 1)) + 0.05, 0]} />
    </group>
  );
}

export default function ShowcaseScene(props: Parameters<typeof Dish>[0]) {
  const { size, camera } = useThree();
  const day = useMemo(() => daypart() === 'day', []);
  // pull the camera back on narrow screens so tall drinks still fit
  useEffect(() => {
    const narrow = window.innerWidth < 1024; // card sits above the dish below lg
    camera.position.set(0, narrow ? 2.9 : 2.2, narrow ? 8.6 : 6.4);
    camera.lookAt(0, narrow ? 1.45 : 0.75, 0);
    // On wide screens the price card sits on the left (left: 7%, width: 360px — see MenuShowcase).
    // Shift the view so the dish is centred in the free space to the right of the card,
    // leaving a small gap instead of hiding the food behind it.
    const cam = camera as THREE.PerspectiveCamera;
    if (!narrow && size.width > 0) {
      const cardRight = size.width * 0.07 + 360;
      const shift = Math.max(0, (cardRight + size.width) / 2 - size.width / 2);
      cam.setViewOffset(size.width, size.height, -shift, 0, size.width, size.height);
    } else {
      cam.clearViewOffset();
    }
    camera.updateProjectionMatrix();
  }, [size.width, size.height, camera]);
  return (
    <>
      <color attach="background" args={['#21130E']} />
      <fog attach="fog" args={['#21130E', 8, 16]} />
      <ambientLight intensity={day ? 0.55 : 0.38} />
      <spotLight position={[1.5, 6, 3.5]} angle={0.45} penumbra={0.7} intensity={day ? 95 : 85} color={day ? '#fff0dc' : '#ffd9a8'} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} />
      <pointLight position={[-3, 2, 2]} intensity={10} color="#E3AA65" />
      <directionalLight position={[-2, 3, 4]} intensity={0.6} color="#fff4e6" />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={2.2} color="#fff3e0" position={[0, 5, 2]} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#E3AA65" position={[-5, 1, 1]} rotation-y={Math.PI / 2} scale={[4, 2, 1]} />
        <Lightformer form="rect" intensity={1} color="#ffffff" position={[5, 1, 1]} rotation-y={-Math.PI / 2} scale={[4, 2, 1]} />
      </Environment>
      <Room />
      <Dish {...props} />
    </>
  );
}
