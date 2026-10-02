import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { GROWTH_COLORS, growthAt, TOTAL_GROWTH } from "../config";
import { useGarden, type Flight } from "../store";
import type { Thought } from "../types";
import { ASSETS, Model, SafeAsset } from "./AssetLoader";
import { glowTexture } from "./textures";

const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const stemMat = new THREE.MeshStandardMaterial({ color: "#5f7d4a", roughness: 0.8 });
const leafMat = new THREE.MeshStandardMaterial({ color: "#7a9a5c", roughness: 0.7, side: THREE.DoubleSide });
const soilMat = new THREE.MeshStandardMaterial({ color: "#4a3a2c", roughness: 1 });
const seedMat = new THREE.MeshStandardMaterial({ color: "#c9a46a", emissive: GROWTH_COLORS.node, emissiveIntensity: 0.6 });

function leafGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(0.06, 0.06, 0, 0.16);
  s.quadraticCurveTo(-0.06, 0.06, 0, 0);
  return new THREE.ShapeGeometry(s, 8);
}
const LEAF = leafGeometry();

/** One planted thought, growing seed → sprout → stem → leaves → bloom in real time. */
function PlantedThought({ t }: { t: Thought }) {
  const reduced = useGarden((s) => s.settings.reducedMotion);
  const select = useGarden((s) => s.select);
  const complete = useGarden((s) => s.completePlant);
  const mound = useRef<THREE.Mesh>(null);
  const seed = useRef<THREE.Mesh>(null);
  const stem = useRef<THREE.Group>(null);
  const leaves = useRef<THREE.Group>(null);
  const bloom = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Sprite>(null);
  const done = useRef(t.completed);

  useFrame(({ clock }) => {
    const sec = t.completed ? TOTAL_GROWTH : (Date.now() - (t.plantedAt ?? Date.now())) / 1000;
    const g = growthAt(sec);
    const i = g.index;
    const L = reduced ? (g.local > 0.5 ? 1 : g.local * 2) : g.local;
    const p = (k: number) => (i > k ? 1 : i === k ? ease(L) : 0);
    if (mound.current) mound.current.scale.setScalar((0.4 + p(0) * 0.6) * (1 - p(4) * 0.6));
    if (seed.current) {
      seed.current.visible = i < 2;
      seed.current.position.y = 0.04 - p(0) * 0.03;
      (seed.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3 + Math.sin(clock.elapsedTime * 3) * 0.2;
    }
    const stemH = 0.05 + p(1) * 0.08 + p(2) * 0.25;
    if (stem.current) {
      // the sapling hands over to the real flower as it blooms
      const fade = 1 - p(4);
      stem.current.visible = i >= 1 && fade > 0.02;
      stem.current.scale.set(fade, stemH * Math.max(0.001, fade), fade);
    }
    if (leaves.current) {
      leaves.current.visible = i >= 1;
      leaves.current.children.forEach((c, k) => {
        const s = k < 2 ? p(1) * 0.8 + p(3) * 0.4 : p(3);
        c.scale.setScalar(Math.max(0.001, s));
        c.position.y = k < 2 ? stemH * 0.9 : stemH * (0.35 + k * 0.1);
      });
      leaves.current.visible = i >= 1 && p(4) < 0.9;
    }
    if (bloom.current) {
      const b = p(4);
      bloom.current.visible = b > 0;
      bloom.current.scale.setScalar(Math.max(0.001, b) * t.scale);
    }
    if (halo.current) {
      const m = halo.current.material as THREE.SpriteMaterial;
      const pulse = i === 4 && !t.completed ? Math.sin(L * Math.PI) : 0;
      m.opacity = 0.15 + pulse * 0.6 + (i === 0 ? 0.35 : 0);
      halo.current.position.y = i === 0 ? 0.08 : stemH + 0.1;
    }
    if (g.progress >= 1 && !done.current) {
      done.current = true;
      complete(t.id);
    }
  });

  return (
    <group
      position={t.plantPosition}
      rotation-y={t.rotation}
      onClick={(e) => {
        e.stopPropagation();
        if (t.completed) select(t.id);
      }}
      onPointerOver={() => t.completed && (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      <mesh ref={mound} material={soilMat} position-y={0.005} scale={[1, 0.3, 1]} receiveShadow>
        <sphereGeometry args={[0.08, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh ref={seed} material={seedMat}>
        <sphereGeometry args={[0.025, 10, 8]} />
      </mesh>
      <group ref={stem}>
        <mesh material={stemMat} position-y={0.5} castShadow>
          <cylinderGeometry args={[0.008, 0.012, 1, 6]} />
        </mesh>
      </group>
      <group ref={leaves}>
        {[0, 1, 2, 3].map((k) => (
          <mesh
            key={k}
            geometry={LEAF}
            material={leafMat}
            rotation={[0.9, (k * Math.PI) / 2 + (k > 1 ? 0.8 : 0), k % 2 ? -0.6 : 0.6]}
            castShadow
          />
        ))}
      </group>
      <group ref={bloom} visible={false}>
        <SafeAsset name="flower_gazania">
          <Model url={ASSETS.gazania} height={0.6} />
        </SafeAsset>
      </group>
      <sprite ref={halo} scale={[0.45, 0.45, 0.45]}>
        <spriteMaterial map={glowTexture()} transparent depthWrite={false} blending={THREE.AdditiveBlending} color={GROWTH_COLORS.nodeHalo} opacity={0} />
      </sprite>
    </group>
  );
}


export function Plants() {
  const thoughts = useGarden((s) => s.thoughts);
  return (
    <>
      {thoughts
        .filter((t) => t.plantedAt !== null)
        .map((t) => (
          <PlantedThought key={t.id} t={t} />
        ))}
    </>
  );
}


/** Glowing node that leaves the glass input and arcs into the soil. */
function FlyingNode({ f }: { f: Flight }) {
  const land = useGarden((s) => s.landFlight);
  const thought = useGarden((s) => s.thoughts.find((t) => t.id === f.thoughtId));
  const reduced = useGarden((s) => s.settings.reducedMotion);
  const { camera } = useThree();
  const g = useRef<THREE.Group>(null);
  const landed = useRef(false);
  const curve = useMemo(() => {
    const start = new THREE.Vector3(f.ndc[0], f.ndc[1], 0.5).unproject(camera);
    const dir = start.clone().sub(camera.position).normalize();
    start.copy(camera.position).add(dir.multiplyScalar(2.5));
    const end = new THREE.Vector3(...(thought?.plantPosition ?? [0, 0, 0]));
    const mid = start.clone().lerp(end, 0.5);
    mid.y += 1.6;
    return new THREE.QuadraticBezierCurve3(start, mid, end.clone().setY(0.03));
  }, [camera, f.ndc, thought?.plantPosition]);
  const DUR = reduced ? 0.8 : 2.4;

  useFrame(({ clock }) => {
    const t = Math.min(1, (performance.now() - f.startedAt) / 1000 / DUR);
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    if (g.current) {
      g.current.position.copy(curve.getPoint(e));
      const s = 1 - Math.max(0, (t - 0.85) / 0.15) * 0.7;
      g.current.scale.setScalar(s * (1 + Math.sin(clock.elapsedTime * 10) * 0.06));
    }
    if (t >= 1 && !landed.current) {
      landed.current = true;
      land(f.thoughtId);
    }
  });

  return (
    <group ref={g}>
      <mesh>
        <sphereGeometry args={[0.05, 16, 12]} />
        <meshBasicMaterial color={GROWTH_COLORS.node} toneMapped={false} />
      </mesh>
      <sprite scale={[0.7, 0.7, 0.7]}>
        <spriteMaterial map={glowTexture()} transparent depthWrite={false} blending={THREE.AdditiveBlending} color={GROWTH_COLORS.nodeHalo} />
      </sprite>
      <pointLight color={GROWTH_COLORS.node} intensity={1.5} distance={3} decay={1.5} />
    </group>
  );
}

export function Flights() {
  const flights = useGarden((s) => s.flights);
  return (
    <>
      {flights.map((f) => (
        <FlyingNode key={f.thoughtId} f={f} />
      ))}
    </>
  );
}
