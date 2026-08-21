import { AwardGroup, PlayerDatabaseFilters } from "./player-database.types";

export const AWARD_GROUPS: AwardGroup[] = [
  { label: 'MVP', externalIds: ['ALMVP', 'NLMVP', 'ALCHALM', 'NLCHALM', 'ALAWARD', 'NLAWARD'] },
  { label: 'Cy Young', externalIds: ['ALCY', 'NLCY', 'MLBCY'] },
  { label: 'Rookie of the Year', externalIds: ['ALROY', 'NLROY', 'MLBROY'] },
  { label: 'Gold Glove', externalIds: ['ALGG', 'NLGG'] },
  { label: 'Silver Slugger', externalIds: ['ALSS', 'NLSS'] },
  { label: 'Hank Aaron Award', externalIds: ['ALHAA', 'NLHAA'] },
  { label: 'Comeback Player of the Year', externalIds: ['ALCPOY', 'NLCPOY'] },
  { label: 'World Series MVP', externalIds: ['WSMVP'] },
  { label: 'Hall of Fame', externalIds: ['MLBHOF'] },
  { label: 'Platinum Glove', externalIds: ['ALPG', 'NLPG'] },
  { label: 'All-MLB Team', externalIds: ['MLBAFIRST', 'MLBSECOND'] },
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