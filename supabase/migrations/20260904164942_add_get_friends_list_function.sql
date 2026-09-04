create or replace function get_friends_list()
returns table (
  friend_request_id uuid,
  profile_id uuid,
  username text,
  display_name text,
  friends_since timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    fr.id as friend_request_id,
    p.id as profile_id,
    p.username,
    p.display_name,
    fr.resolved_at as friends_since
  from friend_requests fr
  join profiles p
    on p.id = case
      when fr.sender_id = auth.uid() then fr.receiver_id
      else fr.sender_id
    end
  where fr.status = 'accepted'
    and (fr.sender_id = auth.uid() or fr.receiver_id = auth.uid())
    and p.status = 'active'
  order by p.username;
$$;

grant execute on function get_friends_list() to authenticated;