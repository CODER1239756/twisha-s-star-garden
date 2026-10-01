import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import * as THREE from "three";
import { QUALITY, TIME_PRESETS } from "./config";
import { useGarden } from "./store";
import { Fireflies, Motes, Rain } from "./scene/Atmosphere";
import { EnvironmentController } from "./scene/EnvironmentController";
import { GardenGround, Grass } from "./scene/GardenEnvironment";
import { Flights, Plants } from "./scene/Plants";
import { Bench, Lanterns, Shrubs, Trees } from "./scene/Vegetation";
import { LAYOUT } from "./placement";

export function GardenCanvas() {
  const { quality, timeOfDay, weather, reducedMotion } = useGarden((s) => s.settings);
  const select = useGarden((s) => s.select);
  const q = QUALITY[quality];
  const p = TIME_PRESETS[timeOfDay];
  const rain = weather === "rain";
  return (
    <Canvas
      shadows
      dpr={q.dpr}
      camera={{ position: [0.4, 3.4, 8.6], fov: 42 }}
      gl={{ antialias: quality !== "mobile", toneMapping: THREE.ACESFilmicToneMapping }}
      onPointerMissed={() => select(null)}
      className="!fixed inset-0"
    >
      <EnvironmentController />
      <Suspense fallback={null}>
        <GardenGround />
        <Grass count={q.grass} light={p.grassLight} />
        <Trees />
        <Shrubs />
        <Bench />
        <Lanterns intensity={p.lantern} />
        <Plants />
        <Flights />
      </Suspense>
      <Fireflies count={q.fireflies} strength={p.fireflies} />
      <Motes count={reducedMotion ? 0 : q.motes} opacity={rain ? 0 : 0.5} />
      <Rain count={q.rain} active={rain} />
      <OrbitControls
        target={[LAYOUT.bed.x * 0.5, 0.4, -0.6]}
        enablePan={false}
        enableDamping
        minDistance={4}
        maxDistance={12}
        minPolarAngle={0.6}
        maxPolarAngle={1.38}
        minAzimuthAngle={-0.9}
        maxAzimuthAngle={0.9}
        autoRotate={!reducedMotion}
        autoRotateSpeed={0.15}
      />
    </Canvas>
  );
}
