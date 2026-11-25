// Shows a real photo of the dish in the 3D stage, always facing the camera.
// The bundled photos have soft edges so they melt into the dark counter scene.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const loader = new THREE.TextureLoader();

export default function PhotoDish({ url, onHeight }: { url: string; onHeight: (h: number) => void }) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const face = useRef<THREE.Mesh>(null);
  const p = useMemo(() => new THREE.Vector3(), []);
  // turn the photo to face the camera (around the vertical axis only), whatever the plate is doing
  const zoom = useRef(0.92);
  useFrame(({ camera, pointer }, dt) => {
    const m = face.current; if (!m) return;
    m.getWorldPosition(p);
    m.lookAt(camera.position.x, p.y, camera.position.z);
    // a photo can't really turn, so it gets a gentle zoom-in and a little parallax instead
    zoom.current = THREE.MathUtils.lerp(zoom.current, 1, 1 - Math.pow(0.15, dt));
    m.scale.setScalar(zoom.current);
    m.position.x = THREE.MathUtils.lerp(m.position.x, pointer.x * 0.12, 1 - Math.pow(0.05, dt));
  });
  useEffect(() => {
    let alive = true;
    loader.load(url, (t) => {
      if (!alive) return;
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
      setTex(t);
    });
    return () => { alive = false; };
  }, [url]);

  const img = tex?.image as { width: number; height: number } | undefined;
  const aspect = img ? img.height / img.width : 1;
  const w = Math.min(3.3, 2.7 / aspect);
  const h = w * aspect;
  useEffect(() => { if (tex) onHeight(h); }, [tex, h, onHeight]);
  if (!tex) return null;
  return (
    <group>
      <mesh ref={face} position={[0, h / 2 - 0.35, 0.4]} renderOrder={10}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} transparent depthTest={false} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
