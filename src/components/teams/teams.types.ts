export type TeamRosterPreviewPlayer = {
  id: string;
  name: string;
  image_url: string | null;
};

export type BattingOrderSlot = {
  position: string;
  level: number | null;
};

export type TeamSummary = {
  id: string;
  team_name: string;
  home_field_name: string;
  team_theme_color_primary: string;
  team_theme_color_secondary: string;
  format_name: string;
  updated_at: string;
  last_played_at: string | null;
  wins: number;
  losses: number;
  roster_preview: TeamRosterPreviewPlayer[];
  position_levels: PositionLevels;
  pitcher_levels: (number | null)[];
  batting_order: BattingOrderSlot[];
};

export type PositionLevels = {
  C: number | null;
  '1B': number | null;
  '2B': number | null;
  SS: number | null;
  '3B': number | null;
  OF: (number | null)[];
};

export type TeamDetailPositionSlot = {
  position: string;
  battingOrder: number | null;
  player: TeamRosterPreviewPlayer;
  eligiblePositions: string[];
  level: number | null;
};

export type TeamDetailPitcherSlot = {
  player: TeamRosterPreviewPlayer;
  eligiblePositions: string[];
  level: number | null;
};

export type TeamDetailRecentGame = {
  gameId: string;
  playedAt: string;
  isHome: boolean;
  isWin: boolean;
  opponentName: string;
  teamScore: number;
  opponentScore: number;
};

export type TeamDetail = {
  id: string;
  team_name: string;
  home_field_name: string;
  team_theme_color_primary: string;
  team_theme_color_secondary: string;
  format_name: string;
  wins: number;
  losses: number;
  games_played: number;
  position_players: TeamDetailPositionSlot[];
  pitchers: TeamDetailPitcherSlot[];
  recent_games: TeamDetailRecentGame[];
};