// Star 1 configuration — values mirror the supplied growth-stages.json,
// garden.config.json and design.json from the Twisha's Garden package.

export const GROWTH_STAGES = [
  { id: "seed", duration: 2 },
  { id: "sprout", duration: 3 },
  { id: "stem", duration: 4 },
  { id: "leaves", duration: 4 },
  { id: "bloom", duration: 5 },
] as const;

export type GrowthStageId = (typeof GROWTH_STAGES)[number]["id"];
export const TOTAL_GROWTH = GROWTH_STAGES.reduce((a, s) => a + s.duration, 0);

export function growthAt(seconds: number) {
  let acc = 0;
  for (let i = 0; i < GROWTH_STAGES.length; i++) {
    const s = GROWTH_STAGES[i]!;
    if (seconds < acc + s.duration) {
      return {
        stage: s.id as GrowthStageId,
        index: i,
        local: Math.max(0, (seconds - acc) / s.duration),
        progress: Math.max(0, seconds / TOTAL_GROWTH),
      };
    }
    acc += s.duration;
  }
  return { stage: "bloom" as GrowthStageId, index: 4, local: 1, progress: 1 };
}

export type QualityLevel = "mobile" | "balanced" | "high";
export const QUALITY: Record<
  QualityLevel,
  { dpr: [number, number]; shadowMap: number; grass: number; fireflies: number; rain: number; motes: number }
> = {
  mobile: { dpr: [1, 1.25], shadowMap: 512, grass: 2200, fireflies: 10, rain: 450, motes: 40 },
  balanced: { dpr: [1, 1.5], shadowMap: 1024, grass: 5000, fireflies: 16, rain: 900, motes: 80 },
  high: { dpr: [1, 2], shadowMap: 2048, grass: 9000, fireflies: 22, rain: 1500, motes: 120 },
};

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";
export type Weather = "clear" | "rain";

export interface TimePreset {
  sky: string;
  fog: string;
  fogNear: number;
  fogFar: number;
  sun: string;
  sunIntensity: number;
  sunPosition: [number, number, number];
  ambient: number;
  hemiSky: string;
  hemiGround: string;
  env: number;
  lantern: number;
  fireflies: number;
  grassLight: number;
  /** Multiplies the (unlit) grass shader colour — cools it at night. */
  grassTint: string;
  /** Renderer tone-mapping exposure. */
  exposure: number;
}

export const TIME_PRESETS: Record<TimeOfDay, TimePreset> = {
  morning: {
    sky: "#e4e6d8", fog: "#e2e4d4", fogNear: 9, fogFar: 34,
    sun: "#fff0d8", sunIntensity: 2.2, sunPosition: [9, 11, 7],
    ambient: 0.35, hemiSky: "#f3ede5", hemiGround: "#52634a",
    env: 0.7, lantern: 0.0, fireflies: 0.15, grassLight: 1.0,
    grassTint: "#ffffff", exposure: 1,
  },
  afternoon: {
    sky: "#dfe6dc", fog: "#dde3d6", fogNear: 12, fogFar: 42,
    sun: "#fffaf0", sunIntensity: 2.8, sunPosition: [4, 16, 5],
    ambient: 0.4, hemiSky: "#faf8f3", hemiGround: "#52634a",
    env: 0.8, lantern: 0.0, fireflies: 0.0, grassLight: 1.1,
    grassTint: "#ffffff", exposure: 1,
  },
  evening: {
    sky: "#e9c9ae", fog: "#e2bea3", fogNear: 7, fogFar: 30,
    sun: "#ffbf85", sunIntensity: 1.9, sunPosition: [-11, 4.5, 3],
    ambient: 0.3, hemiSky: "#ecc9b4", hemiGround: "#4a4a3a",
    env: 0.5, lantern: 1.1, fireflies: 0.6, grassLight: 0.85,
    grassTint: "#ffffff", exposure: 1,
  },
  // Cinematic night: cool moon + deep blue-teal fog, warm lanterns doing the
  // storytelling. The daytime HDRI is NOT used at night (see NIGHT_ENVIRONMENT).
  night: {
    sky: "#0a111c", fog: "#0a111c", fogNear: 6, fogFar: 36,
    sun: "#9db8e0", sunIntensity: 0.9, sunPosition: [-6, 10, -3],
    ambient: 0.1, hemiSky: "#2c4466", hemiGround: "#0d1410",
    env: 1.0, lantern: 2.4, fireflies: 0.8, grassLight: 0.62,
    grassTint: "#86a0c6", exposure: 1.15,
  },
};

/**
 * Procedural night image-based lighting (replaces the daytime HDRI at night).
 * Each entry is a drei <Lightformer>; the cubemap is rendered once and is tiny,
 * so it costs one PMREM pass and nothing per frame.
 */
export interface NightLightformer {
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
  intensity: number;
}
export const NIGHT_ENVIRONMENT: { resolution: number; formers: NightLightformer[] } = {
  resolution: 64,
  formers: [
    // moon: a small cool softbox, same side as the directional moon light
    { position: [-6, 10, -3], scale: [4, 4, 1], color: "#b9cdea", intensity: 1.6 },
    // faint overhead sky wash so upward-facing leaves are not pitch black
    { position: [0, 14, 0], scale: [30, 30, 1], color: "#243a5c", intensity: 0.45 },
    // dim teal horizon band behind the garden (gives silhouettes something to read against)
    { position: [0, 2, -16], scale: [40, 4, 1], color: "#1c3a3a", intensity: 0.5 },
    // very dark green ground bounce
    { position: [0, -6, 0], scale: [30, 30, 1], color: "#101a12", intensity: 0.25 },
  ],
};

/**
 * Light budget. The scene keeps a CONSTANT number of lights (moon, hemisphere,
 * ambient, 2 lanterns, 1 shared glow) so Three.js never recompiles shaders when
 * thoughts are planted. All thought "glow" is routed through the one shared light.
 */
export const GLOW_LIGHT = {
  distance: 3,
  decay: 1.6,
  /** easing toward the requested intensity (per frame, frame-rate independent below) */
  response: 12,
};

/** Warm light the grass shader receives from each lantern (grass is unlit, so it is faked). */
export const LANTERN_GRASS = {
  color: "#ffb870",
  height: 0.35,
  radius: 3.5,
  // lantern level is ~2.2 at night, so 0.3 peaks around 0.65 in linear light before tone mapping
  strength: 0.3,
};

export const GROWTH_COLORS = {
  node: "#ffe6b3",
  nodeHalo: "#f7d69a",
};

/** iPad/iPhone/Android tablets & phones. iPadOS reports itself as a Mac, so check touch points. */
export function isTouchDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod|Android/.test(ua) || iPadOS;
}

export function defaultQuality(): QualityLevel {
  if (typeof window === "undefined") return "balanced";
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  if (window.innerWidth < 768 || mem < 4 || isTouchDevice()) return "mobile";
  return "balanced";
}
