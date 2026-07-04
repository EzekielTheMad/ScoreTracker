import { getCalculator } from './calculators';
import type {
  FieldDef,
  PlayerEntry,
  ResolvedDefinition,
  ScoreBreakdown,
} from './types';

/** Points contributed by one field given a player's entry. Missing values are 0. */
export function scoreField(field: FieldDef, entry: PlayerEntry): number {
  if (field.kind === 'number') {
    const value = entry.values[field.id] ?? 0;
    if (!field.score) return value;
    return Math.floor(value / field.score.per) * field.score.points;
  }
  const raw = entry.calcInputs[field.id] ?? {};
  const inputs: Record<string, number> = {};
  for (const input of field.inputs) {
    inputs[input.id] = raw[input.id] ?? 0;
  }
  return getCalculator(field.calculator)(inputs, field.params);
}

export function tallyTotal(entry: PlayerEntry): number {
  return entry.tallyEvents.reduce((sum, e) => sum + e.amount, 0);
}

/** Full breakdown for one player: per-field points, tally sum, and total. */
export function computeScore(
  def: ResolvedDefinition,
  entry: PlayerEntry,
): ScoreBreakdown {
  const perField: Record<string, number> = {};
  for (const field of def.fields) {
    perField[field.id] = scoreField(field, entry);
  }
  const tally = tallyTotal(entry);
  const fieldSum = Object.values(perField).reduce((a, b) => a + b, 0);
  return { perField, tally, total: fieldSum + tally };
}

export function emptyEntry(playerId: string): PlayerEntry {
  return { playerId, values: {}, calcInputs: {}, tallyEvents: [] };
}
