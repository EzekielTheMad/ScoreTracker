"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db, type Session } from "@/lib/db/db";
import { rematchSession } from "@/lib/db/repo";
import { computeScore } from "@/lib/engine/score";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function ResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    db.sessions.get(sessionId).then((s) => setSession(s ?? null));
  }, [sessionId]);

  if (session === undefined) return null;
  if (session === null) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
        <p className="text-ink-dim">Result not found on this device.</p>
        <Link href="/" className="text-accent font-bold">
          Go home
        </Link>
      </main>
    );
  }

  const breakdowns = Object.fromEntries(
    session.playerIds.map((pid) => [
      pid,
      computeScore(session.definition, session.entries[pid]),
    ]),
  );
  const standings = [...session.playerIds].sort(
    (a, b) => breakdowns[b].total - breakdowns[a].total,
  );
  const hasUnverified = session.definition.fields.some(
    (f) => f.kind === "calculated" && f.unverified,
  );

  async function rematch() {
    if (!session) return;
    const next = await rematchSession(session);
    router.replace(`/play/${next.id}`);
  }

  async function deleteResult() {
    if (!session) return;
    if (!window.confirm("Delete this result permanently?")) return;
    await db.sessions.delete(session.id);
    router.replace("/history");
  }

  return (
    <main className="flex-1 pt-safe px-safe pb-36">
      <div className="px-4 pt-4 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-1">
          <Link href="/" className="text-ink-dim text-sm py-2 pr-3">
            ‹ Home
          </Link>
          <span className="text-sm text-ink-dim">
            {new Date(session.finishedAt ?? session.startedAt).toLocaleDateString()}
          </span>
        </div>
        <h1 className="text-2xl font-bold mb-1">{session.definition.name}</h1>
        <p className="text-xs text-ink-dim mb-4">
          Scored with {session.definition.versionKey}
        </p>
        {hasUnverified && (
          <p className="text-xs bg-amber-500/15 border border-amber-500/40 text-amber-300 rounded-xl px-3 py-2 mb-4">
            ⚠️ Includes a scoring formula not yet verified against the rulebook.
          </p>
        )}

        <div className="grid gap-2 mb-6">
          {standings.map((pid, i) => (
            <div
              key={pid}
              className={`flex items-center gap-3 rounded-2xl border p-4 ${
                i === 0 ? "bg-accent/15 border-accent/50" : "bg-card border-edge"
              }`}
            >
              <span className="text-2xl w-8 text-center">{MEDALS[i] ?? i + 1}</span>
              <span
                className="w-3 h-8 rounded-full shrink-0"
                style={{ backgroundColor: session.playerColors[pid] }}
              />
              <span className="flex-1 text-lg font-semibold truncate">
                {session.playerNames[pid]}
              </span>
              <span className="text-2xl font-bold tabular-nums">
                {breakdowns[pid].total}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowBreakdown((v) => !v)}
          className="text-accent text-sm font-semibold mb-3"
        >
          {showBreakdown ? "Hide breakdown" : "Show breakdown"}
        </button>
        {showBreakdown && (
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="text-left py-1 pr-2 min-w-24" />
                  {standings.map((pid) => (
                    <th key={pid} className="px-2 py-1 text-center font-semibold">
                      {session.playerNames[pid]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {session.definition.fields.map((field) => (
                  <tr key={field.id}>
                    <th
                      className="text-left py-1.5 pr-2 font-medium"
                      style={{ color: field.color }}
                    >
                      {field.shortLabel ?? field.label}
                    </th>
                    {standings.map((pid) => (
                      <td key={pid} className="px-2 py-1.5 text-center tabular-nums">
                        {breakdowns[pid].perField[field.id]}
                      </td>
                    ))}
                  </tr>
                ))}
                {session.definition.mode !== "endgame" && (
                  <tr>
                    <th className="text-left py-1.5 pr-2 font-medium">During play</th>
                    {standings.map((pid) => (
                      <td key={pid} className="px-2 py-1.5 text-center tabular-nums">
                        {breakdowns[pid].tally}
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <button onClick={deleteResult} className="block text-red-400/80 text-sm py-2 mt-4">
          Delete result
        </button>
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-surface/95 backdrop-blur border-t border-edge p-4 pb-safe px-safe">
        <div className="max-w-lg mx-auto pb-2 flex gap-3">
          <Link
            href="/"
            className="flex-1 text-center bg-card border border-edge font-bold rounded-2xl py-4 active:scale-[0.99]"
          >
            Done
          </Link>
          <button
            onClick={rematch}
            className="flex-1 bg-accent text-black text-lg font-bold rounded-2xl py-4 active:scale-[0.99]"
          >
            ↻ Rematch
          </button>
        </div>
      </div>
    </main>
  );
}
