import { getCalculator } from './calculators';
import { resolveDefinition } from './resolve';
import type { GameDefinition } from './types';

/**
 * Structural checks for a game definition. Used by the catalog test (so
 * a bad bundled definition fails CI) and by the custom game builder (so
 * a bad user definition never reaches the database).
 */
export function validateDefinition(def: GameDefinition): string[] {
  const errors: string[] = [];
  const err = (msg: string) => errors.push(`${def.id || '(no id)'}: ${msg}`);

  if (!def.id) err('missing id');
  if (!def.name.trim()) err('missing name');
  if (def.version < 1) err('version must be >= 1');
  if (def.minPlayers < 1) err('minPlayers must be >= 1');
  if (def.maxPlayers < def.minPlayers) err('maxPlayers below minPlayers');

  const needsTally = def.mode !== 'endgame';
  if (needsTally) {
    if (!def.tally) err(`mode "${def.mode}" requires a tally config`);
    else {
      if (def.tally.quickAmounts.length === 0) err('tally.quickAmounts is empty');
      if (def.tally.quickAmounts.some((n) => !Number.isInteger(n) || n === 0))
        err('tally.quickAmounts must be non-zero integers');
      const catIds = (def.tally.categories ?? []).map((c) => c.id);
      if (new Set(catIds).size !== catIds.length) err('duplicate tally category ids');
      if ((def.tally.categories ?? []).some((c) => !c.label.trim()))
        err('tally category with empty label');
    }
  }
  if (def.mode === 'endgame' && def.fields.length === 0)
    err('endgame mode with no fields');

  const expansionIds = def.expansions.map((e) => e.id);
  if (new Set(expansionIds).size !== expansionIds.length)
    err('duplicate expansion ids');
  for (const exp of def.expansions) {
    const baseFieldIds = new Set(def.fields.map((f) => f.id));
    for (const removed of exp.removeFieldIds ?? []) {
      if (!baseFieldIds.has(removed))
        err(`expansion "${exp.id}" removes unknown field "${removed}"`);
    }
    if (exp.maxPlayers !== undefined && exp.maxPlayers < def.minPlayers)
      err(`expansion "${exp.id}" maxPlayers below minPlayers`);
  }

  // Check the field set of every expansion combination (patches can
  // collide with each other, not just with the base sheet).
  for (const combo of expansionCombos(expansionIds)) {
    let fields: GameDefinition['fields'];
    try {
      fields = resolveDefinition(def, combo).fields;
    } catch (e) {
      err(`resolve failed for [${combo.join(', ')}]: ${e instanceof Error ? e.message : e}`);
      continue;
    }
    const ids = fields.map((f) => f.id);
    if (new Set(ids).size !== ids.length)
      err(`duplicate field ids with expansions [${combo.join(', ')}]`);
    for (const field of fields) {
      if (!field.label.trim()) err(`field "${field.id}" has empty label`);
      if (field.kind === 'number') {
        if (field.score && field.score.per < 1)
          err(`field "${field.id}" score.per must be >= 1`);
      } else {
        if (field.inputs.length === 0) err(`field "${field.id}" has no inputs`);
        const inputIds = field.inputs.map((i) => i.id);
        if (new Set(inputIds).size !== inputIds.length)
          err(`field "${field.id}" has duplicate input ids`);
        try {
          getCalculator(field.calculator);
        } catch {
          err(`field "${field.id}" uses unregistered calculator "${field.calculator}"`);
        }
      }
    }
  }

  return errors;
}

function expansionCombos(ids: string[]): string[][] {
  // All subsets — expansion counts are tiny (0-3 per game).
  const combos: string[][] = [[]];
  for (const id of ids) {
    combos.push(...combos.map((c) => [...c, id]));
  }
  return combos;
}
