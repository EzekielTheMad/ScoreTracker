import type { GameDefinition } from '../engine/types';

/** Splendor — end-game: prestige from development cards plus nobles. */
export const splendor: GameDefinition = {
  id: 'splendor',
  name: 'Splendor',
  version: 1,
  minPlayers: 2,
  maxPlayers: 4,
  mode: 'endgame',
  fields: [
    {
      kind: 'number',
      id: 'cards',
      label: 'Development cards',
      shortLabel: 'Cards',
      color: '#38bdf8',
      hint: 'Total prestige on your cards',
    },
    {
      kind: 'number',
      id: 'nobles',
      label: 'Nobles',
      color: '#a78bfa',
      hint: '3 points each',
      score: { points: 3, per: 1 },
    },
  ],
  expansions: [],
};
