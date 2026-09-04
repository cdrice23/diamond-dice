export type FriendSummary = {
  profileId: string;
  username: string;
  displayName: string;
};

export type PendingRequestSummary = {
  friendRequestId: string;
  profileId: string;
  username: string;
  displayName: string;
  direction: 'incoming' | 'outgoing';
  createdAt: string;
};