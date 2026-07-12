"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { NumCell } from "@/components/NumCell";
import { db, type CustomGame } from "@/lib/db/db";
import { deleteCustomGame, saveCustomGame } from "@/lib/db/repo";
import type { ScoringMode } from "@/lib/engine/types";

interface FieldRow {
  id: string; // '' until first save
  label: string;
  points: number | undefined;
  per: number | undefined;
}

interface CategoryRow {
  id: string;
  label: string;
}

const MODES: { value: ScoringMode; label: string; blurb: string }[] = [
  { value: "endgame", label: "Score sheet", blurb: "Fill in categories when the game ends" },
  { value: "tally", label: "Running tally", blurb: "Add points as they happen during play" },
  { value: "hybrid", label: "Both", blurb: "Tally during play plus end-game categories" },
];

/** Create (/custom/new) or edit (/custom/<id>) a data-only game definition. */
export default function CustomGamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const isNew = gameId === "new";
  const existing = useLiveQuery(
    async () => (isNew ? null : ((await db.customGames.get(gameId)) ?? null)),
    [gameId, isNew],
  );

  if (!isNew && existing === undefined) return null;
  if (!isNew && (existing === null || existing?.deletedAt)) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
        <p className="text-ink-dim">This custom game doesn’t exist on this device.</p>
        <Link href="/" className="text-accent font-bold">
          Go home
        </Link>
      </main>
    );
  }

  // Keyed so switching between games remounts with fresh form state.
  return <GameForm key={gameId} existing={isNew ? undefined : (existing ?? undefined)} />;
}

