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
 * STUB — Lords of Waterdeep: Scoundrels of Skullport corruption penalty.
 *
 * TODO(verify): the real rule scales the per-token penalty by the state of
 * the corruption track at game end; this placeholder charges a flat
 * -1 point per corruption token, which is NOT the rulebook formula.
 * Verify against the Scoundrels of Skullport rulebook before trusting
 * totals that include corruption. The field that uses this calculator is
 * marked `unverified` so the UI shows a warning.
 */
registerCalculator('skullport-corruption', (inputs) => {
  const tokens = inputs.tokens ?? 0;
  return -1 * tokens;
});
