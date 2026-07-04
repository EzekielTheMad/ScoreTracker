import type { GameDefinition } from '../engine/types';

/**
 * Lords of Waterdeep — hybrid: the VP track runs as a live tally during
 * play, then end-game bonuses are filled in. Scoundrels of Skullport adds
 * the corruption penalty (calculator is a STUB — see calculators.ts) and
 * a sixth player.
 */
export const waterdeep: GameDefinition = {
  id: 'waterdeep',
  name: 'Lords of Waterdeep',
  version: 1,
  minPlayers: 2,
  maxPlayers: 5,
  mode: 'hybrid',
  tally: {
    quickAmounts: [1, 2, 5, 10],
    categories: [
      { id: 'quest', label: 'Quest', color: '#a78bfa' },
      { id: 'building', label: 'Building', color: '#fb923c' },
    ],
  },
  fields: [
    {
      kind: 'number',
      id: 'lord',
      label: 'Lord card',
      color: '#a78bfa',
      hint: 'Bonus points from your Lord',
    },
    {
      kind: 'number',
      id: 'gold',
      label: 'Leftover gold',
      shortLabel: 'Gold',
      color: '#eab308',
      hint: '1 point per 2 gold',
      score: { points: 1, per: 2 },
    },
    {
      kind: 'number',
      id: 'adventurers',
      label: 'Leftover adventurers',
      shortLabel: 'Advent.',
      color: '#4ade80',
      hint: '1 point each',
    },
  ],
  expansions: [
    {
      id: 'skullport',
      name: 'Scoundrels of Skullport',
      version: 1,
      maxPlayers: 6,
      addFields: [
        {
          kind: 'calculated',
          id: 'corruption',
          label: 'Corruption',
          color: '#b91c1c',
          hint: 'STUB: −1 per token — verify vs rulebook',
          inputs: [{ id: 'tokens', label: 'Tokens' }],
          calculator: 'skullport-corruption',
          unverified: true,
        },
      ],
    },
  ],
};