function GameForm({ existing }: { existing?: CustomGame }) {
  const router = useRouter();
  const [name, setName] = useState(existing?.name ?? "");
  const [mode, setMode] = useState<ScoringMode>(existing?.mode ?? "endgame");
  const [minPlayers, setMinPlayers] = useState<number | undefined>(
    existing?.minPlayers ?? 2,
  );
  const [maxPlayers, setMaxPlayers] = useState<number | undefined>(
    existing?.maxPlayers ?? 6,
  );
  const [fields, setFields] = useState<FieldRow[]>(() =>
    existing && existing.fields.length > 0
      ? existing.fields.map((f) => ({
          id: f.id,
          label: f.label,
          points: f.kind === "number" ? (f.score?.points ?? 1) : 1,
          per: f.kind === "number" ? (f.score?.per ?? 1) : 1,
        }))
      : [{ id: "", label: "", points: 1, per: 1 }],
  );
  const [quickAmounts, setQuickAmounts] = useState(
    existing?.tally ? existing.tally.quickAmounts.join(", ") : "1, 2, 5, 10",
  );
  const [categories, setCategories] = useState<CategoryRow[]>(
    () =>
      existing?.tally?.categories?.map((c) => ({ id: c.id, label: c.label })) ?? [],
  );
  const [errors, setErrors] = useState<string[]>([]);

  function patchField(index: number, patch: Partial<FieldRow>) {
    setFields((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  async function save() {
    setErrors([]);
    const labeledFields = fields.filter((f) => f.label.trim());
    const labeledCategories = categories.filter((c) => c.label.trim());
    const result = await saveCustomGame(
      {
        name: name.trim(),
        mode,
        minPlayers: minPlayers ?? 0,
        maxPlayers: maxPlayers ?? 0,
        fields:
          mode === "tally"
            ? []
            : labeledFields.map((f) => {
                const points = f.points ?? 1;
                const per = f.per ?? 1;
                const scored = points !== 1 || per !== 1;
                return {
                  kind: "number" as const,
                  id: f.id,
                  label: f.label.trim(),
                  score: scored ? { points, per } : undefined,
                  hint: scored
                    ? per === 1
                      ? `${points} point${Math.abs(points) === 1 ? "" : "s"} each`
                      : `${points} point${Math.abs(points) === 1 ? "" : "s"} per ${per}`
                    : undefined,
                };
              }),
        tally:
          mode === "endgame"
            ? undefined
            : {
                quickAmounts: quickAmounts
                  .split(/[,\s]+/)
                  .filter(Boolean)
                  .map((n) => parseInt(n, 10)),
                categories: labeledCategories.map((c) => ({
                  id: c.id,
                  label: c.label.trim(),
                })),
              },
      },
      existing?.id,
    );
    if (!result.ok) {
      // Strip the internal id prefix; the user only has one game in view.
      setErrors(result.errors.map((e) => e.replace(/^[^:]*: /, "")));
      return;
    }
    router.replace(`/new/${result.game.id}`);
  }

  async function remove() {
    if (!existing) return;
    if (!window.confirm("Delete this game? Recorded results are kept.")) return;
    await deleteCustomGame(existing.id);
    router.replace("/");
  }

  const showFields = mode !== "tally";
  const showTally = mode !== "endgame";

  return (
    <main className="flex-1 pb-40 pt-safe px-safe">
      <div className="px-4 pt-4 max-w-lg mx-auto">
        <button onClick={() => router.back()} className="text-ink-dim text-sm mb-2 py-2">
          ‹ Back
        </button>
        <h1 className="text-2xl font-bold mb-4">
          {existing ? "Edit game" : "Create a game"}
        </h1>

        <label className="block mb-4">
          <span className="text-sm font-semibold text-ink-dim uppercase tracking-wide">
            Name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Game name…"
            className="mt-1 w-full bg-card border border-edge rounded-xl px-4 py-3 outline-none focus:border-accent"
          />
        </label>

        <div className="mb-4">
          <span className="text-sm font-semibold text-ink-dim uppercase tracking-wide">
            Scoring style
          </span>
          <div className="grid gap-2 mt-1">
            {MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={`rounded-2xl border p-3 text-left ${
                  mode === m.value ? "bg-accent/15 border-accent/60" : "bg-card border-edge"
                }`}
              >
                <div className="font-semibold">{m.label}</div>
                <div className="text-sm text-ink-dim">{m.blurb}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <label className="flex-1">
            <span className="text-sm font-semibold text-ink-dim uppercase tracking-wide">
              Min players
            </span>
            <div className="mt-1">
              <NumCell value={minPlayers} onChange={setMinPlayers} />
            </div>
          </label>
          <label className="flex-1">
            <span className="text-sm font-semibold text-ink-dim uppercase tracking-wide">
              Max players
            </span>
            <div className="mt-1">
              <NumCell value={maxPlayers} onChange={setMaxPlayers} />
            </div>
          </label>
        </div>

        {showFields && (
          <div className="mb-4">
            <span className="text-sm font-semibold text-ink-dim uppercase tracking-wide">
              Score categories
            </span>
            <p className="text-xs text-ink-dim mb-2">
              Leave pts/per at 1/1 for plain points. Use pts 3, per 1 for “3
              points each”; pts 1, per 3 for “1 point per 3 coins”.
            </p>
            <div className="grid gap-2">
              {fields.map((field, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={field.label}
                    onChange={(e) => patchField(i, { label: e.target.value })}
                    placeholder={`Category ${i + 1}…`}
                    className="flex-1 min-w-0 bg-card border border-edge rounded-xl px-3 py-2.5 outline-none focus:border-accent"
                  />
                  <span className="text-xs text-ink-dim">pts</span>
                  <div className="w-16">
                    <NumCell
                      compact
                      allowNegative
                      value={field.points}
                      onChange={(v) => patchField(i, { points: v })}
                    />
                  </div>
                  <span className="text-xs text-ink-dim">per</span>
                  <div className="w-12">
                    <NumCell
                      compact
                      value={field.per}
                      onChange={(v) => patchField(i, { per: v })}
                    />
                  </div>
                  <button
                    onClick={() => setFields((rows) => rows.filter((_, j) => j !== i))}
                    className="text-ink-dim px-1"
                    aria-label="Remove category"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                setFields((rows) => [...rows, { id: "", label: "", points: 1, per: 1 }])
              }
              className="text-accent text-sm font-semibold py-2"
            >
              ＋ Add category
            </button>
          </div>
        )}

        {showTally && (
          <div className="mb-4">
            <span className="text-sm font-semibold text-ink-dim uppercase tracking-wide">
              Tally
            </span>
            <label className="block mt-1 mb-2">
              <span className="text-xs text-ink-dim">Quick-add buttons (comma-separated)</span>
              <input
                value={quickAmounts}
                onChange={(e) => setQuickAmounts(e.target.value)}
                inputMode="numeric"
                className="mt-1 w-full bg-card border border-edge rounded-xl px-3 py-2.5 outline-none focus:border-accent"
              />
            </label>
            <span className="text-xs text-ink-dim">Point sources (optional)</span>
            <div className="grid gap-2 mt-1">
              {categories.map((cat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={cat.label}
                    onChange={(e) =>
                      setCategories((rows) =>
                        rows.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)),
                      )
                    }
                    placeholder="e.g. Quest, Road, Bonus…"
                    className="flex-1 min-w-0 bg-card border border-edge rounded-xl px-3 py-2.5 outline-none focus:border-accent"
                  />
                  <button
                    onClick={() => setCategories((rows) => rows.filter((_, j) => j !== i))}
                    className="text-ink-dim px-1"
                    aria-label="Remove source"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setCategories((rows) => [...rows, { id: "", label: "" }])}
              className="text-accent text-sm font-semibold py-2"
            >
              ＋ Add point source
            </button>
          </div>
        )}

        {errors.length > 0 && (
          <ul className="mb-4 text-sm bg-red-500/10 border border-red-500/40 text-red-300 rounded-xl px-4 py-2 list-disc list-inside">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}

        {existing && (
          <button onClick={remove} className="block text-red-400/80 text-sm py-2">
            Delete game
          </button>
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-surface/95 backdrop-blur border-t border-edge p-4 pb-safe px-safe">
        <div className="max-w-lg mx-auto pb-2">
          <button
            onClick={save}
            disabled={!name.trim()}
            className="w-full bg-accent text-black text-lg font-bold rounded-2xl py-4 disabled:opacity-40 active:scale-[0.99]"
          >
            {existing ? "Save changes" : "Create game"}
          </button>
        </div>
      </div>
    </main>
  );
}
