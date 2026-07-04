/**
 * Supabase sync scaffold — NOT WIRED YET.
 *
 * IndexedDB (lib/db) is the local source of truth; sync is a later layer
 * that pushes/pulls players, collection, and sessions behind a feature
 * flag. Nothing imports this module from app code while the flag is off.
 */

export const SYNC_ENABLED = process.env.NEXT_PUBLIC_SYNC_ENABLED === 'true';

export interface SyncEngine {
  /** Push local changes since the last sync, pull remote ones, reconcile. */
  sync(): Promise<void>;
}

export function createSyncEngine(): SyncEngine {
  if (!SYNC_ENABLED) {
    throw new Error('Sync is behind NEXT_PUBLIC_SYNC_ENABLED and not wired yet');
  }
  // TODO: Supabase client + table mapping (players, collection, sessions),
  // last-write-wins on updatedAt, definition snapshots stored as JSON.
  throw new Error('Supabase sync not implemented yet');
}
