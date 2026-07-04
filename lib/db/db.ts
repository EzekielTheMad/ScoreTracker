import Dexie, { type Table } from 'dexie';
import type { PlayerEntry, ResolvedDefinition } from '../engine/types';

/** A saved player profile — not a login, just a name that persists across nights. */
export interface Player {
  id: string;
  name: string;
  /** Accent color for chips and columns (hex). */
  color: string;
  createdAt: number;
}

/** A game the user added from the bundled catalog, with their expansion choices. */
export interface CollectionItem {
  id: string; // gameId — one collection entry per game
  gameId: string;
  /** Expansions toggled on by default when starting a session. */
  expansionIds: string[];
  addedAt: number;
}

/**
 * One play of a game, active or finished. Snapshots the resolved definition
 * at creation so history stays accurate when catalog definitions change.
 */
export interface Session {
  id: string;
  gameId: string;
  definition: ResolvedDefinition;
  playerIds: string[];
  /** Names snapshotted at start so history survives profile edits/deletion. */
  playerNames: Record<string, string>;
  playerColors: Record<string, string>;
  entries: Record<string, PlayerEntry>;
  status: 'active' | 'finished';
  startedAt: number;
  finishedAt?: number;
  /** Final totals, computed at finish. Always recomputable from the snapshot. */
  totals?: Record<string, number>;
}

class ScoreTrackerDB extends Dexie {
  players!: Table<Player, string>;
  collection!: Table<CollectionItem, string>;
  sessions!: Table<Session, string>;

  constructor() {
    super('score-tracker');
    this.version(1).stores({
      players: 'id, name, createdAt',
      collection: 'id, addedAt',
      sessions: 'id, gameId, status, startedAt, finishedAt',
    });
  }
}

export const db = new ScoreTrackerDB();
