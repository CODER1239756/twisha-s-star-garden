import { LAYOUT } from "../placement";

/**
 * Current brightness of each lantern (0 = off). Lanterns write this from their own
 * useFrame; the unlit grass shader reads it so its warm pool of light follows the
 * real lantern — including when a visitor taps one off. A plain mutable array:
 * no React state, no re-renders.
 */
export const lanternLevels: number[] = LAYOUT.lanterns.map(() => 0);
