export type AwardGroup = {
  label: string;
  externalIds: string[];
};

export type PlayerType = 'batter' | 'pitcher' | null;

export type PlayerDatabaseFilters = {
  playerType: PlayerType;
  ratingLevels: (1 | 2 | 3)[];
  positions: Position[];
  isRostered: boolean;
  debutYearFrom: number | null;
  debutYearTo: number | null;
  teamIds: string[];
  awardGroupLabels: string[];
};

export const POSITIONS = ['C', '1B', '2B', 'SS', '3B', 'OF', 'DH', 'P'] as const;
export type Position = (typeof POSITIONS)[number];

export type EffectiveRoles = {
  isEffectiveBatter: boolean;
  isEffectivePitcher: boolean;
  isTwoWay: boolean;
};