import type { GameDefinition } from '../engine/types';

/** Catan — end-game victory point count; extension raises to 6 players. */
export const catan: GameDefinition = {
  id: 'catan',
  name: 'Catan',
  version: 1,
  minPlayers: 3,
  maxPlayers: 4,
  mode: 'endgame',
  fields: [
    {
      kind: 'number',
      id: 'settlements',
      label: 'Settlements',
      shortLabel: 'Settle',
      color: '#4ade80',
      hint: '1 point each',
    },
    {
      kind: 'number',
      id: 'cities',
      label: 'Cities',
      color: '#38bdf8',
      hint: '2 points each',
      score: { points: 2, per: 1 },
    },
    {
      kind: 'number',
      id: 'vpCards',
      label: 'Victory point cards',
      shortLabel: 'VP cards',
      color: '#a78bfa',
    },
    {
      kind: 'number',
      id: 'longestRoad',
      label: 'Longest road',
      shortLabel: 'Road',
      color: '#f59e0b',
      hint: '2 if you hold it, else 0',
    },
    {
      kind: 'number',
      id: 'largestArmy',
      label: 'Largest army',
      shortLabel: 'Army',
      color: '#f87171',
      hint: '2 if you hold it, else 0',
    },
  ],
  expansions: [
    {
      id: 'catan-5-6',
      name: '5–6 Player Extension',
      version: 1,
      maxPlayers: 6,
    },
  ],
};
