import Dexie from 'dexie';
import { db } from '../db/db';

/**
 * Core sync loop, independent of Supabase so it can run against a fake
 * remote in tests. IndexedDB stays the source of truth: local changes
 * push as whole records keyed (kind, id); pulls merge last-write-wins by
 * the record's updatedAt stamp. Deletes travel as tombstones (deletedAt)
 * inside the payload, never as row removals.
 */

export type Kind = 'player' | 'collection' | 'session' | 'customGame';

export interface SyncRecord {
  kind: Kind;
  id: string;
  /** The full local record, including its own updatedAt/deletedAt. */
  data: Record<string, unknown>;
  updatedAt: number;
  deletedAt: number | null;
}

export interface RemoteStore {
  /** Last-write-wins upsert; must never let stale rows clobber newer ones. */
  upsert(records: SyncRecord[]): Promise<void>;
  /** Records with updated_at strictly greater than the cursor, ascending. */
  pullSince(cursorMs: number): Promise<SyncRecord[]>;
}

const KIND_TABLES: [Kind, () => Dexie.Table<{ id: string; updatedAt: number; deletedAt?: number }, string>][] = [
  ['player', () => db.players],
  ['collection', () => db.collection],
  ['session', () => db.sessions],
  ['customGame', () => db.customGames],
];

/**
 * Pull cursors come from other devices' clocks, so re-pull a small window
 * behind the cursor; the merge is idempotent, missed rows are not.
 */
const PULL_OVERLAP_MS = 5 * 60 * 1000;

async function metaValue(key: string): Promise<number> {
  return (await db.syncMeta.get(key))?.value ?? 0;
}

export async function runSync(remote: RemoteStore): Promise<void> {
  const startedAt = Date.now();

  // Push everything stamped at or after the last push (>= so a record
  // stamped exactly at the cursor is retried; the upsert is idempotent).
  const lastPushedAt = await metaValue('lastPushedAt');
  const outgoing: SyncRecord[] = [];
  for (const [kind, table] of KIND_TABLES) {
    const changed = await table().where('updatedAt').aboveOrEqual(lastPushedAt).toArray();
    for (const record of changed) {
      outgoing.push({
        kind,
        id: record.id,
        data: record as unknown as Record<string, unknown>,
        updatedAt: record.updatedAt,
        deletedAt: record.deletedAt ?? null,
      });
    }
  }
  if (outgoing.length > 0) {
    await remote.upsert(outgoing);
  }

  // Pull and merge newer remote records.
  const lastPulledAt = await metaValue('lastPulledAt');
  const incoming = await remote.pullSince(Math.max(0, lastPulledAt - PULL_OVERLAP_MS));
  let maxSeen = lastPulledAt;
  for (const record of incoming) {
    const table = KIND_TABLES.find(([kind]) => kind === record.kind)?.[1]();
    if (!table) continue; // unknown kind from a newer app version
    const local = await table.get(record.id);
    if (!local || local.updatedAt < record.updatedAt) {
      await table.put(record.data as unknown as { id: string; updatedAt: number });
    }
    if (record.updatedAt > maxSeen) maxSeen = record.updatedAt;
  }

  await db.syncMeta.bulkPut([
    { key: 'lastPushedAt', value: startedAt },
    { key: 'lastPulledAt', value: maxSeen },
    { key: 'lastSyncedAt', value: startedAt },
  ]);
}
