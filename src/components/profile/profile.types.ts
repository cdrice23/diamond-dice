export type OverviewStats = {
  wins: number;
  losses: number;
  teamCount: number;
  friendCount: number;
};

export type RecentGameSummary = {
  gameId: string;
  playedAt: string;
  isHome: boolean;
  isWin: boolean;
  opponentName: string;
  profileScore: number;
  opponentScore: number;
};

export type MvpBatterStats = {
  playerId: string;
  totalAtBats: number;
  totalHits: number;
  totalRuns: number;
  totalRbi: number;
  totalSingles: number;
  totalDoubles: number;
  totalTriples: number;
  totalHomeRuns: number;
  totalWalks: number;
  totalConnections: number;
};

export type MvpPitcherStats = {
  playerId: string;
  totalBattersFaced: number;
  totalOutsRecorded: number;
  totalHitsAllowed: number;
  totalWalksAllowed: number;
  totalInningsPitched: number | null;
  era: number | null;
  whip: number | null;
};