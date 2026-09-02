// import type { TeamSummary } from './teams.types';

// const AARON_JUDGE_IMAGE_URL =
//   'https://img.mlbstatic.com/mlb-photos/image/upload/w_213,d_people:generic:headshot:67:current.png,q_auto:best,f_auto/v1/people/592450/headshot/67/current';

// const YAMAMOTO_IMAGE_URL =
//   'https://img.mlbstatic.com/mlb-photos/image/upload/w_213,d_people:generic:headshot:67:current.png,q_auto:best,f_auto/v1/people/808967/headshot/67/current';

// function buildFullRosterPreview(prefix: string) {
//   const names = [
//     'Aaron Judge',
//     'Yoshinobu Yamamoto',
//     'Shohei Ohtani',
//     'Freddie Freeman',
//     'Mookie Betts',
//     'Corbin Burnes',
//     'Gerrit Cole',
//     'Juan Soto',
//     'Ronald Acuña Jr.',
//     'Bobby Witt Jr.',
//     'Julio Rodríguez',
//     'Spencer Strider',
//   ];

//   return names.map((name, i) => ({
//     id: `${prefix}-${i}`,
//     name,
//     image_url: i % 3 === 2 ? null : i % 2 === 0 ? AARON_JUDGE_IMAGE_URL : YAMAMOTO_IMAGE_URL,
//   }));
// }

// export const MOCK_TEAMS: TeamSummary[] = [
//   {
//     id: '1',
//     team_name: 'Riverside Ramblers',
//     home_field_name: 'Elm Street Diamond',
//     team_theme_color_primary: '#C2410C',
//     team_theme_color_secondary: '#FACC15',
//     format_name: 'Standard',
//     updated_at: '2026-08-25T14:30:00Z',
//     last_played_at: '2026-08-20T18:00:00Z',
//     wins: 7,
//     losses: 3,
//     roster_preview: buildFullRosterPreview('team1'),
//     position_levels: { C: 1, '1B': 2, '2B': 1, SS: 3, '3B': 2, OF: [3, 1, 2] },
//     pitcher_levels: [3, 2, 1],
//     batting_order: [
//       { position: 'CF', level: 3 },
//       { position: 'RF', level: 2 },
//       { position: 'DH', level: 3 },
//       { position: '1B', level: 1 },
//       { position: 'LF', level: 2 },
//       { position: '3B', level: 1 },
//       { position: 'C', level: 2 },
//       { position: '2B', level: 1 },
//       { position: 'SS', level: 1 },
//     ],
//   },
//   {
//     id: '2',
//     team_name: 'Sandlot Renegades',
//     home_field_name: 'Backyard Bullpen',
//     team_theme_color_primary: '#7A2E2E',
//     team_theme_color_secondary: '#EDEDED',
//     format_name: 'Sandlot',
//     updated_at: '2026-08-22T09:15:00Z',
//     last_played_at: '2025-11-03T21:00:00Z',
//     wins: 0,
//     losses: 0,
//     roster_preview: buildFullRosterPreview('team2').slice(0, 9),
//     position_levels: { C: 3, '1B': 1, '2B': 1, SS: 2, '3B': 3, OF: [2, 2, 3] },
//     pitcher_levels: [3, 2],
//     batting_order: [
//       { position: 'SS', level: 3 },
//       { position: '3B', level: 3 },
//       { position: 'CF', level: 2 },
//       { position: 'C', level: 2 },
//       { position: '1B', level: 1 },
//       { position: 'RF', level: 2 },
//       { position: '2B', level: 1 },
//       { position: 'LF', level: 1 },
//       { position: 'DH', level: null },
//     ],
//   },
//   {
//     id: '3',
//     team_name: 'Bullpen Brigade',
//     home_field_name: "Murphy's Yard",
//     team_theme_color_primary: '#3B6D11',
//     team_theme_color_secondary: '#3B6D11',
//     format_name: 'Bullpen',
//     updated_at: '2026-08-10T20:00:00Z',
//     last_played_at: '2026-08-11T15:00:00Z',
//     wins: 2,
//     losses: 5,
//     roster_preview: buildFullRosterPreview('team3').slice(0, 12),
//     position_levels: { C: 2, '1B': 1, '2B': 3, SS: 2, '3B': 1, OF: [1, 2, 3] },
//     pitcher_levels: [3, 3, 2, 2, 2, 1, 1, 1, 1],
//     batting_order: [
//       { position: '2B', level: 2 },
//       { position: 'C', level: 2 },
//       { position: 'SS', level: 1 },
//       { position: 'CF', level: 3 },
//       { position: '3B', level: 1 },
//       { position: 'RF', level: 2 },
//       { position: '1B', level: 1 },
//       { position: 'LF', level: 2 },
//       { position: 'DH', level: 1 },
//     ],
//   },
// ];

