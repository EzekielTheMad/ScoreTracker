import type { GameDefinition, ResolvedDefinition } from './types';

/**
 * Apply the selected expansion patches to a base definition, in the order
 * they are declared on the definition. The result is the exact score sheet
 * a session snapshots and scores against.
 */
export function resolveDefinition(
  def: GameDefinition,
  expansionIds: string[],
): ResolvedDefinition {
  const enabled = def.expansions.filter((e) => expansionIds.includes(e.id));
  const unknown = expansionIds.filter((id) => !enabled.some((e) => e.id === id));
  if (unknown.length > 0) {
    throw new Error(`Unknown expansion(s) for ${def.id}: ${unknown.join(', ')}`);
  }

  let fields = [...def.fields];
  for (const patch of enabled) {
    if (patch.removeFieldIds) {
      fields = fields.filter((f) => !patch.removeFieldIds!.includes(f.id));
    }
    if (patch.addFields) {
      fields = [...fields, ...patch.addFields];
    }
  }

  const versionKey = [
    `${def.id}@${def.version}`,
    ...enabled.map((e) => `${e.id}@${e.version}`),
  ].join('+');

  return {
    gameId: def.id,
    name: def.name,
    version: def.version,
    expansionIds: enabled.map((e) => e.id),
    versionKey,
    mode: def.mode,
    minPlayers: def.minPlayers,
    maxPlayers: def.maxPlayers,
    fields,
    tally: def.tally,
  };
}
