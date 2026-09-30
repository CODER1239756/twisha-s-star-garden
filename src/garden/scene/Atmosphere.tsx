import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { glowTexture } from "./textures";

/** Sparse fireflies drifting low over the garden. */
export function Fireflies({ count, strength }: { count: number; strength: number }) {
  const ref = useRef<THREE.Points>(null);
  const mat = useRef<THREE.PointsMaterial>(null);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 12,
        y: 0.3 + Math.random() * 1.4,
        z: (Math.random() - 0.5) * 9 - 1,
        p: Math.random() * 100,
        s: 0.2 + Math.random() * 0.4,
      })),
    [count],
  );
  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    seeds.forEach((s, i) => {
      positions[i * 3] = s.x + Math.sin(t * s.s + s.p) * 0.8;
      positions[i * 3 + 1] = s.y + Math.sin(t * s.s * 1.7 + s.p) * 0.25;
      positions[i * 3 + 2] = s.z + Math.cos(t * s.s * 0.9 + s.p) * 0.8;
    });
    if (ref.current) ref.current.geometry.attributes["position"]!.needsUpdate = true;
    if (mat.current) {
      const blink = 0.6 + Math.sin(t * 2.1) * 0.4;
      mat.current.opacity += (strength * blink - mat.current.opacity) * 0.05;
    }
  });
  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={mat}
        map={glowTexture()}
        size={0.16}
        color="#ffe29a"
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

/** Tiny pollen / dust motes catching the light. */
export function Motes({ count, opacity }: { count: number; opacity: number }) {
  const ref = useRef<THREE.Points>(null);
  const base = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      a[i * 3] = (Math.random() - 0.5) * 14;
      a[i * 3 + 1] = Math.random() * 3;
      a[i * 3 + 2] = (Math.random() - 0.5) * 12 - 1;
    }
    return a;
  }, [count]);
  const pos = useMemo(() => base.slice(), [base]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      pos[i * 3] = base[i * 3]! + Math.sin(t * 0.2 + i) * 0.4 + ((t * 0.05) % 1);
      pos[i * 3 + 1] = base[i * 3 + 1]! + Math.sin(t * 0.3 + i * 1.3) * 0.2;
    }
    if (ref.current) ref.current.geometry.attributes["position"]!.needsUpdate = true;
  });
  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.025} color="#fbf3dc" transparent opacity={opacity} depthWrite={false} />
    </points>
  );
}

/** Peaceful rain — thin streaks, no storm. */
export function Rain({ count, active }: { count: number; active: boolean }) {
  const ref = useRef<THREE.LineSegments>(null);
  const mat = useRef<THREE.LineBasicMaterial>(null);
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 6);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 18;
      const y = Math.random() * 9;
      const z = (Math.random() - 0.5) * 16;
      positions.set([x, y, z, x + 0.02, y - 0.22, z], i * 6);
      speeds[i] = 6 + Math.random() * 3;
    }
    return { positions, speeds };
  }, [count]);
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    if (mat.current) mat.current.opacity += ((active ? 0.35 : 0) - mat.current.opacity) * 0.04;
    if (!ref.current || (mat.current && mat.current.opacity < 0.01)) return;
    for (let i = 0; i < count; i++) {
      let y = positions[i * 6 + 1]! - speeds[i] * dt;
      if (y < 0) y += 9;
      positions[i * 6 + 1] = y;
      positions[i * 6 + 4] = y - 0.22;
    }
    ref.current.geometry.attributes["position"]!.needsUpdate = true;
  });
  return (
    <lineSegments ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial ref={mat} color="#dfe6e8" transparent opacity={0} depthWrite={false} />
    </lineSegments>
  );
}
