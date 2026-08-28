import type { TeamSummary } from './teams.types';

const AARON_JUDGE_IMAGE_URL =
  'https://img.mlbstatic.com/mlb-photos/image/upload/w_213,d_people:generic:headshot:67:current.png,q_auto:best,f_auto/v1/people/592450/headshot/67/current';

const YAMAMOTO_IMAGE_URL =
  'https://img.mlbstatic.com/mlb-photos/image/upload/w_213,d_people:generic:headshot:67:current.png,q_auto:best,f_auto/v1/people/808967/headshot/67/current';

export const MOCK_TEAMS: TeamSummary[] = [
  {
    id: '1',
    team_name: 'Riverside Ramblers',
    home_field_name: 'Elm Street Diamond',
    team_theme_color_primary: '#1F3B57',
    team_theme_color_secondary: '#D9A441',
    format_name: 'Standard',
    updated_at: '2026-08-25T14:30:00Z',
    last_played_at: '2026-08-20T18:00:00Z',
    wins: 7,
    losses: 3,
    roster_preview: [
      { id: 'p1', name: 'Aaron Judge', image_url: AARON_JUDGE_IMAGE_URL },
      { id: 'p2', name: 'Yoshinobu Yamamoto', image_url: YAMAMOTO_IMAGE_URL },
      { id: 'p3', name: 'Shohei Ohtani', image_url: null },
      { id: 'p4', name: 'Freddie Freeman', image_url: null },
    ],
  },
  {
    id: '2',
    team_name: 'Sandlot Renegades',
    home_field_name: 'Backyard Bullpen',
    team_theme_color_primary: '#7A2E2E',
    team_theme_color_secondary: '#EDEDED',
    format_name: 'Sandlot',
    updated_at: '2026-08-22T09:15:00Z',
    last_played_at: null,
    wins: 0,
    losses: 0,
    roster_preview: [
      { id: 'p1', name: 'Aaron Judge', image_url: AARON_JUDGE_IMAGE_URL },
      { id: 'p5', name: 'Freddie Freeman', image_url: null },
    ],
  },
  {
    id: '3',
    team_name: 'Bullpen Brigade',
    home_field_name: "Murphy's Yard",
    team_theme_color_primary: '#3B6D11',
    team_theme_color_secondary: '#3B6D11',
    format_name: 'Bullpen',
    updated_at: '2026-08-10T20:00:00Z',
    last_played_at: '2025-08-11T15:00:00Z',
    wins: 2,
    losses: 5,
    roster_preview: [
      { id: 'p2', name: 'Yoshinobu Yamamoto', image_url: YAMAMOTO_IMAGE_URL },
      { id: 'p6', name: 'Corbin Burnes', image_url: null },
    ],
  },
];