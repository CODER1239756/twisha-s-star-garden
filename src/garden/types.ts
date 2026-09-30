import type { GrowthStageId, QualityLevel, TimeOfDay, Weather } from "./config";

export type Vec3 = [number, number, number];

export interface Thought {
  id: string;
  text: string;
  createdAt: number;
  plantType: "gazania";
  plantPosition: Vec3;
  rotation: number;
  scale: number;
  /** When the node reached the soil; null while still in flight. */
  plantedAt: number | null;
  growthStage: GrowthStageId;
  growthProgress: number;
  completed: boolean;
  // Extendable for future features
  tags?: string[];
  mood?: string;
}

export interface GardenSettings {
  timeOfDay: TimeOfDay;
  weather: Weather;
  audio: boolean;
  quality: QualityLevel;
  reducedMotion: boolean;
}

export interface PersistedGarden {
  version: 1;
  thoughts: Thought[];
  settings: Partial<GardenSettings>;
}
