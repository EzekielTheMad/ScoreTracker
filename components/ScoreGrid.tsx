"use client";

import { NumCell } from "./NumCell";
import { computeScore, scoreField } from "@/lib/engine/score";
import type { Session } from "@/lib/db/db";

/**
 * End-game score sheet: fields as rows, players as columns, horizontal
 * scroll with a sticky label column so 4+ player games stay usable on a
 * phone. Calculated fields render one sub-row per input plus a points row.
 */
export function ScoreGrid({
  session,
  onSetValue,
  onSetCalcInput,
}: {
  session: Session;
  onSetValue: (playerId: string, fieldId: string, value: number | undefined) => void;
  onSetCalcInput: (
    playerId: string,
    fieldId: string,
    inputId: string,
    value: number | undefined,
  ) => void;
}) {
  const { definition: def, playerIds, entries } = session;
  const totals = Object.fromEntries(
    playerIds.map((id) => [id, computeScore(def, entries[id]).total]),
  );

  const labelCell =
    "sticky left-0 z-10 bg-surface pr-2 py-2 text-left align-top min-w-28 max-w-32";
  const playerCell = "px-1 py-2 min-w-24 align-top";

  return (
    <div className="overflow-x-auto pb-2">
      <table className="border-separate border-spacing-0 w-full">
        <thead>
          <tr>
            <th className={`${labelCell} top-0 z-20`} />
            {playerIds.map((pid) => (
              <th key={pid} className={playerCell}>
                <div
                  className="rounded-lg py-1.5 px-1 text-black font-bold text-sm truncate"
                  style={{ backgroundColor: session.playerColors[pid] }}
                >
                  {session.playerNames[pid]}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {def.fields.map((field) => (
            <tr key={field.id} className="border-t border-edge">
              <th className={labelCell}>
                <div
                  className="font-semibold text-sm leading-tight"
                  style={{ color: field.color }}
                >
                  {field.shortLabel ?? field.label}
                  {field.kind === "calculated" && field.unverified && (
                    <span title="Formula not verified against the rulebook"> ⚠️</span>
                  )}
                </div>
                {field.hint && (
                  <div className="text-[11px] text-ink-dim leading-tight mt-0.5">
                    {field.hint}
                  </div>
                )}
              </th>
              {playerIds.map((pid) => {
                const entry = entries[pid];
                if (field.kind === "number") {
                  return (
                    <td key={pid} className={playerCell}>
                      <NumCell
                        value={entry.values[field.id]}
                        allowNegative={field.allowNegative}
                        onChange={(v) => onSetValue(pid, field.id, v)}
                      />
                      {field.score && (
                        <div className="text-center text-xs text-ink-dim mt-1">
                          = {scoreField(field, entry)} pts
                        </div>
                      )}
                    </td>
                  );
                }
                return (
                  <td key={pid} className={playerCell}>
                    <div className="grid gap-1">
                      {field.inputs.map((input) => (
                        <div key={input.id} className="flex items-center gap-1">
                          <span className="text-[10px] text-ink-dim w-12 shrink-0 truncate">
                            {input.label}
                          </span>
                          <NumCell
                            compact
                            value={entry.calcInputs[field.id]?.[input.id]}
                            onChange={(v) => onSetCalcInput(pid, field.id, input.id, v)}
                          />
                        </div>
                      ))}
                      <div className="text-center text-xs font-bold" style={{ color: field.color }}>
                        = {scoreField(field, entry)} pts
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
          <tr>
            <th className={`${labelCell} text-base font-bold`}>Total</th>
            {playerIds.map((pid) => (
              <td key={pid} className={`${playerCell} text-center`}>
                <div className="text-xl font-bold tabular-nums">{totals[pid]}</div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
