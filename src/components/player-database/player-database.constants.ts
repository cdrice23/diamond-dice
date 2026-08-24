import { AwardGroup, PlayerDatabaseFilters } from "./player-database.types";

export const AWARD_GROUPS: AwardGroup[] = [
  { label: 'Hall of Fame', externalIds: ['MLBHOF'], magnitudeRank: 1, tier: 'level3' },
  { label: 'MVP', externalIds: ['ALMVP', 'NLMVP', 'ALCHALM', 'NLCHALM', 'ALAWARD', 'NLAWARD'], magnitudeRank: 2, tier: 'level3' },
  { label: 'Cy Young', externalIds: ['ALCY', 'NLCY', 'MLBCY'], magnitudeRank: 3, tier: 'level3' },
  { label: 'World Series MVP', externalIds: ['WSMVP'], magnitudeRank: 4, tier: 'level3' },
  { label: 'Rookie of the Year', externalIds: ['ALROY', 'NLROY', 'MLBROY'], magnitudeRank: 5, tier: 'level3' },
  { label: 'Hank Aaron Award', externalIds: ['ALHAA', 'NLHAA'], magnitudeRank: 6, tier: 'level3' },
  { label: 'Comeback Player of the Year', externalIds: ['ALCPOY', 'NLCPOY'], magnitudeRank: 7, tier: 'level3' },
  { label: 'Platinum Glove', externalIds: ['ALPG', 'NLPG'], magnitudeRank: 8, tier: 'level2' },
  { label: 'Gold Glove', externalIds: ['ALGG', 'NLGG'], magnitudeRank: 9, tier: 'level2' },
  { label: 'Silver Slugger', externalIds: ['ALSS', 'NLSS'], magnitudeRank: 10, tier: 'level2' },
  { label: 'All-MLB Team', externalIds: ['MLBAFIRST', 'MLBSECOND'], magnitudeRank: 11, tier: 'level1' },
];

export const DEFAULT_FILTERS: PlayerDatabaseFilters = {
  playerType: null,
  ratingLevels: [1, 2, 3],
  positions: [],
  isRostered: false,
  debutYearFrom: null,
  debutYearTo: null,
  teamIds: [],
  awardGroupLabels: [],
};

export const DEBUT_YEAR_FLOOR = 1901;
export const DEBUT_YEAR_CEILING = new Date().getFullYear();

export const NEUTRAL_FILTER_COLOR = { light: '#1E2D3F', dark: '#374555' } as const;
export const NEUTRAL_FILTER_COLOR_MUTED = {
  light: 'rgba(30, 45, 63, 0.12)',
  dark: 'rgba(55, 69, 85, 0.3)',
} as const;