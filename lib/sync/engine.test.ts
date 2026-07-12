import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, type Player } from '../db/db';
import { runSync, type RemoteStore, type SyncRecord } from './engine';

/** In-memory remote with the same LWW guard as the upsert_sync_records RPC. */
class FakeRemote implements RemoteStore {
  rows = new Map<string, SyncRecord>();

  async upsert(records: SyncRecord[]) {
    for (const r of records) {
      const key = `${r.kind}:${r.id}`;
      const current = this.rows.get(key);
      if (!current || current.updatedAt < r.updatedAt) {
        this.rows.set(key, structuredClone(r));
      }
    }
  }

  async pullSince(cursorMs: number) {
    return [...this.rows.values()]
      .filter((r) => r.updatedAt > cursorMs)
      .sort((a, b) => a.updatedAt - b.updatedAt)
      .map((r) => structuredClone(r));
  }
}

function player(id: string, name: string, updatedAt: number, deletedAt?: number): Player {
  return { id, name, color: '#fff', createdAt: updatedAt, updatedAt, deletedAt };
}

/** Simulates switching devices: same remote, blank local state. */
async function wipeLocal() {
  await Promise.all([
    db.players.clear(),
    db.collection.clear(),
    db.sessions.clear(),
    db.syncMeta.clear(),
  ]);
}

beforeEach(wipeLocal);

describe('runSync', () => {
  it('pushes local records and pulls them onto a fresh device', async () => {
    const remote = new FakeRemote();
    await db.players.add(player('p1', 'Ana', 1000));
    await db.collection.add({
      id: 'seven-wonders',
      gameId: 'seven-wonders',
      expansionIds: ['cities'],
      addedAt: 1000,
      updatedAt: 1000,
    });
    await runSync(remote);
    expect(remote.rows.size).toBe(2);

    await wipeLocal(); // "device B"
    await runSync(remote);
    expect((await db.players.get('p1'))?.name).toBe('Ana');
    expect((await db.collection.get('seven-wonders'))?.expansionIds).toEqual(['cities']);
  });

  it('merges last-write-wins in both directions', async () => {
    const remote = new FakeRemote();
    // Remote has a newer rename of p1 and an older rename of p2.
    const asData = (p: Player) => p as unknown as Record<string, unknown>;
    await remote.upsert([
      { kind: 'player', id: 'p1', data: asData(player('p1', 'Ana (remote)', 6000)), updatedAt: 6000, deletedAt: null },
      { kind: 'player', id: 'p2', data: asData(player('p2', 'Ben (remote)', 1000)), updatedAt: 1000, deletedAt: null },
    ]);
    await db.players.bulkAdd([
      player('p1', 'Ana (local)', 5000),
      player('p2', 'Ben (local)', 2000),
    ]);

    await runSync(remote);

    expect((await db.players.get('p1'))?.name).toBe('Ana (remote)');
    expect((await db.players.get('p2'))?.name).toBe('Ben (local)');
    expect(remote.rows.get('player:p2')?.updatedAt).toBe(2000); // local won upstream
    expect(remote.rows.get('player:p1')?.updatedAt).toBe(6000); // stale local push rejected
  });

  it('propagates deletes as tombstones', async () => {
    const remote = new FakeRemote();
    await db.players.add(player('p1', 'Ana', 1000));
    await runSync(remote);

    // Stamp with the real clock, as repo mutations do — the push cursor
    // from the previous sync is a real Date.now() value.
    const deletedAt = Date.now() + 1;
    await db.players.update('p1', { deletedAt, updatedAt: deletedAt });
    await runSync(remote);
    expect(remote.rows.get('player:p1')?.deletedAt).toBe(deletedAt);

    await wipeLocal(); // "device B" that had synced nothing yet
    await runSync(remote);
    expect((await db.players.get('p1'))?.deletedAt).toBe(deletedAt);
  });

  it('does not re-push unchanged records on the next sync', async () => {
    const remote = new FakeRemote();
    await db.players.add(player('p1', 'Ana', 1000));
    await runSync(remote);

    let pushed: SyncRecord[] = [];
    const spy: RemoteStore = {
      upsert: async (records) => {
        pushed = records;
        await remote.upsert(records);
      },
      pullSince: (c) => remote.pullSince(c),
    };
    await runSync(spy);
    expect(pushed).toEqual([]);
  });

  it('round-trips a full session record', async () => {
    const remote = new FakeRemote();
    await db.players.add(player('p1', 'Ana', 1000));
    const session = {
      id: 's1',
      gameId: 'seven-wonders',
      definition: { versionKey: 'seven-wonders@1' } as never,
      playerIds: ['p1'],
      playerNames: { p1: 'Ana' },
      playerColors: { p1: '#fff' },
      entries: {
        p1: {
          playerId: 'p1',
          values: { civic: 12 },
          calcInputs: { science: { gear: 2 } },
          tallyEvents: [{ id: 't1', amount: 5, at: 900 }],
        },
      },
      status: 'finished' as const,
      startedAt: 900,
      finishedAt: 1000,
      totals: { p1: 47 },
      updatedAt: 1000,
    };
    await db.sessions.add(session);
    await runSync(remote);
    await wipeLocal();
    await runSync(remote);
    expect(await db.sessions.get('s1')).toEqual(session);
  });
});
