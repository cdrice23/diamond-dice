alter table friend_requests enable row level security;

create policy "select_own_friend_requests"
  on friend_requests for select
  to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

create policy "insert_own_friend_requests"
  on friend_requests for insert
  to authenticated
  with check (sender_id = auth.uid());

create policy "update_received_friend_requests"
  on friend_requests for update
  to authenticated
  using (receiver_id = auth.uid() and status = 'pending')
  with check (receiver_id = auth.uid());

create policy "delete_own_pending_friend_requests"
  on friend_requests for delete
  to authenticated
  using (sender_id = auth.uid() and status = 'pending');