"use client";

import { useState } from "react";
import { tallyTotal } from "@/lib/engine/score";
import type { Session } from "@/lib/db/db";

/**
 * Running-tally scoring for during play: one card per player with big
 * quick-add buttons; the expandable panel handles odd amounts, categories,
 * and subtractions. Undo (in the page footer) removes the last event.
 */
export function TallyBoard({
  session,
  onAdd,
}: {
  session: Session;
  onAdd: (playerId: string, amount: number, categoryId?: string) => void;
}) {
  const tally = session.definition.tally!;
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [customCategory, setCustomCategory] = useState<string | undefined>();

  function submitCustom(playerId: string, sign: 1 | -1) {
    const n = parseInt(customAmount, 10);
    if (Number.isNaN(n) || n === 0) return;
    onAdd(playerId, sign * Math.abs(n), customCategory);
    setCustomAmount("");
  }

  return (
    <div className="grid gap-3">
      {session.playerIds.map((pid) => {
        const entry = session.entries[pid];
        const open = openFor === pid;
        const lastEvent = entry.tallyEvents[entry.tallyEvents.length - 1];
        return (
          <div key={pid} className="bg-card border border-edge rounded-2xl p-3">
            <div className="flex items-center gap-3 mb-2">
              <span
                className="w-3 h-10 rounded-full shrink-0"
                style={{ backgroundColor: session.playerColors[pid] }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-lg font-bold truncate">
                  {session.playerNames[pid]}
                </div>
                {lastEvent && (
                  <div className="text-xs text-ink-dim">
                    last: {lastEvent.amount > 0 ? "+" : ""}
                    {lastEvent.amount}
                    {lastEvent.categoryId &&
                      ` ${tally.categories?.find((c) => c.id === lastEvent.categoryId)?.label ?? ""}`}
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold tabular-nums shrink-0">
                {tallyTotal(entry)}
              </div>
            </div>

            <div className="flex gap-2">
              {tally.quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => onAdd(pid, amount)}
                  className="flex-1 bg-card-raised border border-edge rounded-xl py-3 font-bold text-lg active:bg-edge"
                >
                  +{amount}
                </button>
              ))}
              <button
                onClick={() => setOpenFor(open ? null : pid)}
                className={`flex-1 rounded-xl py-3 font-bold text-lg border ${
                  open
                    ? "bg-accent text-black border-accent"
                    : "bg-card-raised border-edge active:bg-edge"
                }`}
                aria-label="Custom amount"
              >
                ⋯
              </button>
            </div>

            {open && (
              <div className="mt-2 border-t border-edge pt-2">
                {tally.categories && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {tally.categories.map((cat) => {
                      const on = customCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setCustomCategory(on ? undefined : cat.id)}
                          className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                            on ? "text-black border-transparent" : "border-edge text-ink-dim"
                          }`}
                          style={on ? { backgroundColor: cat.color } : undefined}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    inputMode="numeric"
                    value={customAmount}
                    placeholder="Points"
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="flex-1 min-w-0 bg-card-raised border border-edge rounded-xl px-3 py-3 text-center font-semibold outline-none focus:border-accent"
                  />
                  <button
                    onClick={() => submitCustom(pid, -1)}
                    className="w-16 bg-card-raised border border-edge rounded-xl font-bold text-lg active:bg-edge"
                  >
                    −
                  </button>
                  <button
                    onClick={() => submitCustom(pid, 1)}
                    className="w-20 bg-accent text-black rounded-xl font-bold text-lg active:scale-95"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
