create or replace function get_pending_incoming_count()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer
  from friend_requests
  where status = 'pending'
    and receiver_id = auth.uid();
$$;

grant execute on function get_pending_incoming_count() to authenticated;