import { describe, expect, it } from 'vitest';
import { CATALOG } from './index';
import { validateDefinition } from '../engine/validate';

describe('bundled catalog', () => {
  it('has unique game ids', () => {
    const ids = CATALOG.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const def of CATALOG) {
    it(`${def.id} passes definition validation`, () => {
      expect(validateDefinition(def)).toEqual([]);
    });
  }
});
