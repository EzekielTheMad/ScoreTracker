import type { GameDefinition } from '../engine/types';

/**
 * Carcassonne — a running tally scored during play. No end-game fields;
 * final farm scoring goes in as tally events like everything else.
 */
export const carcassonne: GameDefinition = {
  id: 'carcassonne',
  name: 'Carcassonne',
  version: 1,
  minPlayers: 2,
  maxPlayers: 5,
  mode: 'tally',
  fields: [],
  tally: {
    quickAmounts: [1, 2, 3, 5],
    categories: [
      { id: 'road', label: 'Road', color: '#a8a29e' },
      { id: 'city', label: 'City', color: '#38bdf8' },
      { id: 'monastery', label: 'Monastery', color: '#f472b6' },
      { id: 'farm', label: 'Farm', color: '#4ade80' },
    ],
  },
  expansions: [],
};
