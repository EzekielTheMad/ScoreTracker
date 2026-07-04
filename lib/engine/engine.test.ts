import { describe, expect, it } from 'vitest';
import { getCalculator } from './calculators';
import { resolveDefinition } from './resolve';
import { computeScore, emptyEntry, scoreField } from './score';
import { sevenWonders } from '../catalog/seven-wonders';
import type { GameDefinition, PlayerEntry } from './types';

const science = getCalculator('seven-wonders-science');

describe('seven-wonders-science calculator', () => {
  it('scores zero for no symbols', () => {
    expect(science({ gear: 0, tablet: 0, compass: 0 })).toBe(0);
  });

  it('scores n² for a single symbol type', () => {
    expect(science({ gear: 1, tablet: 0, compass: 0 })).toBe(1);
    expect(science({ gear: 3, tablet: 0, compass: 0 })).toBe(9);
    expect(science({ gear: 0, tablet: 4, compass: 0 })).toBe(16);
  });

  it('adds 7 per complete set of three different symbols', () => {
    // 1+1+1 = 3 squares + 7 for one set
    expect(science({ gear: 1, tablet: 1, compass: 1 })).toBe(10);
    // 4+4+4 squares + 14 for two sets
    expect(science({ gear: 2, tablet: 2, compass: 2 })).toBe(26);
  });

  it('scores mixed counts: a² + b² + c² + 7·min', () => {
    // 9 + 4 + 1 + 7 = 21
    expect(science({ gear: 3, tablet: 2, compass: 1 })).toBe(21);
    // 16 + 1 + 1 + 7 = 25
    expect(science({ gear: 4, tablet: 1, compass: 1 })).toBe(25);
    // 4 + 4 + 0 + 0 = 8 (no complete set)
    expect(science({ gear: 2, tablet: 2, compass: 0 })).toBe(8);
  });

  it('is symmetric in its inputs', () => {
    expect(science({ gear: 1, tablet: 2, compass: 3 })).toBe(
      science({ gear: 3, tablet: 2, compass: 1 }),
    );
  });
});

describe('scoreField', () => {
  const entry = (patch: Partial<PlayerEntry>): PlayerEntry => ({
    ...emptyEntry('p1'),
    ...patch,
  });

  it('passes plain number values through', () => {
    const field = sevenWonders.fields.find((f) => f.id === 'civic')!;
    expect(scoreField(field, entry({ values: { civic: 12 } }))).toBe(12);
  });

  it('treats missing values as 0', () => {
    const field = sevenWonders.fields.find((f) => f.id === 'civic')!;
    expect(scoreField(field, entry({}))).toBe(0);
  });

  it('applies floor(value/per)·points — 7 Wonders treasury', () => {
    const treasury = sevenWonders.fields.find((f) => f.id === 'treasury')!;
    expect(scoreField(treasury, entry({ values: { treasury: 8 } }))).toBe(2);
    expect(scoreField(treasury, entry({ values: { treasury: 9 } }))).toBe(3);
    expect(scoreField(treasury, entry({ values: { treasury: 2 } }))).toBe(0);
  });

  it('supports negative per-item points — Cities debt', () => {
    const resolved = resolveDefinition(sevenWonders, ['cities']);
    const debt = resolved.fields.find((f) => f.id === 'debt')!;
    expect(scoreField(debt, entry({ values: { debt: 3 } }))).toBe(-3);
  });

  it('feeds calculated fields from calcInputs, defaulting missing inputs to 0', () => {
    const scienceField = sevenWonders.fields.find((f) => f.id === 'science')!;
    expect(
      scoreField(
        scienceField,
        entry({ calcInputs: { science: { gear: 2, tablet: 2, compass: 2 } } }),
      ),
    ).toBe(26);
    expect(
      scoreField(scienceField, entry({ calcInputs: { science: { gear: 3 } } })),
    ).toBe(9);
    expect(scoreField(scienceField, entry({}))).toBe(0);
  });
});

describe('computeScore', () => {
  it('totals a full 7 Wonders sheet', () => {
    const def = resolveDefinition(sevenWonders, []);
    const entry: PlayerEntry = {
      playerId: 'p1',
      values: {
        military: -1,
        treasury: 7, // -> 2
        wonder: 10,
        civic: 15,
        commerce: 3,
        guilds: 5,
      },
      calcInputs: { science: { gear: 2, tablet: 1, compass: 1 } }, // 4+1+1+7 = 13
      tallyEvents: [],
    };
    const result = computeScore(def, entry);
    expect(result.perField).toEqual({
      military: -1,
      treasury: 2,
      wonder: 10,
      civic: 15,
      commerce: 3,
      guilds: 5,
      science: 13,
    });
    expect(result.total).toBe(47);
  });

  it('sums tally events into the total', () => {
    const def = resolveDefinition(sevenWonders, []);
    const entry: PlayerEntry = {
      ...emptyEntry('p1'),
      tallyEvents: [
        { id: 'a', amount: 4, at: 1 },
        { id: 'b', amount: 9, at: 2 },
        { id: 'c', amount: -2, at: 3 },
      ],
    };
    const result = computeScore(def, entry);
    expect(result.tally).toBe(11);
    expect(result.total).toBe(11);
  });
});

describe('resolveDefinition', () => {
  it('returns the base sheet with no expansions', () => {
    const resolved = resolveDefinition(sevenWonders, []);
    expect(resolved.versionKey).toBe('seven-wonders@1');
    expect(resolved.fields.map((f) => f.id)).toEqual([
      'military',
      'treasury',
      'wonder',
      'civic',
      'commerce',
      'guilds',
      'science',
    ]);
  });

  it('appends expansion columns and records identity in versionKey', () => {
    const resolved = resolveDefinition(sevenWonders, ['leaders', 'cities']);
    expect(resolved.versionKey).toBe('seven-wonders@1+leaders@1+cities@1');
    const ids = resolved.fields.map((f) => f.id);
    expect(ids).toContain('leaders');
    expect(ids).toContain('cities');
    expect(ids).toContain('debt');
  });

  it('applies patches in definition order regardless of selection order', () => {
    const a = resolveDefinition(sevenWonders, ['cities', 'leaders']);
    const b = resolveDefinition(sevenWonders, ['leaders', 'cities']);
    expect(a.versionKey).toBe(b.versionKey);
    expect(a.fields).toEqual(b.fields);
  });

  it('removes columns named in removeFieldIds', () => {
    const def: GameDefinition = {
      ...sevenWonders,
      expansions: [
        {
          id: 'no-military',
          name: 'Test',
          version: 1,
          removeFieldIds: ['military'],
        },
      ],
    };
    const resolved = resolveDefinition(def, ['no-military']);
    expect(resolved.fields.some((f) => f.id === 'military')).toBe(false);
  });

  it('rejects unknown expansion ids', () => {
    expect(() => resolveDefinition(sevenWonders, ['armada'])).toThrow(
      /Unknown expansion/,
    );
  });
});
