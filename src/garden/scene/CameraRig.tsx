import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitImpl } from "three-stdlib";
import { useGarden } from "../store";
import { LAYOUT } from "../placement";

const HOME = new THREE.Vector3(LAYOUT.bed.x * 0.5, 0.4, -0.6);
const goal = new THREE.Vector3();

/** Restrained orbit; gently re-centres on a flower when it is selected. */
export function CameraRig() {
  const controls = useRef<OrbitImpl>(null);
  const reduced = useGarden((s) => s.settings.reducedMotion);
  const selected = useGarden((s) => s.thoughts.find((t) => t.id === s.selectedId));
  const flying = useGarden((s) => s.flights.length > 0);

  useFrame((state, raw) => {
    const c = controls.current;
    if (!c) return;
    const k = 1 - Math.exp(-(reduced ? 8 : 2.5) * Math.min(raw, 0.05));
    if (selected) {
      goal.set(selected.plantPosition[0], 0.25, selected.plantPosition[2]);
      c.target.lerp(goal, k);
      const dist = state.camera.position.distanceTo(c.target);
      if (dist > 5.2) {
        const dir = state.camera.position.clone().sub(c.target).normalize();
        state.camera.position.lerp(c.target.clone().add(dir.multiplyScalar(5)), k);
      }
    } else {
      c.target.lerp(HOME, k * 0.5);
    }
  });

  return (
    <OrbitControls
      ref={controls as never}
      makeDefault
      target={HOME.toArray()}
      enablePan={false}
      enableDamping
      dampingFactor={0.06}
      minDistance={3.5}
      maxDistance={12}
      minPolarAngle={0.6}
      maxPolarAngle={1.38}
      minAzimuthAngle={-0.9}
      maxAzimuthAngle={0.9}
      rotateSpeed={0.5}
      autoRotate={!reduced && !selected && !flying}
      autoRotateSpeed={0.15}
    />
  );
}
