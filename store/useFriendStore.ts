/**
 * store/useFriendStore.ts
 * ───────────────────────
 * Friends list, friend requests, user search.
 */

import { create } from "zustand";
import { ApiFriendRequest, ApiFriendship, friendsApi } from "../lib/api";

type FriendState = {
  friends: ApiFriendship[];
  received: ApiFriendRequest[];
  sent: ApiFriendRequest[];
  loading: boolean;
  error: string | null;

  fetchFriends: () => Promise<void>;
  fetchRequests: () => Promise<void>;
  sendRequest: (userId: string) => Promise<boolean>;
  acceptRequest: (friendshipId: string) => Promise<boolean>;
  removeFriend: (friendshipId: string) => Promise<boolean>;

  reset: () => void;
};

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: [],
  received: [],
  sent: [],
  loading: false,
  error: null,

  fetchFriends: async () => {
    set({ loading: true, error: null });
    const res = await friendsApi.list();
    if (res.ok) {
      set({ friends: res.data.friends, loading: false });
    } else {
      set({ loading: false, error: res.error });
    }
  },

  fetchRequests: async () => {
    const res = await friendsApi.requests();
    if (res.ok) {
      set({ received: res.data.received, sent: res.data.sent });
    }
  },

  sendRequest: async (userId) => {
    const res = await friendsApi.send(userId);
    if (res.ok) {
      await get().fetchFriends();
      await get().fetchRequests();
      return true;
    }
    return false;
  },

  acceptRequest: async (friendshipId) => {
    const res = await friendsApi.accept(friendshipId);
    if (res.ok) {
      await get().fetchFriends();
      await get().fetchRequests();
      return true;
    }
    return false;
  },

  removeFriend: async (friendshipId) => {
    const res = await friendsApi.remove(friendshipId);
    if (res.ok) {
      set((s) => ({
        friends: s.friends.filter((f) => f.friendshipId !== friendshipId),
        sent:     s.sent.filter((r) => r.friendshipId !== friendshipId),
        received: s.received.filter((r) => r.friendshipId !== friendshipId),
      }));
      return true;
    }
    return false;
  },

  reset: () => set({ friends: [], received: [], sent: [], loading: false, error: null }),
}));