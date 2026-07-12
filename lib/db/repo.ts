import { CATALOG } from '../catalog';
import { resolveDefinition } from '../engine/resolve';
import { computeScore, emptyEntry } from '../engine/score';
import { validateDefinition } from '../engine/validate';
import { nextPlayerColor } from '../playerColors';
import type { GameDefinition, TallyEvent } from '../engine/types';
import { queueSync } from '../sync';
import { db, type CustomGame, type Player, type Session } from './db';

/**
 * All mutations go through here so every write bumps updatedAt (which
 * drives last-write-wins sync) and schedules a background sync push.
 * Deletes are tombstones (deletedAt) so other devices observe them.
 */

export function makeTallyEvent(amount: number, categoryId?: string): TallyEvent {
  return { id: crypto.randomUUID(), amount, categoryId, at: Date.now() };
}

export async function createPlayer(name: string): Promise<Player> {
  const now = Date.now();
  const player: Player = {
    id: crypto.randomUUID(),
    name,
    color: nextPlayerColor(await db.players.count()),
    createdAt: now,
    updatedAt: now,
  };
  await db.players.add(player);
  queueSync();
  return player;
}

export async function renamePlayer(id: string, name: string): Promise<void> {
  await db.players.update(id, { name, updatedAt: Date.now() });
  queueSync();
}

export async function deletePlayer(id: string): Promise<void> {
  const now = Date.now();
  await db.players.update(id, { deletedAt: now, updatedAt: now });
  queueSync();
}

export async function addGameToCollection(
  gameId: string,
  expansionIds: string[] = [],
): Promise<void> {
  const existing = await db.collection.get(gameId);
  const now = Date.now();
  await db.collection.put({
    id: gameId,
    gameId,
    expansionIds,
    addedAt: existing?.addedAt ?? now,
    updatedAt: now,
  });
  queueSync();
}

/** Resolve a game id against the bundled catalog, then custom games. */
export async function getAnyDefinition(gameId: string): Promise<GameDefinition | null> {
  const bundled = CATALOG.find((g) => g.id === gameId);
  if (bundled) return bundled;
  const custom = await db.customGames.get(gameId);
  return custom && !custom.deletedAt ? custom : null;
}

/** Fields the builder edits; everything else is derived or bookkeeping. */
export type CustomGameDraft = Pick<
  GameDefinition,
  'name' | 'minPlayers' | 'maxPlayers' | 'mode' | 'fields' | 'tally'
>;

const FIELD_COLORS = ['#38bdf8', '#a78bfa', '#f59e0b', '#4ade80', '#f472b6', '#fb923c'];

/**
 * Create or update a custom game. The builder leaves ids blank on new
 * rows; ids are assigned here (and kept on edit) so they stay stable.
 * Validation errors abort the save; edits bump `version` so session
 * snapshots record which revision they were scored with. New games
 * join the collection automatically.
 */
export async function saveCustomGame(
  draft: CustomGameDraft,
  existingId?: string,
): Promise<{ ok: true; game: CustomGame } | { ok: false; errors: string[] }> {
  const existing = existingId ? await db.customGames.get(existingId) : undefined;
  const now = Date.now();
  const game: CustomGame = {
    ...draft,
    fields: draft.fields.map((f, i) => ({
      ...f,
      id: f.id || crypto.randomUUID().slice(0, 8),
      color: f.color ?? FIELD_COLORS[i % FIELD_COLORS.length],
    })),
    tally: draft.tally && {
      ...draft.tally,
      categories: draft.tally.categories?.map((c, i) => ({
        ...c,
        id: c.id || crypto.randomUUID().slice(0, 8),
        color: c.color ?? FIELD_COLORS[i % FIELD_COLORS.length],
      })),
    },
    id: existing?.id ?? `custom-${crypto.randomUUID()}`,
    version: (existing?.version ?? 0) + 1,
    expansions: [],
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const errors = validateDefinition(game);
  if (errors.length > 0) return { ok: false, errors };
  await db.customGames.put(game);
  if (!existing) await addGameToCollection(game.id);
  queueSync();
  return { ok: true, game };
}

export async function deleteCustomGame(id: string): Promise<void> {
  const now = Date.now();
  await db.customGames.update(id, { deletedAt: now, updatedAt: now });
  await db.collection.update(id, { deletedAt: now, updatedAt: now });
  queueSync();
}

export async function saveSession(session: Session): Promise<Session> {
  const next = { ...session, updatedAt: Date.now() };
  await db.sessions.put(next);
  queueSync();
  return next;
}

export async function createSession(
  gameId: string,
  expansionIds: string[],
  players: Player[],
): Promise<Session> {
  const def = await getAnyDefinition(gameId);
  if (!def) throw new Error(`Unknown game "${gameId}"`);
  const definition = resolveDefinition(def, expansionIds);
  const entries: Session['entries'] = {};
  const playerNames: Record<string, string> = {};
  const playerColors: Record<string, string> = {};
  for (const p of players) {
    entries[p.id] = emptyEntry(p.id);
    playerNames[p.id] = p.name;
    playerColors[p.id] = p.color;
  }
  const now = Date.now();
  const session: Session = {
    id: crypto.randomUUID(),
    gameId,
    definition,
    playerIds: players.map((p) => p.id),
    playerNames,
    playerColors,
    entries,
    status: 'active',
    startedAt: now,
    updatedAt: now,
  };
  await db.sessions.add(session);
  queueSync();
  return session;
}

export async function finishSession(session: Session): Promise<Session> {
  const totals: Record<string, number> = {};
  for (const playerId of session.playerIds) {
    totals[playerId] = computeScore(session.definition, session.entries[playerId]).total;
  }
  return saveSession({
    ...session,
    status: 'finished',
    finishedAt: Date.now(),
    totals,
  });
}

/** Undo an accidental finish: back to active, scores intact. */
export async function reopenSession(session: Session): Promise<Session> {
  return saveSession({
    ...session,
    status: 'active',
    finishedAt: undefined,
    totals: undefined,
  });
}

export async function deleteSession(session: Session): Promise<void> {
  const now = Date.now();
  await db.sessions.update(session.id, { deletedAt: now, updatedAt: now });
  queueSync();
}

/** One-tap rematch: same game, same snapshot, same players, fresh sheet. */
export async function rematchSession(previous: Session): Promise<Session> {
  const entries: Session['entries'] = {};
  for (const playerId of previous.playerIds) {
    entries[playerId] = emptyEntry(playerId);
  }
  const now = Date.now();
  const session: Session = {
    ...previous,
    id: crypto.randomUUID(),
    entries,
    status: 'active',
    startedAt: now,
    updatedAt: now,
    finishedAt: undefined,
    totals: undefined,
  };
  await db.sessions.add(session);
  queueSync();
  return session;
}
