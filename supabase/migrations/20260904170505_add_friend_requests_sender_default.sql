alter table friend_requests
  alter column sender_id set default auth.uid();