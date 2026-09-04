import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

const CHANNEL_NAME = 'online-users';

let channel: RealtimeChannel | null = null;
let refCount = 0;
let isSubscribed = false;
let pendingSubscribeCallbacks: (() => void)[] = [];
const syncListeners = new Set<() => void>();

function ensureChannel(): RealtimeChannel {
  if (channel) return channel;

  channel = supabase.channel(CHANNEL_NAME);

  channel.on('presence', { event: 'sync' }, () => {
    syncListeners.forEach((listener) => listener());
  });

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      isSubscribed = true;
      pendingSubscribeCallbacks.forEach((callback) => callback());
      pendingSubscribeCallbacks = [];
    }
  });

  return channel;
}

export function acquirePresenceChannel(): RealtimeChannel {
  refCount += 1;
  return ensureChannel();
}

export function releasePresenceChannel(): void {
  refCount = Math.max(0, refCount - 1);

  if (refCount === 0 && channel) {
    supabase.removeChannel(channel);
    channel = null;
    isSubscribed = false;
    pendingSubscribeCallbacks = [];
    syncListeners.clear();
  }
}

export function whenPresenceSubscribed(callback: () => void): void {
  if (isSubscribed) {
    callback();
  } else {
    pendingSubscribeCallbacks.push(callback);
  }
}

export function getPresenceState(): Record<string, unknown> {
  return channel ? channel.presenceState() : {};
}

export function addPresenceSyncListener(listener: () => void): () => void {
  syncListeners.add(listener);
  return () => {
    syncListeners.delete(listener);
  };
}