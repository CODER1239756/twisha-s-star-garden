import { create } from "zustand";
import { defaultQuality, TOTAL_GROWTH } from "./config";
import { persistence } from "./persistence";
import { choosePlantPosition } from "./placement";
import type { GardenSettings, Thought } from "./types";

export interface Flight {
  thoughtId: string;
  /** Normalized device coords of where the thought left the glass input. */
  ndc: [number, number];
  startedAt: number;
}

interface GardenState {
  hydrated: boolean;
  entered: boolean;
  introDone: boolean;
  thoughts: Thought[];
  flights: Flight[];
  selectedId: string | null;
  settings: GardenSettings;
  hydrate(): void;
  enter(): void;
  finishIntro(): void;
  plantThought(text: string, ndc: [number, number]): void;
  landFlight(id: string): void;
  completePlant(id: string): void;
  select(id: string | null): void;
  updateSettings(p: Partial<GardenSettings>): void;
}

const save = (s: GardenState) =>
  persistence.save({ version: 1, thoughts: s.thoughts, settings: s.settings });

export const useGarden = create<GardenState>((set, get) => ({
  hydrated: false,
  entered: false,
  introDone: false,
  thoughts: [],
  flights: [],
  selectedId: null,
  settings: {
    timeOfDay: "night",
    weather: "clear",
    audio: false,
    quality: "balanced",
    reducedMotion: false,
  },
  hydrate() {
    const data = persistence.load();
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const now = Date.now();
    const thoughts = (data?.thoughts ?? []).map((t) => {
      // A node interrupted mid-flight is planted where it was heading.
      const plantedAt = t.plantedAt ?? t.createdAt;
      const done = (now - plantedAt) / 1000 >= TOTAL_GROWTH;
      return { ...t, plantedAt, completed: done || t.completed };
    });

    // Saved time-of-day / quality are only honoured when the visitor picked them.
    // Older saves stored the defaults (morning / balanced) as if they were choices,
    // which would otherwise pin everyone to the old daytime look.
    const { timeOfDay: savedTime, quality: savedQuality, ...savedRest } = data?.settings ?? {};
    const chosen = savedRest.userSet ?? {};

    set({
      hydrated: true,
      thoughts,
      settings: {
        ...get().settings,
        quality: defaultQuality(),
        reducedMotion: !!reduced,
        ...savedRest,
        ...(chosen.timeOfDay && savedTime ? { timeOfDay: savedTime } : {}),
        ...(chosen.quality && savedQuality ? { quality: savedQuality } : {}),
        audio: false, // respect autoplay rules: always start muted
      },
    });
  },
  enter: () => set({ entered: true }),
  finishIntro: () => set({ introDone: true }),
  plantThought(text, ndc) {
    const s = get();
    const id = crypto.randomUUID();
    const t: Thought = {
      id,
      text: text.slice(0, 280),
      createdAt: Date.now(),
      plantType: "gazania",
      plantPosition: choosePlantPosition(s.thoughts.map((x) => x.plantPosition)),
      rotation: Math.random() * Math.PI * 2,
      scale: 0.85 + Math.random() * 0.3,
      plantedAt: null,
      growthStage: "seed",
      growthProgress: 0,
      completed: false,
    };
    set({
      thoughts: [...s.thoughts, t],
      flights: [...s.flights, { thoughtId: id, ndc, startedAt: performance.now() }],
      selectedId: null,
    });
    save(get());
  },
  landFlight(id) {
    set((s) => ({
      flights: s.flights.filter((f) => f.thoughtId !== id),
      thoughts: s.thoughts.map((t) => (t.id === id ? { ...t, plantedAt: Date.now() } : t)),
    }));
    save(get());
  },
  completePlant(id) {
    set((s) => ({
      thoughts: s.thoughts.map((t) =>
        t.id === id ? { ...t, completed: true, growthStage: "bloom", growthProgress: 1 } : t,
      ),
    }));
    save(get());
  },
  select: (id) => set({ selectedId: id }),
  updateSettings(p) {
    set((s) => {
      const userSet = { ...s.settings.userSet };
      if (p.timeOfDay !== undefined) userSet.timeOfDay = true;
      if (p.quality !== undefined) userSet.quality = true;
      return { settings: { ...s.settings, ...p, userSet } };
    });
    save(get());
  },
}));
