"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { db } from "@/lib/db/db";
import { createPlayer } from "@/lib/db/repo";

export default function PlayersPage() {
  const players = useLiveQuery(() => db.players.orderBy("createdAt").toArray(), []);
  const [name, setName] = useState("");

  async function addPlayer() {
    const trimmed = name.trim();
    if (!trimmed) return;
    await createPlayer(trimmed);
    setName("");
  }

  async function renamePlayer(id: string, current: string) {
    const next = window.prompt("Rename player", current)?.trim();
    if (next && next !== current) await db.players.update(id, { name: next });
  }

  async function deletePlayer(id: string, playerName: string) {
    if (window.confirm(`Remove ${playerName}? Past results keep their name.`)) {
      await db.players.delete(id);
    }
  }

  return (
    <main className="flex-1 pb-28 pt-safe px-safe">
      <div className="px-4 pt-4 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-4">Players</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            addPlayer();
          }}
          className="flex gap-2 mb-6"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Add a player…"
            className="flex-1 bg-card border border-edge rounded-xl px-4 py-3 outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="bg-accent text-black font-bold rounded-xl px-5 disabled:opacity-40"
          >
            Add
          </button>
        </form>

        <div className="grid gap-2">
          {(players ?? []).map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 bg-card border border-edge rounded-2xl p-3"
            >
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-black shrink-0"
                style={{ backgroundColor: p.color }}
              >
                {p.name.slice(0, 1).toUpperCase()}
              </span>
              <button
                onClick={() => renamePlayer(p.id, p.name)}
                className="flex-1 text-left text-lg font-semibold py-2"
              >
                {p.name}
              </button>
              <button
                onClick={() => deletePlayer(p.id, p.name)}
                className="text-ink-dim px-3 py-2 text-xl"
                aria-label={`Remove ${p.name}`}
              >
                ✕
              </button>
            </div>
          ))}
          {players && players.length === 0 && (
            <p className="text-ink-dim text-sm">
              Saved players show up here so you can pick them for any game.
            </p>
          )}
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
