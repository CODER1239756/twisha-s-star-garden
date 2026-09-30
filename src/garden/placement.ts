import type { Vec3 } from "./types";

// Composition landmarks (x, z) shared by the scene and the placement system.
export const LAYOUT = {
  bed: { x: 1.3, z: -0.3, rx: 2.3, rz: 1.8 },
  bench: { x: -3.0, z: -1.3, rot: 0.9 },
  lanterns: [
    { x: -1.9, z: 1.7 },
    { x: 0.1, z: -2.9 },
  ],
  trees: [
    { x: -5.0, z: -5.2, h: 5.2, rot: 0.3 },
    { x: 4.6, z: -5.8, h: 4.6, rot: 2.1 },
    { x: 0.6, z: -9.0, h: 6.0, rot: 4.0 },
  ],
  shrubs: [
    { x: 3.9, z: -2.7, h: 1.2, kind: "shrub_01", rot: 0 },
    { x: -4.0, z: -3.3, h: 1.4, kind: "shrub_01", rot: 1.5 },
    { x: 4.6, z: 1.3, h: 0.9, kind: "shrub_03", rot: 2 },
    { x: -4.9, z: 0.9, h: 1.0, kind: "shrub_03", rot: 0.5 },
    { x: -2.3, z: -3.8, h: 0.7, kind: "shrub_03", rot: 3 },
    { x: 2.4, z: -4.2, h: 1.0, kind: "shrub_01", rot: 4 },
  ],
  decorFlowers: [
    { x: -1.4, z: 3.4, s: 0.32 },
    { x: -2.6, z: 0.6, s: 0.3 },
    { x: 3.6, z: 2.8, s: 0.3 },
  ],
};

export const pathX = (z: number) => -0.9 + Math.sin(z * 0.45) * 0.6;

function inBed(x: number, z: number) {
  const { bed } = LAYOUT;
  const dx = (x - bed.x) / bed.rx;
  const dz = (z - bed.z) / bed.rz;
  return dx * dx + dz * dz <= 0.82;
}

function candidates(): [number, number][] {
  const out: [number, number][] = [];
  const { bed } = LAYOUT;
  // Golden-angle spiral gives a curated, organic spread.
  for (let i = 0; i < 260; i++) {
    const r = Math.sqrt(i / 260);
    const a = i * 2.39996;
    const x = bed.x + Math.cos(a) * r * bed.rx;
    const z = bed.z + Math.sin(a) * r * bed.rz;
    if (inBed(x, z) && Math.abs(x - pathX(z)) > 0.75) out.push([x, z]);
  }
  return out;
}

export function choosePlantPosition(existing: Vec3[]): Vec3 {
  const pts = candidates();
  const { bed } = LAYOUT;
  for (const minDist of [0.62, 0.45, 0.3, 0]) {
    let best: [number, number] | null = null;
    let bestScore = -Infinity;
    for (const [x, z] of pts) {
      let nearest = Infinity;
      for (const p of existing) nearest = Math.min(nearest, Math.hypot(p[0] - x, p[2] - z));
      if (nearest < minDist) continue;
      const center = Math.hypot(x - bed.x, z - bed.z);
      // prefer front-of-bed (toward camera) and center, with a little randomness
      const score = Math.min(nearest, 1.4) - center * 0.25 + z * 0.08 + Math.random() * 0.25;
      if (score > bestScore) {
        bestScore = score;
        best = [x, z];
      }
    }
    if (best) return [best[0], 0, best[1]];
  }
  return [bed.x + (Math.random() - 0.5), 0, bed.z + (Math.random() - 0.5)];
}
