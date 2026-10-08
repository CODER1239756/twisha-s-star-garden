import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { GLOW_LIGHT, GROWTH_COLORS } from "../config";

/**
 * One shared point light for every thought event (flying node, landing flash,
 * bloom, selection). Before this, each planted thought and each flight mounted
 * its own PointLight — the light count grew with the garden and changed whenever
 * a thought launched or landed, which forces Three.js to recompile every lit
 * material (a visible hitch on iPad) and makes every pixel loop over N lights.
 *
 * Emitters call requestGlow() from their own useFrame (cheap, no React state);
 * this component applies the strongest request each frame.
 */
const request = { x: 0, y: 0, z: 0, intensity: 0, distance: GLOW_LIGHT.distance };

export function requestGlow(
  x: number,
  y: number,
  z: number,
  intensity: number,
  distance: number = GLOW_LIGHT.distance,
) {
  if (intensity <= request.intensity) return;
  request.x = x;
  request.y = y;
  request.z = z;
  request.intensity = intensity;
  request.distance = distance;
}

const target = new THREE.Vector3();

export function GlowLight() {
  const ref = useRef<THREE.PointLight>(null);
  useFrame((_, delta) => {
    const l = ref.current;
    if (!l) return;
    const k = 1 - Math.exp(-GLOW_LIGHT.response * Math.min(delta, 0.05));
    if (request.intensity > 0.001) {
      target.set(request.x, request.y, request.z);
      // when the light is (almost) off, jump to the new spot so it never slides across the garden
      if (l.intensity < 0.05) l.position.copy(target);
      else l.position.lerp(target, k);
      l.distance += (request.distance - l.distance) * k;
    }
    l.intensity += (request.intensity - l.intensity) * k;
    if (l.intensity < 0.002) l.intensity = 0;
    request.intensity = 0;
  });
  return (
    <pointLight
      ref={ref}
      color={GROWTH_COLORS.node}
      intensity={0}
      distance={GLOW_LIGHT.distance}
      decay={GLOW_LIGHT.decay}
    />
  );
}
