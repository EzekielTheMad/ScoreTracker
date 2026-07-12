import type { GameDefinition } from '../engine/types';

/**
 * Ticket to Ride — hybrid: route points score on the track during play;
 * tickets and the longest-route bonus settle at the end.
 */
export const ticketToRide: GameDefinition = {
  id: 'ticket-to-ride',
  name: 'Ticket to Ride',
  version: 1,
  minPlayers: 2,
  maxPlayers: 5,
  mode: 'hybrid',
  tally: {
    quickAmounts: [1, 2, 4, 7],
    categories: [{ id: 'route', label: 'Route', color: '#38bdf8' }],
  },
  fields: [
    {
      kind: 'number',
      id: 'ticketsDone',
      label: 'Completed tickets',
      shortLabel: 'Tickets ✓',
      color: '#4ade80',
      hint: 'Total value of completed tickets',
    },
    {
      kind: 'number',
      id: 'ticketsFailed',
      label: 'Failed tickets',
      shortLabel: 'Tickets ✗',
      color: '#f87171',
      hint: 'Total value, subtracted',
      score: { points: -1, per: 1 },
    },
    {
      kind: 'number',
      id: 'longestRoute',
      label: 'Longest route',
      shortLabel: 'Longest',
      color: '#f59e0b',
      hint: '10 if you hold it, else 0',
    },
  ],
  expansions: [],
};
