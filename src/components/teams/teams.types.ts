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
  roster_preview: TeamRosterPreviewPlayer[]; // capped to 4 by the caller/query, not enforced here
};

export type TeamRosterPreviewPlayer = {
  id: string;
  name: string;
  image_url: string | null;
};