"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { getDefinition } from "@/lib/catalog";
import { db } from "@/lib/db/db";
import { addGameToCollection, createPlayer, createSession } from "@/lib/db/repo";
import { resolveDefinition } from "@/lib/engine/resolve";

export default function NewGamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const router = useRouter();
  const def = getDefinition(gameId);

  const players = useLiveQuery(
    () => db.players.orderBy("createdAt").filter((p) => !p.deletedAt).toArray(),
    [],
  );
  const collectionItem = useLiveQuery(() => db.collection.get(gameId), [gameId]);

  // null = untouched, fall back to the collection's saved defaults.
  const [expansionOverride, setExpansionOverride] = useState<string[] | null>(null);
  const expansionIds = expansionOverride ?? collectionItem?.expansionIds ?? [];
  // Selection order = seating order around the table.
  const [selected, setSelected] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const [starting, setStarting] = useState(false);

  function toggleExpansion(id: string) {
    setExpansionOverride(
      expansionIds.includes(id)
        ? expansionIds.filter((x) => x !== id)
        : [...expansionIds, id],
    );
  }

  function togglePlayer(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function quickAddPlayer() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const player = await createPlayer(trimmed);
    setSelected((prev) => [...prev, player.id]);
    setNewName("");
  }

  // Expansions can raise the player cap (Skullport allows a 6th player).
  const { maxPlayers } = resolveDefinition(def, expansionIds);
  const canStart =
    selected.length >= def.minPlayers && selected.length <= maxPlayers && !starting;

  async function start() {
    if (!canStart || !players) return;
    setStarting(true);
    // Remember expansion choices as the default for next time.
    await addGameToCollection(def.id, expansionIds);
    const byId = new Map(players.map((p) => [p.id, p]));
    const session = await createSession(
      def.id,
      expansionIds,
      selected.map((id) => byId.get(id)!),
    );
    router.replace(`/play/${session.id}`);
  }

  return (
    <main className="flex-1 pb-40 pt-safe px-safe">
      <div className="px-4 pt-4 max-w-lg mx-auto">
        <button onClick={() => router.back()} className="text-ink-dim text-sm mb-2 py-2">
          ‹ Back
        </button>
        <h1 className="text-2xl font-bold mb-4">{def.name}</h1>

        {def.expansions.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-ink-dim uppercase tracking-wide mb-2">
              Expansions
            </h2>
            <div className="grid gap-2">
              {def.expansions.map((exp) => {
                const on = expansionIds.includes(exp.id);
                return (
                  <button
                    key={exp.id}
                    onClick={() => toggleExpansion(exp.id)}
                    className={`flex items-center justify-between rounded-2xl border p-4 text-left active:scale-[0.99] ${
                      on ? "bg-accent/15 border-accent/60" : "bg-card border-edge"
                    }`}
                  >
                    <span className="font-semibold">{exp.name}</span>
                    <span
                      className={`w-12 h-7 rounded-full relative transition-colors ${
                        on ? "bg-accent" : "bg-edge"
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                          on ? "left-6" : "left-1"
                        }`}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="mb-6">
          <h2 className="text-sm font-semibold text-ink-dim uppercase tracking-wide mb-2">
            Players ({selected.length}) — tap in seating order
          </h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {(players ?? []).map((p) => {
              const idx = selected.indexOf(p.id);
              const on = idx >= 0;
              return (
                <button
                  key={p.id}
                  onClick={() => togglePlayer(p.id)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2.5 font-semibold active:scale-95 ${
                    on ? "border-transparent text-black" : "bg-card border-edge"
                  }`}
                  style={on ? { backgroundColor: p.color } : undefined}
                >
                  {on && <span className="text-xs font-bold">{idx + 1}</span>}
                  {p.name}
                </button>
              );
            })}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              quickAddPlayer();
            }}
            className="flex gap-2"
          >
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New player…"
              className="flex-1 bg-card border border-edge rounded-xl px-4 py-3 outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              className="bg-card border border-edge rounded-xl px-5 font-bold disabled:opacity-40"
            >
              ＋
            </button>
          </form>
        </section>
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-surface/95 backdrop-blur border-t border-edge p-4 pb-safe px-safe">
        <div className="max-w-lg mx-auto pb-2">
          <button
            onClick={start}
            disabled={!canStart}
            className="w-full bg-accent text-black text-lg font-bold rounded-2xl py-4 disabled:opacity-40 active:scale-[0.99]"
          >
            {selected.length < def.minPlayers
              ? `Pick at least ${def.minPlayers} players`
              : selected.length > maxPlayers
                ? `Max ${maxPlayers} players`
                : "Start game"}
          </button>
        </div>
      </div>
    </main>
  );
}
