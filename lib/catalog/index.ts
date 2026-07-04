import type { GameDefinition } from '../engine/types';
import { sevenWonders } from './seven-wonders';

/** Definitions bundled with the build. Users add games from here into their collection. */
export const CATALOG: readonly GameDefinition[] = [sevenWonders];

export function getDefinition(gameId: string): GameDefinition {
  const def = CATALOG.find((g) => g.id === gameId);
  if (!def) throw new Error(`Unknown game "${gameId}"`);
  return def;
}
