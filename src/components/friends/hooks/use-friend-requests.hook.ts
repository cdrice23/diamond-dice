import { supabase } from '@/utils/supabase';

export function useFriendRequests() {
  async function sendFriendRequest(receiverId: string) {
    const { error } = await supabase
      .from('friend_requests')
      .insert({ receiver_id: receiverId });

    if (error) throw error;
  }

  async function acceptFriendRequest(friendRequestId: string) {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted', resolved_at: new Date().toISOString() })
      .eq('id', friendRequestId);

    if (error) throw error;
  }

  async function rejectFriendRequest(friendRequestId: string) {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected', resolved_at: new Date().toISOString() })
      .eq('id', friendRequestId);

    if (error) throw error;
  }

  async function withdrawFriendRequest(friendRequestId: string) {
    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .eq('id', friendRequestId);

    if (error) throw error;
  }

  return {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    withdrawFriendRequest,
  };
}