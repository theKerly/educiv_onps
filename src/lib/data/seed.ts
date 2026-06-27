/** Tiny deterministic PRNG (mulberry32). Same seed → same data on every run. */
export function createRng(seed = 0xC0DE01) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = ReturnType<typeof createRng>;

export function pick<T>(rng: Rng, arr: readonly T[]): T { return arr[Math.floor(rng() * arr.length)]; }
export const intBetween = (rng: Rng, a: number, b: number) => Math.floor(a + rng() * (b - a + 1));
export const floatBetween = (rng: Rng, a: number, b: number) => a + rng() * (b - a);
export const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
/** Gaussian-ish via central limit (sum of 4 uniforms). */
export const gaussian = (rng: Rng, mean: number, std: number) => {
  const u = (rng() + rng() + rng() + rng()) / 4;
  return mean + (u - 0.5) * std * 4;
};