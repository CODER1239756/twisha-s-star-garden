import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { useGarden } from "../store";
import { LAYOUT } from "../placement";
import { ASSETS, Model, SafeAsset } from "./AssetLoader";
import { lanternLevels } from "./lanternState";
import { glowTexture } from "./textures";

function Swaying({ children, amount = 0.02, speed = 0.8, phase = 0 }: {
  children: React.ReactNode; amount?: number; speed?: number; phase?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * speed + phase;
    ref.current.rotation.z = Math.sin(t) * amount + Math.sin(t * 2.3) * amount * 0.3;
    ref.current.rotation.x = Math.cos(t * 0.8) * amount * 0.5;
  });
  return <group ref={ref}>{children}</group>;
}

export function Trees() {
  return (
    <>
      {LAYOUT.trees.map((t, i) => (
        <SafeAsset key={i} name="tree_small_02">
          <group position={[t.x, 0, t.z]} rotation-y={t.rot}>
            <Swaying amount={0.012} speed={0.5} phase={i * 2}>
              <Model url={ASSETS.tree} height={t.h} />
            </Swaying>
          </group>
        </SafeAsset>
      ))}
    </>
  );
}

export function Shrubs() {
  return (
    <>
      {LAYOUT.shrubs.map((s, i) => (
        <SafeAsset key={i} name={s.kind}>
          <group position={[s.x, 0, s.z]} rotation-y={s.rot}>
            <Swaying amount={0.025} speed={0.9} phase={i}>
              <Model url={s.kind === "shrub_01" ? ASSETS.shrub_01 : ASSETS.shrub_03} height={s.h} />
            </Swaying>
          </group>
        </SafeAsset>
      ))}
      {LAYOUT.decorFlowers.map((f, i) => (
        <SafeAsset key={`f${i}`} name="flower_gazania">
          <group position={[f.x, 0, f.z]} rotation-y={i * 2}>
            <Swaying amount={0.04} speed={1.2} phase={i * 3}>
              <Model url={ASSETS.gazania} height={f.s} />
            </Swaying>
          </group>
        </SafeAsset>
      ))}
    </>
  );
}

export function Bench() {
  const [nudge, setNudge] = useState(0);
  return (
    <SafeAsset name="painted_wooden_bench">
      <group
        position={[LAYOUT.bench.x, 0, LAYOUT.bench.z]}
        rotation-y={LAYOUT.bench.rot}
        onClick={(e) => {
          e.stopPropagation();
          setNudge((n) => n + 1);
        }}
      >
        <Model url={ASSETS.bench} height={0.9} key={nudge} />
      </group>
    </SafeAsset>
  );
}

/** Lanterns glow with time of day; tap one to turn it on/off. */
export function Lanterns({ intensity }: { intensity: number }) {
  return (
    <>
      {LAYOUT.lanterns.map((l, i) => (
        <Lantern key={i} index={i} x={l.x} z={l.z} intensity={intensity} phase={i * 1.7} />
      ))}
    </>
  );
}

function Lantern({ index, x, z, intensity, phase }: { index: number; x: number; z: number; intensity: number; phase: number }) {
  const [on, setOn] = useState(true);
  const light = useRef<THREE.PointLight>(null);
  const sprite = useRef<THREE.Sprite>(null);
  const reduced = useGarden((s) => s.settings.reducedMotion);
  useFrame(({ clock }) => {
    const flicker = reduced ? 1 : 0.92 + Math.sin(clock.elapsedTime * 7 + phase) * 0.04 + Math.sin(clock.elapsedTime * 13 + phase) * 0.03;
    const target = on ? Math.max(intensity, 0.25) * flicker : 0;
    if (light.current) light.current.intensity += (target * 2.2 - light.current.intensity) * 0.1;
    // shared with the grass shader so its warm pool follows this lantern (and goes dark when tapped off)
    lanternLevels[index] = light.current ? light.current.intensity / 2.2 : 0;
    if (sprite.current) {
      const m = sprite.current.material as THREE.SpriteMaterial;
      m.opacity += ((on ? Math.min(1, 0.25 + intensity * 0.4) * flicker : 0) - m.opacity) * 0.1;
    }
  });
  return (
    <group
      position={[x, 0, z]}
      onClick={(e) => {
        e.stopPropagation();
        setOn((v) => !v);
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      <SafeAsset name="wooden_lantern_01">
        <Model url={ASSETS.lantern} height={0.55} />
      </SafeAsset>
      <pointLight ref={light} position={[0, 0.3, 0]} color="#ffc98a" distance={4.5} decay={1.6} />
      <sprite ref={sprite} position={[0, 0.3, 0]} scale={[0.7, 0.7, 0.7]}>
        <spriteMaterial map={glowTexture()} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0} color="#ffcf95" />
      </sprite>
    </group>
  );
}

/** Distant trees and hedging that dissolve into the fog, giving the garden depth. */
const FAR_TREES = [
  { x: -10, z: -11, h: 7, r: 0.4 }, { x: -3.5, z: -14, h: 8, r: 1.9 }, { x: 4.5, z: -13, h: 7.5, r: 3.1 },
  { x: 10.5, z: -9.5, h: 6.5, r: 5.2 }, { x: -12, z: -4, h: 6, r: 2.4 }, { x: 12.5, z: -2.5, h: 6.8, r: 0.9 },
  { x: 8, z: -16, h: 9, r: 4.4 }, { x: -8, z: -17, h: 8.5, r: 1.1 },
];
const MID_SHRUBS = [
  { x: -6.8, z: -6.5, h: 1.6 }, { x: 6.9, z: -6.2, h: 1.5 }, { x: -1.8, z: -7.5, h: 1.3 },
  { x: 7.5, z: -1.5, h: 1.2 }, { x: -7.4, z: -1.2, h: 1.4 }, { x: 3.2, z: -8.2, h: 1.7 },
];
export function BackdropVegetation({ count }: { count: number }) {
  return (
    <>
      {FAR_TREES.slice(0, count).map((t, i) => (
        <SafeAsset key={i} name="tree_small_02 (backdrop)">
          <group position={[t.x, 0, t.z]} rotation-y={t.r}>
            <Swaying amount={0.008} speed={0.35} phase={i * 1.3}>
              <Model url={ASSETS.tree} height={t.h} />
            </Swaying>
          </group>
        </SafeAsset>
      ))}
      {MID_SHRUBS.slice(0, Math.ceil(count * 0.75)).map((s, i) => (
        <SafeAsset key={`m${i}`} name="shrub_01 (midground)">
          <group position={[s.x, 0, s.z]} rotation-y={i * 1.7}>
            <Swaying amount={0.02} speed={0.7} phase={i}>
              <Model url={i % 2 ? ASSETS.shrub_03 : ASSETS.shrub_01} height={s.h} />
            </Swaying>
          </group>
        </SafeAsset>
      ))}
    </>
  );
}
