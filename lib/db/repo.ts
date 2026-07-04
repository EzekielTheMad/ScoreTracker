import { getDefinition } from '../catalog';
import { resolveDefinition } from '../engine/resolve';
import { computeScore, emptyEntry } from '../engine/score';
import { nextPlayerColor } from '../playerColors';
import { db, type Player, type Session } from './db';

export async function createPlayer(name: string): Promise<Player> {
  const player: Player = {
    id: crypto.randomUUID(),
    name,
    color: nextPlayerColor(await db.players.count()),
    createdAt: Date.now(),
  };
  await db.players.add(player);
  return player;
}

export async function addGameToCollection(
  gameId: string,
  expansionIds: string[] = [],
): Promise<void> {
  const existing = await db.collection.get(gameId);
  await db.collection.put({
    id: gameId,
    gameId,
    expansionIds,
    addedAt: existing?.addedAt ?? Date.now(),
  });
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
  const session: Session = {
    id: crypto.randomUUID(),
    gameId,
    definition,
    playerIds: players.map((p) => p.id),
    playerNames,
    playerColors,
    entries,
    status: 'active',
    startedAt: Date.now(),
  };
  await db.sessions.add(session);
  return session;
}

export async function finishSession(session: Session): Promise<Session> {
  const totals: Record<string, number> = {};
  for (const playerId of session.playerIds) {
    totals[playerId] = computeScore(session.definition, session.entries[playerId]).total;
  }
  const finished: Session = {
    ...session,
    status: 'finished',
    finishedAt: Date.now(),
    totals,
  };
  await db.sessions.put(finished);
  return finished;
}

/** One-tap rematch: same game, same snapshot, same players, fresh sheet. */
export async function rematchSession(previous: Session): Promise<Session> {
  const entries: Session['entries'] = {};
  for (const playerId of previous.playerIds) {
    entries[playerId] = emptyEntry(playerId);
  }
  const session: Session = {
    ...previous,
    id: crypto.randomUUID(),
    entries,
    status: 'active',
    startedAt: Date.now(),
    finishedAt: undefined,
    totals: undefined,
  };
  await db.sessions.add(session);
  return session;
}
