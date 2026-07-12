import type { GameDefinition } from '../engine/types';

/** Dominion — end-game deck count: victory cards minus curses. */
export const dominion: GameDefinition = {
  id: 'dominion',
  name: 'Dominion',
  version: 1,
  minPlayers: 2,
  maxPlayers: 4,
  mode: 'endgame',
  fields: [
    {
      kind: 'number',
      id: 'estates',
      label: 'Estates',
      color: '#4ade80',
      hint: '1 point each',
    },
    {
      kind: 'number',
      id: 'duchies',
      label: 'Duchies',
      color: '#38bdf8',
      hint: '3 points each',
      score: { points: 3, per: 1 },
    },
    {
      kind: 'number',
      id: 'provinces',
      label: 'Provinces',
      color: '#f59e0b',
      hint: '6 points each',
      score: { points: 6, per: 1 },
    },
    {
      kind: 'number',
      id: 'curses',
      label: 'Curses',
      color: '#f87171',
      hint: '-1 point each',
      score: { points: -1, per: 1 },
    },
    {
      kind: 'number',
      id: 'otherVp',
      label: 'Other victory points',
      shortLabel: 'Other',
      color: '#a78bfa',
      hint: 'Gardens and other variable cards',
    },
  ],
  expansions: [],
};
