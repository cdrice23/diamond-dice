drop function if exists search_profile_for_friend(text);

create or replace function search_profile_for_friend(
  search_query text,
  p_page_limit int default 20,
  p_page_offset int default 0
)
returns table (
  profile_id uuid,
  username text,
  display_name text,
  relationship_status text,
  friend_request_id uuid
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id as profile_id,
    p.username,
    p.display_name,
    case
      when fr_out.id is not null then 'pending_sent'
      when fr_in.id is not null then 'pending_received'
      when fr_accepted.id is not null then 'friends'
      else 'none'
    end as relationship_status,
    coalesce(fr_out.id, fr_in.id, fr_accepted.id) as friend_request_id
  from profiles p
  left join friend_requests fr_out
    on fr_out.sender_id = auth.uid()
    and fr_out.receiver_id = p.id
    and fr_out.status = 'pending'
  left join friend_requests fr_in
    on fr_in.sender_id = p.id
    and fr_in.receiver_id = auth.uid()
    and fr_in.status = 'pending'
  left join friend_requests fr_accepted
    on fr_accepted.status = 'accepted'
    and (
      (fr_accepted.sender_id = auth.uid() and fr_accepted.receiver_id = p.id)
      or (fr_accepted.sender_id = p.id and fr_accepted.receiver_id = auth.uid())
    )
  where p.id != auth.uid()
    and p.status = 'active'
    and (p.username ilike search_query || '%' or p.display_name ilike search_query || '%')
  order by p.username
  limit p_page_limit
  offset p_page_offset;
$$;

grant execute on function search_profile_for_friend(text, int, int) to authenticated;