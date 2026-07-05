/**
 * Public sync API. IndexedDB (lib/db) is the local source of truth; this
 * layer pushes/pulls per-user records to Supabase behind SYNC_ENABLED.
 * Mutations call queueSync() (via lib/db/repo) so changes trickle up a
 * few seconds after the table quiets down; pulls run on app focus and
 * from the Sync page.
 */
import { getCurrentUser, getSupabase, supabaseRemote } from './client';
import { runSync } from './engine';

export { SYNC_ENABLED } from './config';
export {
  getCurrentUser,
  onAuthChange,
  requestPasswordReset,
  signIn,
  signOut,
  signUp,
  updatePassword,
} from './client';

export type SyncResult = { ok: true } | { ok: false; error: string };

let inFlight: Promise<SyncResult> | null = null;

export function syncNow(): Promise<SyncResult> {
  // Coalesce concurrent calls; runSync isn't reentrant-safe on cursors.
  inFlight ??= (async () => {
    try {
      const sb = getSupabase();
      if (!sb) return { ok: false as const, error: 'Sync is disabled in this build' };
      if (!(await getCurrentUser())) {
        return { ok: false as const, error: 'Not signed in' };
      }
      await runSync(supabaseRemote(sb));
      return { ok: true as const };
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : String(err) };
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

let queueTimer: ReturnType<typeof setTimeout> | undefined;

/** Debounced background sync; a no-op when signed out or offline. */
export function queueSync(delayMs = 2500): void {
  if (typeof window === 'undefined') return;
  clearTimeout(queueTimer);
  queueTimer = setTimeout(() => {
    if (navigator.onLine !== false) void syncNow();
  }, delayMs);
}
