"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { db } from "@/lib/db/db";

export default function HistoryPage() {
  const finished = useLiveQuery(
    () =>
      db.sessions
        .where("status")
        .equals("finished")
        .reverse()
        .sortBy("finishedAt")
        .then((list) => list.reverse()),
    [],
  );

  return (
    <main className="flex-1 pb-28 pt-safe px-safe">
      <div className="px-4 pt-4 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-4">History</h1>
        <div className="grid gap-2">
          {(finished ?? []).map((s) => {
            const winnerId = s.playerIds.reduce((best, pid) =>
              (s.totals?.[pid] ?? 0) > (s.totals?.[best] ?? 0) ? pid : best,
            );
            return (
              <Link
                key={s.id}
                href={`/results/${s.id}`}
                className="bg-card border border-edge rounded-2xl p-4 active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">{s.definition.name}</span>
                  <span className="text-xs text-ink-dim">
                    {new Date(s.finishedAt ?? s.startedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm text-ink-dim mt-1">
                  🏆 {s.playerNames[winnerId]} ({s.totals?.[winnerId] ?? 0}) ·{" "}
                  {s.playerIds.length} players
                </div>
              </Link>
            );
          })}
          {finished && finished.length === 0 && (
            <p className="text-ink-dim text-sm">Finished games show up here.</p>
          )}
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