// // export const MOCK_TEAM_DETAIL: TeamDetail = {
// //   id: '1',
// //   team_name: 'Riverside Ramblers',
// //   home_field_name: 'Elm Street Diamond',
// //   team_theme_color_primary: '#C2410C',
// //   team_theme_color_secondary: '#FACC15',
// //   format_name: 'Standard',
// //   wins: 7,
// //   losses: 3,
// //   games_played: 10,
// //   position_players: [
// //     { position: 'C', battingOrder: 7, player: { id: 'p1', name: 'Aaron Judge', image_url: AARON_JUDGE_IMAGE_URL }, eligiblePositions: ['C'], level: 2 },
// //     { position: '1B', battingOrder: 4, player: { id: 'p2', name: 'Freddie Freeman', image_url: AARON_JUDGE_IMAGE_URL }, eligiblePositions: ['1B'], level: 2 },
// //     { position: '2B', battingOrder: 8, player: { id: 'p3', name: 'Ozzie Albies', image_url: AARON_JUDGE_IMAGE_URL }, eligiblePositions: ['2B'], level: 1 },
// //     { position: 'SS', battingOrder: 1, player: { id: 'p4', name: 'Bobby Witt Jr.', image_url: AARON_JUDGE_IMAGE_URL }, eligiblePositions: ['SS', '3B'], level: 3 },
// //     { position: '3B', battingOrder: 3, player: { id: 'p5', name: 'Mookie Betts', image_url: AARON_JUDGE_IMAGE_URL }, eligiblePositions: ['3B', 'SS', '2B'], level: 2 },
// //     { position: 'OF', battingOrder: 2, player: { id: 'p6', name: 'Shohei Ohtani', image_url: AARON_JUDGE_IMAGE_URL }, eligiblePositions: ['OF', 'P'], level: 3 },
// //     { position: 'OF', battingOrder: 5, player: { id: 'p7', name: 'Julio Rodríguez', image_url: AARON_JUDGE_IMAGE_URL }, eligiblePositions: ['OF'], level: 1 },
// //     { position: 'OF', battingOrder: 6, player: { id: 'p8', name: 'Ronald Acuña Jr.', image_url: AARON_JUDGE_IMAGE_URL }, eligiblePositions: ['OF'], level: 2 },
// //     { position: 'DH', battingOrder: 9, player: { id: 'p9', name: 'Juan Soto', image_url: AARON_JUDGE_IMAGE_URL }, eligiblePositions: ['OF'], level: 1 },
// //   ],
// //   pitchers: [
// //     { player: { id: 'p6', name: 'Shohei Ohtani', image_url: YAMAMOTO_IMAGE_URL }, eligiblePositions: ['OF', 'P'], level: 3 },
// //     { player: { id: 'p10', name: 'Yoshinobu Yamamoto', image_url: YAMAMOTO_IMAGE_URL }, eligiblePositions: ['P'], level: 2 },
// //     { player: { id: 'p11', name: 'Corbin Burnes', image_url: YAMAMOTO_IMAGE_URL }, eligiblePositions: ['P'], level: 1 },
// //   ],
// //   recent_games: [
// //     { gameId: 'g1', playedAt: '2026-08-20T18:00:00Z', isHome: true, isWin: true, opponentName: 'Bullpen Brigade', teamScore: 6, opponentScore: 3 },
// //     { gameId: 'g2', playedAt: '2026-08-15T18:00:00Z', isHome: false, isWin: false, opponentName: 'Sandlot Renegades', teamScore: 2, opponentScore: 5 },
// //     { gameId: 'g3', playedAt: '2026-08-08T18:00:00Z', isHome: true, isWin: true, opponentName: 'Bullpen Brigade', teamScore: 8, opponentScore: 4 },
// //   ],
// // };