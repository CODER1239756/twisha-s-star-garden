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
}

export const TIME_PRESETS: Record<TimeOfDay, TimePreset> = {
  morning: {
    sky: "#e4e6d8", fog: "#e2e4d4", fogNear: 9, fogFar: 34,
    sun: "#fff0d8", sunIntensity: 2.2, sunPosition: [9, 11, 7],
    ambient: 0.35, hemiSky: "#f3ede5", hemiGround: "#52634a",
    env: 0.7, lantern: 0.0, fireflies: 0.15, grassLight: 1.0,
  },
  afternoon: {
    sky: "#dfe6dc", fog: "#dde3d6", fogNear: 12, fogFar: 42,
    sun: "#fffaf0", sunIntensity: 2.8, sunPosition: [4, 16, 5],
    ambient: 0.4, hemiSky: "#faf8f3", hemiGround: "#52634a",
    env: 0.8, lantern: 0.0, fireflies: 0.0, grassLight: 1.1,
  },
  evening: {
    sky: "#e9c9ae", fog: "#e2bea3", fogNear: 7, fogFar: 30,
    sun: "#ffbf85", sunIntensity: 1.9, sunPosition: [-11, 4.5, 3],
    ambient: 0.3, hemiSky: "#ecc9b4", hemiGround: "#4a4a3a",
    env: 0.5, lantern: 1.1, fireflies: 0.6, grassLight: 0.85,
  },
  night: {
    sky: "#1e2a27", fog: "#223029", fogNear: 5, fogFar: 26,
    sun: "#a9bfd4", sunIntensity: 0.45, sunPosition: [-6, 10, -4],
    ambient: 0.22, hemiSky: "#3a4c52", hemiGround: "#1a1f1a",
    env: 0.22, lantern: 2.4, fireflies: 1, grassLight: 0.45,
  },
};

export const GROWTH_COLORS = {
  node: "#ffe6b3",
  nodeHalo: "#f7d69a",
};

export function defaultQuality(): QualityLevel {
  if (typeof window === "undefined") return "balanced";
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  if (window.innerWidth < 768 || mem < 4) return "mobile";
  return "balanced";
}
