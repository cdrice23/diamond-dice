drop index if exists friend_requests_pending_pair_unique;

create unique index friend_requests_pending_pair_symmetric_unique
  on friend_requests (least(sender_id, receiver_id), greatest(sender_id, receiver_id))
  where status = 'pending';