"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ScoreGrid } from "@/components/ScoreGrid";
import { db, type Session } from "@/lib/db/db";
import { finishSession } from "@/lib/db/repo";
import { computeScore } from "@/lib/engine/score";

export default function PlayPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    db.sessions.get(sessionId).then((s) => setSession(s ?? null));
  }, [sessionId]);

  /** Mutate in React state for instant typing, write through to IndexedDB. */
  function update(mutate: (s: Session) => Session) {
    setSession((prev) => {
      if (!prev) return prev;
      const next = mutate(prev);
      db.sessions.put(next);
      return next;
    });
  }

  function setValue(playerId: string, fieldId: string, value: number | undefined) {
    update((s) => ({
      ...s,
      entries: {
        ...s.entries,
        [playerId]: {
          ...s.entries[playerId],
          values: { ...s.entries[playerId].values, [fieldId]: value },
        },
      },
    }));
  }

  function setCalcInput(
    playerId: string,
    fieldId: string,
    inputId: string,
    value: number | undefined,
  ) {
    update((s) => ({
      ...s,
      entries: {
        ...s.entries,
        [playerId]: {
          ...s.entries[playerId],
          calcInputs: {
            ...s.entries[playerId].calcInputs,
            [fieldId]: {
              ...s.entries[playerId].calcInputs[fieldId],
              [inputId]: value,
            },
          },
        },
      },
    }));
  }

  async function finish() {
    if (!session) return;
    if (!window.confirm("Finish game and record the result?")) return;
    const finished = await finishSession(session);
    router.replace(`/results/${finished.id}`);
  }

  if (session === undefined) return null;
  if (session === null) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
        <p className="text-ink-dim">This game doesn’t exist on this device.</p>
        <Link href="/" className="text-accent font-bold">
          Go home
        </Link>
      </main>
    );
  }
  if (session.status === "finished") {
    router.replace(`/results/${session.id}`);
    return null;
  }

  return (
    <main className="flex-1 pt-safe px-safe pb-32">
      <div className="px-3 pt-3 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <Link href="/" className="text-ink-dim text-sm py-2 pr-3">
            ‹ Home
          </Link>
          <h1 className="text-lg font-bold">{session.definition.name}</h1>
          <span className="text-sm text-ink-dim">{session.playerIds.length}p</span>
        </div>

        <ScoreGrid session={session} onSetValue={setValue} onSetCalcInput={setCalcInput} />
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-surface/95 backdrop-blur border-t border-edge p-4 pb-safe px-safe">
        <div className="max-w-3xl mx-auto pb-2">
          <div className="flex gap-2 overflow-x-auto mb-3">
            {session.playerIds.map((pid) => (
              <span
                key={pid}
                className="flex items-center gap-1.5 bg-card border border-edge rounded-full pl-2 pr-3 py-1 text-sm shrink-0"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: session.playerColors[pid] }}
                />
                <span className="text-ink-dim max-w-20 truncate">
                  {session.playerNames[pid]}
                </span>
                <span className="font-bold tabular-nums">
                  {computeScore(session.definition, session.entries[pid]).total}
                </span>
              </span>
            ))}
          </div>
          <button
            onClick={finish}
            className="w-full bg-accent text-black text-lg font-bold rounded-2xl py-4 active:scale-[0.99]"
          >
            Finish game
          </button>
        </div>
      </div>
    </main>
  );
}
