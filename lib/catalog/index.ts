import type { GameDefinition } from '../engine/types';
import { azul } from './azul';
import { carcassonne } from './carcassonne';
import { catan } from './catan';
import { dominion } from './dominion';
import { sevenWonders } from './seven-wonders';
import { splendor } from './splendor';
import { ticketToRide } from './ticket-to-ride';
import { waterdeep } from './waterdeep';
import { wingspan } from './wingspan';

/** Definitions bundled with the build. Users add games from here into their collection. */
export const CATALOG: readonly GameDefinition[] = [
  sevenWonders,
  carcassonne,
  waterdeep,
  azul,
  splendor,
  ticketToRide,
  wingspan,
  catan,
  dominion,
];

export function getDefinition(gameId: string): GameDefinition {
  const def = CATALOG.find((g) => g.id === gameId);
  if (!def) throw new Error(`Unknown game "${gameId}"`);
  return def;
}
