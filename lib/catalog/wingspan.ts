import type { GameDefinition } from '../engine/types';

/** Wingspan — end-game fill-in; eggs/food/tucked cards are 1 point each. */
export const wingspan: GameDefinition = {
  id: 'wingspan',
  name: 'Wingspan',
  version: 1,
  minPlayers: 1,
  maxPlayers: 5,
  mode: 'endgame',
  fields: [
    {
      kind: 'number',
      id: 'birds',
      label: 'Birds',
      color: '#38bdf8',
      hint: 'Total points on bird cards',
    },
    {
      kind: 'number',
      id: 'bonusCards',
      label: 'Bonus cards',
      shortLabel: 'Bonus',
      color: '#a78bfa',
    },
    {
      kind: 'number',
      id: 'roundGoals',
      label: 'Round goals',
      shortLabel: 'Goals',
      color: '#f59e0b',
    },
    {
      kind: 'number',
      id: 'eggs',
      label: 'Eggs',
      color: '#fef3c7',
      hint: '1 point each',
    },
    {
      kind: 'number',
      id: 'cachedFood',
      label: 'Cached food',
      shortLabel: 'Food',
      color: '#fb923c',
      hint: '1 point each',
    },
    {
      kind: 'number',
      id: 'tuckedCards',
      label: 'Tucked cards',
      shortLabel: 'Tucked',
      color: '#4ade80',
      hint: '1 point each',
    },
  ],
  expansions: [],
};
