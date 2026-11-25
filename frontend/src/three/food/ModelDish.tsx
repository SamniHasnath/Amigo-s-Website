// A real 3D model of the dish (.glb), e.g. scanned with a phone app such as Polycam.
// It is scaled to fit the plate and sits on it, so dragging really turns the food.
import { Component, useMemo, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export function ModelDish({ url }: { url: string }) {
  // second arg false: don't try to fetch a Draco decoder from the internet
  const { scene } = useGLTF(url, false);
  const model = useMemo(() => {
    const m = scene.clone(true);
    const box = new THREE.Box3().setFromObject(m);
    const size = box.getSize(new THREE.Vector3());
    const k = Math.min(2.3 / Math.max(size.x, size.z, 0.001), 1.8 / Math.max(size.y, 0.001));
    m.scale.setScalar(k);
    const b2 = new THREE.Box3().setFromObject(m);
    const c = b2.getCenter(new THREE.Vector3());
    m.position.set(-c.x, -b2.min.y + 0.01, -c.z);
    m.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return m;
  }, [scene]);
  return <primitive object={model} />;
}

/** Height of a loaded model, for the card's pointer line. */
export const MODEL_TOP = 1.6;

/** If a model fails to load, show the fallback (photo or illustration) instead of breaking the page. */
export class ModelBoundary extends Component<{ fallback: ReactNode; children: ReactNode; resetKey: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidUpdate(prev: { resetKey: string }) { if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false }); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
