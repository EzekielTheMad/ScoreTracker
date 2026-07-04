/** Palette assigned round-robin to new player profiles. */
export const PLAYER_COLORS = [
  "#f59e0b",
  "#38bdf8",
  "#f472b6",
  "#4ade80",
  "#a78bfa",
  "#fb923c",
  "#f87171",
  "#2dd4bf",
] as const;

export function nextPlayerColor(existingCount: number): string {
  return PLAYER_COLORS[existingCount % PLAYER_COLORS.length];
}
