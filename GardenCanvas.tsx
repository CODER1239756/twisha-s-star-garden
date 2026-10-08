import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import * as THREE from "three";
import { QUALITY, TIME_PRESETS } from "./config";
import { useGarden } from "./store";
import { Fireflies, Motes, Rain } from "./scene/Atmosphere";
import { EnvironmentController } from "./scene/EnvironmentController";
import { GardenGround, Grass } from "./scene/GardenEnvironment";
import { GlowLight } from "./scene/GlowLight";
import { Flights, Plants } from "./scene/Plants";
import { BackdropVegetation, Bench, Lanterns, Shrubs, Trees } from "./scene/Vegetation";
import { CameraRig } from "./scene/CameraRig";

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
      camera={{ position: [0.4, 6.5, 14], fov: 42 }}
      gl={{ antialias: quality !== "mobile", toneMapping: THREE.ACESFilmicToneMapping }}
      onPointerMissed={() => select(null)}
      className="!fixed inset-0 touch-none"
    >
      <EnvironmentController />
      <Suspense fallback={null}>
        <GardenGround />
        <Grass count={q.grass} light={p.grassLight} tint={p.grassTint} />
        <Trees />
        <BackdropVegetation count={quality === "mobile" ? 3 : quality === "balanced" ? 6 : 8} />
        <Shrubs />
        <Bench />
        <Lanterns intensity={p.lantern} />
        <Plants />
        <Flights />
        <GlowLight />
      </Suspense>
      <Fireflies count={q.fireflies} strength={p.fireflies} />
      <Motes count={reducedMotion ? 0 : q.motes} opacity={rain ? 0 : 0.5} />
      <Rain count={q.rain} active={rain} />
      <CameraRig />
    </Canvas>
  );
}
