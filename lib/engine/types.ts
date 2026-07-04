/**
 * Core types for the scoring engine.
 *
 * A GameDefinition is data: it declares what the score sheet looks like and
 * how each field turns entered numbers into points. Math too ugly to express
 * as data lives in named calculator functions (see calculators.ts) that
 * definitions reference by name.
 *
 * Definitions are versioned. Every recorded session snapshots the fully
 * resolved definition it was scored with, so history stays accurate when
 * definitions change later.
 */

export type ScoringMode =
  /** Scores are filled in per category when the game ends (7 Wonders). */
  | 'endgame'
  /** Points accumulate as tally events during play (Carcassonne). */
  | 'tally'
  /** Live tally during play plus end-game bonus fields (Lords of Waterdeep). */
  | 'hybrid';

/** A directly entered number. Score defaults to the value itself. */
export interface NumberFieldDef {
  kind: 'number';
  id: string;
  label: string;
  /** Short label for narrow columns. */
  shortLabel?: string;
  /** Accent color for the category (hex). */
  color?: string;
  /** Entry hint shown under the label, e.g. "1 VP per 2 gold". */
  hint?: string;
  /** Allow negative entry (e.g. 7 Wonders military defeat tokens). */
  allowNegative?: boolean;
  /**
   * Simple math-as-data: score = floor(value / per) * points.
   * Coins in 7 Wonders: { points: 1, per: 3 }. Debt tokens: { points: -1, per: 1 }.
   * Omit for score = value.
   */
  score?: { points: number; per: number };
}

/** A field whose score comes from a named calculator over several inputs. */
export interface CalculatedFieldDef {
  kind: 'calculated';
  id: string;
  label: string;
  shortLabel?: string;
  color?: string;
  hint?: string;
  inputs: { id: string; label: string }[];
  /** Name of a registered calculator (see calculators.ts). */
  calculator: string;
  /** Static parameters passed to the calculator. */
  params?: Record<string, number>;
  /**
   * The calculator's formula has not been verified against the rulebook.
   * The UI must surface this on the field and on any total that includes it.
   */
  unverified?: boolean;
}

export type FieldDef = NumberFieldDef | CalculatedFieldDef;

export interface TallyCategory {
  id: string;
  label: string;
  color?: string;
}

export interface TallyConfig {
  /** Optional labels for tally entries (Carcassonne: road, city, ...). */
  categories?: TallyCategory[];
  /** Quick-add button amounts, e.g. [1, 2, 3, 5, 10]. */
  quickAmounts: number[];
}

/** A patch applied on top of a base definition when an expansion is enabled. */
export interface ExpansionPatch {
  id: string;
  name: string;
  version: number;
  /** Fields appended to the sheet (in order). */
  addFields?: FieldDef[];
  /** Base fields removed from the sheet. */
  removeFieldIds?: string[];
  /** New player cap (Skullport raises Waterdeep to 6). */
  maxPlayers?: number;
}

export interface GameDefinition {
  id: string;
  name: string;
  version: number;
  minPlayers: number;
  maxPlayers: number;
  mode: ScoringMode;
  /** End-game fields. Empty for pure tally games. */
  fields: FieldDef[];
  tally?: TallyConfig;
  expansions: ExpansionPatch[];
}

/** A base definition with a set of expansion patches applied. */
export interface ResolvedDefinition {
  gameId: string;
  name: string;
  version: number;
  expansionIds: string[];
  /** Stable identity of exactly what was scored, e.g. "seven-wonders@1+cities@1". */
  versionKey: string;
  mode: ScoringMode;
  minPlayers: number;
  maxPlayers: number;
  fields: FieldDef[];
  tally?: TallyConfig;
}

/** One point-scoring moment during play (tally / hybrid modes). */
export interface TallyEvent {
  id: string;
  amount: number;
  categoryId?: string;
  at: number;
}

/** Everything one player entered for one session. */
export interface PlayerEntry {
  playerId: string;
  /** number-field values, keyed by field id. Missing = 0. */
  values: Record<string, number | undefined>;
  /** calculated-field inputs, keyed by field id then input id. Missing = 0. */
  calcInputs: Record<string, Record<string, number | undefined>>;
  tallyEvents: TallyEvent[];
}

export interface ScoreBreakdown {
  /** Points per end-game field, keyed by field id. */
  perField: Record<string, number>;
  /** Sum of tally events. */
  tally: number;
  total: number;
}
