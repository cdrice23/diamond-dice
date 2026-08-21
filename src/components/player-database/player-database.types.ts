export type PlayerListItem = {
  id: string;
  name: string;
  level: 1 | 2 | 3;
  positions: string[];
};

export type AwardGroup = {
  label: string;
  externalIds: string[];
};

export type PlayerType = 'batter' | 'pitcher' | null;

export type PlayerDatabaseFilters = {
  playerType: PlayerType;
  ratingLevels: (1 | 2 | 3)[];
  positions: string[]; 
  isRostered: boolean; 
  debutYearFrom: number | null; 
  debutYearTo: number | null; 
  teamIds: string[]; 
  awardGroupLabels: string[]; 
};