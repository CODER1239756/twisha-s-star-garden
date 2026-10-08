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
  /**
   * Which settings the visitor changed on purpose. Saved gardens written before
   * this field existed persisted the *default* time/quality, so those values
   * cannot be told apart from a real choice — only flagged ones are restored.
   */
  userSet?: { timeOfDay?: boolean; quality?: boolean };
}

export interface PersistedGarden {
  version: 1;
  thoughts: Thought[];
  settings: Partial<GardenSettings>;
}
