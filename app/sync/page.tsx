"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { BottomNav } from "@/components/BottomNav";
import { db } from "@/lib/db/db";
import {
  SYNC_ENABLED,
  getCurrentUser,
  onAuthChange,
  signIn,
  signOut,
  signUp,
  syncNow,
} from "@/lib/sync";

export default function SyncPage() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const lastSynced = useLiveQuery(() => db.syncMeta.get("lastSyncedAt"), []);

  useEffect(() => {
    getCurrentUser().then(setUser);
    return onAuthChange(setUser);
  }, []);

  async function submit() {
    setBusy(true);
    setMessage(null);
    const result = creating
      ? await signUp(email.trim(), password)
      : await signIn(email.trim(), password);
    setBusy(false);
    if (!result.ok) {
      setMessage(result.error);
    } else if ("needsConfirmation" in result && result.needsConfirmation) {
      setMessage("Check your email to confirm the account, then sign in here.");
    } else {
      setPassword("");
      void runSync();
    }
  }

  async function runSync() {
    setBusy(true);
    setMessage(null);
    const result = await syncNow();
    setBusy(false);
    setMessage(result.ok ? "Synced." : result.error);
  }

  return (
    <main className="flex-1 pb-28 pt-safe px-safe">
      <div className="px-4 pt-4 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-1">Sync</h1>
        <p className="text-sm text-ink-dim mb-6">
          Everything works offline; sign in to back up players and history and
          share them across devices.
        </p>

        {!SYNC_ENABLED ? (
          <p className="text-ink-dim">Sync is disabled in this build.</p>
        ) : user ? (
          <div className="grid gap-3">
            <div className="bg-card border border-edge rounded-2xl p-4">
              <div className="text-sm text-ink-dim">Signed in as</div>
              <div className="font-semibold">{user.email}</div>
              <div className="text-sm text-ink-dim mt-2">
                Last synced:{" "}
                {lastSynced?.value
                  ? new Date(lastSynced.value).toLocaleString()
                  : "never"}
              </div>
            </div>
            <button
              onClick={runSync}
              disabled={busy}
              className="bg-accent text-black font-bold rounded-2xl py-4 disabled:opacity-40 active:scale-[0.99]"
            >
              {busy ? "Syncing…" : "Sync now"}
            </button>
            <button
              onClick={() => signOut()}
              className="text-ink-dim text-sm py-2"
            >
              Sign out
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="grid gap-3"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              className="bg-card border border-edge rounded-xl px-4 py-3 outline-none focus:border-accent"
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete={creating ? "new-password" : "current-password"}
              className="bg-card border border-edge rounded-xl px-4 py-3 outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={busy || !email.trim() || password.length < 6}
              className="bg-accent text-black font-bold rounded-2xl py-4 disabled:opacity-40 active:scale-[0.99]"
            >
              {busy ? "…" : creating ? "Create account" : "Sign in"}
            </button>
            <button
              type="button"
              onClick={() => setCreating((v) => !v)}
              className="text-accent text-sm py-2"
            >
              {creating
                ? "Have an account? Sign in"
                : "First device? Create an account"}
            </button>
          </form>
        )}

        {message && (
          <p className="mt-4 text-sm bg-card border border-edge rounded-xl px-3 py-2">
            {message}
          </p>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
