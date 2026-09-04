create or replace function get_pending_requests()
returns table (
  friend_request_id uuid,
  profile_id uuid,
  username text,
  display_name text,
  direction text,
  created_at timestamptz
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
    case when fr.sender_id = auth.uid() then 'outgoing' else 'incoming' end as direction,
    fr.created_at
  from friend_requests fr
  join profiles p
    on p.id = case
      when fr.sender_id = auth.uid() then fr.receiver_id
      else fr.sender_id
    end
  where fr.status = 'pending'
    and (fr.sender_id = auth.uid() or fr.receiver_id = auth.uid())
    and p.status = 'active'
  order by fr.created_at desc;
$$;

grant execute on function get_pending_requests() to authenticated;