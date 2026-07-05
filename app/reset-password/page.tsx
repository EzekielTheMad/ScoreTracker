"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentUser, updatePassword } from "@/lib/sync";

/**
 * Landing page for Supabase recovery links. The link opens with a
 * recovery token in the URL fragment; supabase-js exchanges it for a
 * session automatically, after which updateUser can set a new password.
 */
export default function ResetPasswordPage() {
  const [ready, setReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Give supabase-js a moment to consume the token from the URL.
    const timer = setTimeout(() => {
      getCurrentUser().then((user) => setReady(user !== null));
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  async function submit() {
    setBusy(true);
    setMessage(null);
    const result = await updatePassword(password);
    setBusy(false);
    if (result.ok) {
      setDone(true);
    } else {
      setMessage(result.error);
    }
  }

  return (
    <main className="flex-1 pt-safe px-safe pb-8">
      <div className="px-4 pt-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-4">Reset password</h1>

        {ready === null && <p className="text-ink-dim">Checking your link…</p>}

        {ready === false && (
          <div>
            <p className="text-ink-dim mb-4">
              This reset link is invalid or has expired. Request a new one
              from the Sync tab.
            </p>
            <Link href="/sync" className="text-accent font-bold">
              Go to Sync
            </Link>
          </div>
        )}

        {ready === true && !done && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="grid gap-3"
          >
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              autoComplete="new-password"
              className="bg-card border border-edge rounded-xl px-4 py-3 outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={busy || password.length < 6}
              className="bg-accent text-black font-bold rounded-2xl py-4 disabled:opacity-40 active:scale-[0.99]"
            >
              {busy ? "…" : "Set new password"}
            </button>
          </form>
        )}

        {done && (
          <div>
            <p className="mb-4">Password updated — you&apos;re signed in.</p>
            <Link href="/" className="text-accent font-bold">
              Back to the app
            </Link>
          </div>
        )}

        {message && (
          <p className="mt-4 text-sm bg-card border border-edge rounded-xl px-3 py-2">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
