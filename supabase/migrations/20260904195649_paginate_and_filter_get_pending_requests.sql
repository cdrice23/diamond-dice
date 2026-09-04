drop function if exists get_pending_requests();

create or replace function get_pending_requests(
  p_direction text default null,
  p_page_limit int default 20,
  p_page_offset int default 0
)
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
    and (
      p_direction is null
      or (p_direction = 'incoming' and fr.receiver_id = auth.uid())
      or (p_direction = 'outgoing' and fr.sender_id = auth.uid())
    )
  order by fr.created_at desc
  limit p_page_limit
  offset p_page_offset;
$$;

grant execute on function get_pending_requests(text, int, int) to authenticated;