import {
  createClient,
  type SupabaseClient,
  type User,
} from '@supabase/supabase-js';
import { SUPABASE_KEY, SUPABASE_URL, SYNC_ENABLED } from './config';
import type { RemoteStore, SyncRecord } from './engine';

let client: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (!SYNC_ENABLED) return null;
  if (client === undefined) {
    client = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return client;
}

const PAGE_SIZE = 1000;

/** RemoteStore backed by the sync_records table (RLS scopes rows to the user). */
export function supabaseRemote(sb: SupabaseClient): RemoteStore {
  return {
    async upsert(records: SyncRecord[]) {
      const { error } = await sb.rpc('upsert_sync_records', {
        records: records.map((r) => ({
          kind: r.kind,
          id: r.id,
          data: r.data,
          updatedAt: r.updatedAt,
          deletedAt: r.deletedAt,
        })),
      });
      if (error) throw new Error(`sync push failed: ${error.message}`);
    },

    async pullSince(cursorMs: number) {
      const all: SyncRecord[] = [];
      let cursor = cursorMs;
      for (;;) {
        const { data, error } = await sb
          .from('sync_records')
          .select('kind,id,data,updated_at,deleted_at')
          .gt('updated_at', cursor)
          .order('updated_at', { ascending: true })
          .limit(PAGE_SIZE);
        if (error) throw new Error(`sync pull failed: ${error.message}`);
        for (const row of data) {
          all.push({
            kind: row.kind,
            id: row.id,
            data: row.data,
            updatedAt: Number(row.updated_at),
            deletedAt: row.deleted_at == null ? null : Number(row.deleted_at),
          });
        }
        if (data.length < PAGE_SIZE) return all;
        cursor = Number(data[data.length - 1].updated_at);
      }
    },
  };
}

// --- Auth (email + password; profiles are for sync only, not identity) ---

export async function getCurrentUser(): Promise<User | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.user ?? null;
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const { data } = sb.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => data.subscription.unsubscribe();
}

export async function signUp(
  email: string,
  password: string,
): Promise<{ ok: true; needsConfirmation: boolean } | { ok: false; error: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: 'Sync is disabled in this build' };
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true, needsConfirmation: data.session === null };
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: 'Sync is disabled in this build' };
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOut(): Promise<void> {
  await getSupabase()?.auth.signOut();
}
