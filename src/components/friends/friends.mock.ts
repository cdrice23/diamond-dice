import type { FriendSummary, PendingRequestSummary } from './friends.types';
import type { FriendSearchResult } from './hooks/use-friend-search.hook';

export const USE_MOCK_FRIENDS_DATA = true;

export const MOCK_FRIENDS: FriendSummary[] = [
  { profileId: 'mock-friend-1', username: 'ortiz_slugger', displayName: 'Big Papi Ortiz' },
  { profileId: 'mock-friend-2', username: 'gritty_gwynn', displayName: 'Tony G.' },
  { profileId: 'mock-friend-3', username: 'k_rod_closer', displayName: 'Frankie R.' },
  { profileId: 'mock-friend-4', username: 'diamond_dana', displayName: 'Dana Kowalski' },
  { profileId: 'mock-friend-5', username: 'bullpen_ben', displayName: 'Ben Alvarez' },
  { profileId: 'mock-friend-6', username: 'seventh_inning_sam', displayName: 'Sam Whitfield' },
  { profileId: 'mock-friend-7', username: 'cleanup_carla', displayName: 'Carla Nguyen' },
  { profileId: 'mock-friend-8', username: 'switch_hitter_hank', displayName: 'Hank Delgado' },
];

export const MOCK_PENDING_INCOMING: PendingRequestSummary[] = [
  {
    friendRequestId: 'mock-pending-in-1',
    profileId: 'mock-profile-in-1',
    username: 'rookie_rosa',
    displayName: 'Rosa Jimenez',
    direction: 'incoming',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    friendRequestId: 'mock-pending-in-2',
    profileId: 'mock-profile-in-2',
    username: 'lefty_lou',
    displayName: 'Lou Martinez',
    direction: 'incoming',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
  {
    friendRequestId: 'mock-pending-in-3',
    profileId: 'mock-profile-in-3',
    username: 'walkoff_wendy',
    displayName: 'Wendy Park',
    direction: 'incoming',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
  },
  {
    friendRequestId: 'mock-pending-in-4',
    profileId: 'mock-profile-in-4',
    username: 'sac_fly_steve',
    displayName: 'Steve Okafor',
    direction: 'incoming',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 75).toISOString(),
  },
  {
    friendRequestId: 'mock-pending-in-5',
    profileId: 'mock-profile-in-5',
    username: 'pinch_hit_priya',
    displayName: 'Priya Chandra',
    direction: 'incoming',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 100).toISOString(),
  },
];

export const MOCK_PENDING_OUTGOING: PendingRequestSummary[] = [
  {
    friendRequestId: 'mock-pending-out-1',
    profileId: 'mock-profile-out-1',
    username: 'bunt_master_bea',
    displayName: 'Bea Thornton',
    direction: 'outgoing',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    friendRequestId: 'mock-pending-out-2',
    profileId: 'mock-profile-out-2',
    username: 'foul_ball_finn',
    displayName: 'Finn O\'Rourke',
    direction: 'outgoing',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
];

export const MOCK_SEARCH_RESULTS: FriendSearchResult[] = [
  {
    profileId: 'mock-search-1',
    username: 'ortiz_slugger',
    displayName: 'Big Papi Ortiz',
    relationshipStatus: 'friends',
    friendRequestId: null,
  },
  {
    profileId: 'mock-search-2',
    username: 'rookie_rosa',
    displayName: 'Rosa Jimenez',
    relationshipStatus: 'pending_received',
    friendRequestId: 'mock-pending-in-1',
  },
  {
    profileId: 'mock-search-3',
    username: 'bunt_master_bea',
    displayName: 'Bea Thornton',
    relationshipStatus: 'pending_sent',
    friendRequestId: 'mock-pending-out-1',
  },
  {
    profileId: 'mock-search-4',
    username: 'no_relation_nate',
    displayName: 'Nate Ferreira',
    relationshipStatus: 'none',
    friendRequestId: null,
  },
];

export const MOCK_ONLINE_PROFILE_IDS = new Set<string>([
  'mock-friend-1',
  'mock-friend-4',
  'mock-friend-7',
]);