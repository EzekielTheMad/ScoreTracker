/**
 * Registry of named calculator functions for math too ugly to express as
 * definition data. Definitions reference calculators by name.
 *
 * Calculators are pure and their math is stable for a given name: if a
 * formula ever needs to change, register it under a new name and bump the
 * definition that uses it, so historical results recompute identically.
 */

export type Calculator = (
  inputs: Record<string, number>,
  params?: Record<string, number>,
) => number;

const registry = new Map<string, Calculator>();

export function registerCalculator(name: string, fn: Calculator): void {
  if (registry.has(name)) {
    throw new Error(`Calculator "${name}" is already registered`);
  }
  registry.set(name, fn);
}

export function getCalculator(name: string): Calculator {
  const fn = registry.get(name);
  if (!fn) throw new Error(`Unknown calculator "${name}"`);
  return fn;
}

/**
 * 7 Wonders science: with a, b, c the counts of the three symbols,
 * score = a² + b² + c² + 7 × min(a, b, c).
 */
registerCalculator('seven-wonders-science', (inputs) => {
  const counts = Object.values(inputs);
  const squares = counts.reduce((sum, n) => sum + n * n, 0);
  return squares + 7 * Math.min(...counts);
});

/**
 * LEGACY — the original Skullport corruption placeholder (-1 per token).
 * Kept registered so sessions recorded against skullport@1 snapshots
 * still recompute; new definitions use skullport-corruption-track.
 */
registerCalculator('skullport-corruption', (inputs) => {
  const tokens = inputs.tokens ?? 0;
  return -1 * tokens;
});

/**
 * Lords of Waterdeep: Scoundrels of Skullport corruption penalty.
 * Each corruption token scores minus the value of the highest empty
 * space on the corruption track; players read that value off the board
 * and enter it alongside their token count.
 */
registerCalculator('skullport-corruption-track', (inputs) => {
  const tokens = inputs.tokens ?? 0;
  const perToken = Math.abs(inputs.perToken ?? 0);
  return -1 * tokens * perToken;
});
