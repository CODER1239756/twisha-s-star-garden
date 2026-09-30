// PersistenceService — swap this implementation for a database later
// without touching the garden systems.
import type { PersistedGarden } from "./types";

export interface PersistenceService {
  load(): PersistedGarden | null;
  save(data: PersistedGarden): void;
}

const KEY = "twishas-garden:star1:v1";

class LocalStoragePersistence implements PersistenceService {
  private available = true;
  load() {
    try {
      const raw = window.localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as PersistedGarden) : null;
    } catch (e) {
      console.warn("[garden] persistence unavailable, using memory", e);
      this.available = false;
      return null;
    }
  }
  save(data: PersistedGarden) {
    if (!this.available) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("[garden] could not save, continuing in memory", e);
      this.available = false;
    }
  }
}

export const persistence: PersistenceService = new LocalStoragePersistence();
