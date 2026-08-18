import type { MvpBatterStats, MvpPitcherStats, OverviewStats, RecentGameSummary } from './profile.types';

export const MOCK_OVERVIEW_STATS: OverviewStats = {
  wins: 14,
  losses: 9,
  teamCount: 3,
  friendCount: 7,
};

export const MOCK_RECENT_GAMES: RecentGameSummary[] = [
  { gameId: 'mock-game-1', playedAt: '2026-08-12', isHome: true, isWin: true, opponentName: 'diamonddave', profileScore: 6, opponentScore: 4 },
  { gameId: 'mock-game-2', playedAt: '2026-08-09', isHome: false, isWin: false, opponentName: 'Computer', profileScore: 2, opponentScore: 5 },
  { gameId: 'mock-game-3', playedAt: '2026-08-05', isHome: true, isWin: false, opponentName: 'benchcoach22', profileScore: 5, opponentScore: 6 },
  { gameId: 'mock-game-4', playedAt: '2025-11-14', isHome: false, isWin: true, opponentName: 'slugger_sam', profileScore: 8, opponentScore: 1 },
  { gameId: 'mock-game-5', playedAt: '2026-07-29', isHome: true, isWin: true, opponentName: 'Computer', profileScore: 4, opponentScore: 2 },
];

export const MOCK_MVP_BATTER_STATS: MvpBatterStats = {
  playerId: 'adf7daaf-b2c0-4ca2-9abb-e7dc4bba7c62',
  totalAtBats: 42,
  totalHits: 19,
  totalRuns: 14,
  totalRbi: 22,
  totalSingles: 5,
  totalDoubles: 4,
  totalTriples: 1,
  totalHomeRuns: 9,
  totalWalks: 6,
  totalStrikeouts: 11,
  totalFieldedOuts: 6,
};

export const MOCK_MVP_PITCHER_STATS: MvpPitcherStats = {
  playerId: '8bcb3b8e-0325-474a-96e4-6e319b6186fc',
  totalBattersFaced: 88,
  totalOutsRecorded: 42,
  totalHitsAllowed: 32,
  totalWalksAllowed: 14,
  totalInningsPitched: null,
  era: null,
  whip: null,
};