import type { GameDefinition } from '../engine/types';

/**
 * Azul — hybrid: tile placements (and floor penalties) score on the
 * track during play; completed rows/columns/colors are end-game bonuses.
 */
export const azul: GameDefinition = {
  id: 'azul',
  name: 'Azul',
  version: 1,
  minPlayers: 2,
  maxPlayers: 4,
  mode: 'hybrid',
  tally: {
    quickAmounts: [1, 2, 3, 5],
    categories: [
      { id: 'tiles', label: 'Tiles', color: '#38bdf8' },
      { id: 'floor', label: 'Floor penalty', color: '#f87171' },
    ],
  },
  fields: [
    {
      kind: 'number',
      id: 'rows',
      label: 'Complete rows',
      shortLabel: 'Rows',
      color: '#38bdf8',
      hint: '2 points each',
      score: { points: 2, per: 1 },
    },
    {
      kind: 'number',
      id: 'columns',
      label: 'Complete columns',
      shortLabel: 'Columns',
      color: '#a78bfa',
      hint: '7 points each',
      score: { points: 7, per: 1 },
    },
    {
      kind: 'number',
      id: 'colors',
      label: 'Complete colors',
      shortLabel: 'Colors',
      color: '#f59e0b',
      hint: '10 points each (all 5 tiles)',
      score: { points: 10, per: 1 },
    },
  ],
  expansions: [],
};
