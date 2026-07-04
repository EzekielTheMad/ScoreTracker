"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { CATALOG } from "@/lib/catalog";
import { db } from "@/lib/db/db";
import { addGameToCollection } from "@/lib/db/repo";

export default function HomePage() {
  const collection = useLiveQuery(() => db.collection.toArray(), []) ?? [];
  const active = useLiveQuery(
    () => db.sessions.where("status").equals("active").reverse().sortBy("startedAt"),
    [],
  );
  const collectedIds = new Set(collection.map((c) => c.gameId));
  const available = CATALOG.filter((g) => !collectedIds.has(g.id));

  async function addToCollection(gameId: string) {
    await addGameToCollection(gameId);
  }

  return (
    <main className="flex-1 pb-28 pt-safe px-safe">
      <div className="px-4 pt-4 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-4">Score Tracker</h1>

        {active && active.length > 0 && (
          <section className="mb-6">
            {active.map((s) => (
              <Link
                key={s.id}
                href={`/play/${s.id}`}
                className="block bg-accent/15 border border-accent/40 rounded-2xl p-4 mb-2 active:scale-[0.99]"
              >
                <div className="text-sm text-accent font-semibold">Game in progress</div>
                <div className="text-lg font-bold">{s.definition.name}</div>
                <div className="text-sm text-ink-dim">
                  {s.playerIds.map((id) => s.playerNames[id]).join(", ")} — tap to resume
                </div>
              </Link>
            ))}
          </section>
        )}

        <section className="mb-6">
          <h2 className="text-sm font-semibold text-ink-dim uppercase tracking-wide mb-2">
            My games
          </h2>
          {collection.length === 0 && (
            <p className="text-ink-dim text-sm mb-2">
              No games yet — add one from the catalog below.
            </p>
          )}
          <div className="grid gap-2">
            {collection.map((item) => {
              const def = CATALOG.find((g) => g.id === item.gameId);
              if (!def) return null;
              return (
                <Link
                  key={item.id}
                  href={`/new/${def.id}`}
                  className="flex items-center justify-between bg-card border border-edge rounded-2xl p-4 active:scale-[0.99]"
                >
                  <div>
                    <div className="text-lg font-bold">{def.name}</div>
                    <div className="text-sm text-ink-dim">
                      {def.minPlayers}–{def.maxPlayers} players
                      {def.expansions.length > 0 &&
                        ` · ${def.expansions.length} expansion${def.expansions.length > 1 ? "s" : ""}`}
                    </div>
                  </div>
                  <span className="bg-accent text-black font-bold rounded-xl px-4 py-2.5 text-sm">
                    Play
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {available.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-ink-dim uppercase tracking-wide mb-2">
              Catalog
            </h2>
            <div className="grid gap-2">
              {available.map((def) => (
                <button
                  key={def.id}
                  onClick={() => addToCollection(def.id)}
                  className="flex items-center justify-between bg-card/50 border border-dashed border-edge rounded-2xl p-4 text-left active:scale-[0.99]"
                >
                  <div>
                    <div className="text-lg font-semibold">{def.name}</div>
                    <div className="text-sm text-ink-dim">
                      {def.minPlayers}–{def.maxPlayers} players
                    </div>
                  </div>
                  <span className="text-accent font-bold text-sm">＋ Add</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
