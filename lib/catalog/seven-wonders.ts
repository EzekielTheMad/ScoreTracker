import type { GameDefinition } from '../engine/types';

/**
 * 7 Wonders — end-game fill-in scoring. Science is a computed field:
 * a² + b² + c² + 7 × min(a, b, c) over the three symbol counts.
 */
export const sevenWonders: GameDefinition = {
  id: 'seven-wonders',
  name: '7 Wonders',
  version: 1,
  minPlayers: 2,
  maxPlayers: 7,
  mode: 'endgame',
  fields: [
    {
      kind: 'number',
      id: 'military',
      label: 'Military',
      color: '#dc2626',
      hint: 'Conflict tokens, can be negative',
      allowNegative: true,
    },
    {
      kind: 'number',
      id: 'treasury',
      label: 'Treasury',
      color: '#ca8a04',
      hint: '1 point per 3 coins',
      score: { points: 1, per: 3 },
    },
    { kind: 'number', id: 'wonder', label: 'Wonder', color: '#78716c' },
    {
      kind: 'number',
      id: 'civic',
      label: 'Civic (blue)',
      shortLabel: 'Civic',
      color: '#2563eb',
    },
    {
      kind: 'number',
      id: 'commerce',
      label: 'Commerce (yellow)',
      shortLabel: 'Commerce',
      color: '#eab308',
    },
    {
      kind: 'number',
      id: 'guilds',
      label: 'Guilds (purple)',
      shortLabel: 'Guilds',
      color: '#9333ea',
    },
    {
      kind: 'calculated',
      id: 'science',
      label: 'Science (green)',
      shortLabel: 'Science',
      color: '#16a34a',
      hint: 'Count each symbol; sets of 3 different score 7',
      inputs: [
        { id: 'gear', label: 'Gears' },
        { id: 'tablet', label: 'Tablets' },
        { id: 'compass', label: 'Compasses' },
      ],
      calculator: 'seven-wonders-science',
    },
  ],
  expansions: [
    {
      id: 'leaders',
      name: 'Leaders',
      version: 1,
      addFields: [
        {
          kind: 'number',
          id: 'leaders',
          label: 'Leaders (white)',
          shortLabel: 'Leaders',
          color: '#e5e5e5',
        },
      ],
    },
    {
      id: 'cities',
      name: 'Cities',
      version: 1,
      addFields: [
        {
          kind: 'number',
          id: 'cities',
          label: 'Cities (black)',
          shortLabel: 'Cities',
          color: '#404040',
        },
        {
          kind: 'number',
          id: 'debt',
          label: 'Debt',
          color: '#b91c1c',
          hint: '-1 point per debt token',
          score: { points: -1, per: 1 },
        },
      ],
    },
  ],
};
