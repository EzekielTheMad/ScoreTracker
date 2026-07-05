import { getDefinition } from '../catalog';
import { resolveDefinition } from '../engine/resolve';
import { computeScore, emptyEntry } from '../engine/score';
import { nextPlayerColor } from '../playerColors';
import type { TallyEvent } from '../engine/types';
import { queueSync } from '../sync';
import { db, type Player, type Session } from './db';

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
  const definition = resolveDefinition(getDefinition(gameId), expansionIds);
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
