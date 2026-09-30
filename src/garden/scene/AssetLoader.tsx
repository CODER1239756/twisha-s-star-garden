import type { ThreeElements } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Component, Suspense, useMemo, type ReactNode } from "react";
import * as THREE from "three";

import bench from "@/assets/models/painted_wooden_bench.glb.asset.json";
import lantern from "@/assets/models/wooden_lantern_01.glb.asset.json";
import gazania from "@/assets/models/flower_gazania.glb.asset.json";
import shrub01 from "@/assets/models/shrub_01.glb.asset.json";
import shrub03 from "@/assets/models/shrub_03.glb.asset.json";
import tree from "@/assets/models/tree_small_02.glb.asset.json";
import hdri from "@/assets/models/garden_nook_1k.hdr.asset.json";

export const ASSETS = {
  bench: bench.url,
  lantern: lantern.url,
  gazania: gazania.url,
  shrub_01: shrub01.url,
  shrub_03: shrub03.url,
  tree: tree.url,
  hdri: hdri.url,
};

/** Keeps the scene alive when an asset fails; logs and renders the fallback. */
export class AssetBoundary extends Component<
  { name: string; fallback?: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch(e: unknown) {
    console.warn(`[garden] asset "${this.props.name}" failed to load`, e);
  }
  override render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}

export function SafeAsset({
  name,
  children,
  fallback,
}: {
  name: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <AssetBoundary name={name} fallback={fallback}>
      <Suspense fallback={null}>{children}</Suspense>
    </AssetBoundary>
  );
}

/** Clones a GLB and normalises it to a target height, sitting on y=0. */
export function useNormalizedModel(url: string, height: number) {
  const { scene } = useGLTF(url);
  return useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const s = height / Math.max(size.y, 0.0001);
    clone.scale.setScalar(s);
    box.setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    clone.position.set(-center.x, -box.min.y, -center.z);
    clone.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
        const mat = m.material as THREE.MeshStandardMaterial;
        if (mat && "envMapIntensity" in mat) mat.envMapIntensity = 1;
      }
    });
    const g = new THREE.Group();
    g.add(clone);
    return g;
  }, [scene, height]);
}

export function Model({
  url,
  height,
  ...props
}: { url: string; height: number } & ThreeElements["group"]) {
  const obj = useNormalizedModel(url, height);
  return (
    <group {...props}>
      <primitive object={obj} />
    </group>
  );
}

// Preload critical assets so the loader can gate the entrance.
Object.values(ASSETS)
  .filter((u) => u.endsWith(".glb"))
  .forEach((u) => useGLTF.preload(u));
