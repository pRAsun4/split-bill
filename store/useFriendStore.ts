/**
 * store/useFriendStore.ts
 * ───────────────────────
 * Manages the friends system:
 *  - Friend list (accepted)
 *  - Incoming / outgoing friend requests
 *  - User search (to add new friends or group members)
 *  - Send / accept / remove friendship
 *
 * Call useFriendStore.init() once after login (from useAuthStore).
 */

import { create } from "zustand";
import {
    ApiFriendRequest,
    ApiFriendship,
    ApiUser,
    friendsApi,
    usersApi,
} from "../lib/api";

// ─── Local display types ──────────────────────────────────────────────────────

export type Friend = {
    friendshipId: string;
    userId: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    initials: string;
    status: "accepted" | "pending";
    since?: string;
};

export type FriendRequest = {
    friendshipId: string;
    userId: string;
    name: string;
    avatarUrl: string | null;
    initials: string;
    sentAt: string;
};

export type UserSearchResult = {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    initials: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toInitials(name: string): string {
    const parts = name.trim().split(" ");
    return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.trim().slice(0, 2).toUpperCase();
}

function mapFriendship(f: ApiFriendship): Friend {
    return {
        friendshipId: f.friendshipId,
        userId: f.user.id,
        name: f.user.name,
        email: f.user.email ?? "",
        avatarUrl: f.user.avatarUrl,
        initials: toInitials(f.user.name),
        status: f.status,
        since: f.since,
    };
}

function mapRequest(r: ApiFriendRequest): FriendRequest {
    return {
        friendshipId: r.friendshipId,
        userId: r.user.id,
        name: r.user.name,
        avatarUrl: r.user.avatarUrl,
        initials: toInitials(r.user.name),
        sentAt: r.sentAt,
    };
}

function mapSearchUser(u: Pick<ApiUser, "id" | "name" | "email" | "avatarUrl">): UserSearchResult {
    return {
        id: u.id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl,
        initials: toInitials(u.name),
    };
}

// ─── Store State ──────────────────────────────────────────────────────────────

type FriendState = {
    // Friend list
    friends: Friend[];
    friendsLoading: boolean;
    friendsError: string | null;

    // Requests
    receivedRequests: FriendRequest[];
    sentRequests: FriendRequest[];
    requestsLoading: boolean;

    // User search
    searchResults: UserSearchResult[];
    searchLoading: boolean;
    searchQuery: string;

    // Per-action loading (for button spinners)
    actionLoading: Record<string, boolean>;  // key = friendshipId or userId

    // Actions
    init: () => Promise<void>;
    fetchFriends: () => Promise<void>;
    fetchRequests: () => Promise<void>;
    searchUsers: (q: string) => Promise<void>;
    clearSearch: () => void;
    sendRequest: (userId: string) => Promise<{ autoAccepted: boolean } | null>;
    acceptRequest: (friendshipId: string) => Promise<boolean>;
    removeFriend: (friendshipId: string) => Promise<boolean>;
    clearError: () => void;

    // Computed helpers
    isFriend: (userId: string) => boolean;
    hasPendingRequest: (userId: string) => boolean;
    getFriendshipId: (userId: string) => string | null;
};

// ─── Store Implementation ─────────────────────────────────────────────────────

export const useFriendStore = create<FriendState>((set, get) => ({
    friends: [],
    friendsLoading: false,
    friendsError: null,
    receivedRequests: [],
    sentRequests: [],
    requestsLoading: false,
    searchResults: [],
    searchLoading: false,
    searchQuery: "",
    actionLoading: {},

    // ── Boot ──────────────────────────────────────────────────────────────────────

    init: async () => {
        await Promise.all([get().fetchFriends(), get().fetchRequests()]);
    },

    // ── Friends List ──────────────────────────────────────────────────────────────

    fetchFriends: async () => {
        set({ friendsLoading: true, friendsError: null });
        const res = await friendsApi.list();
        if (res.ok) {
            set({
                friends: res.data.friends.map(mapFriendship),
                friendsLoading: false,
            });
        } else {
            set({ friendsLoading: false, friendsError: res.error });
        }
    },

    // ── Friend Requests ───────────────────────────────────────────────────────────

    fetchRequests: async () => {
        set({ requestsLoading: true });
        const res = await friendsApi.requests();
        if (res.ok) {
            set({
                receivedRequests: res.data.received.map(mapRequest),
                sentRequests: res.data.sent.map(mapRequest),
                requestsLoading: false,
            });
        } else {
            set({ requestsLoading: false });
        }
    },

    // ── User Search ───────────────────────────────────────────────────────────────

    searchUsers: async (q) => {
        const trimmed = q.trim();
        set({ searchQuery: trimmed });

        if (!trimmed) {
            set({ searchResults: [], searchLoading: false });
            return;
        }

        set({ searchLoading: true });
        const res = await usersApi.search(trimmed, 20);
        if (res.ok) {
            set({
                searchResults: res.data.users.map(mapSearchUser),
                searchLoading: false,
            });
        } else {
            set({ searchLoading: false, searchResults: [] });
        }
    },

    clearSearch: () => {
        set({ searchResults: [], searchQuery: "", searchLoading: false });
    },

    // ── Send Friend Request ───────────────────────────────────────────────────────

    sendRequest: async (userId) => {
        set((s) => ({ actionLoading: { ...s.actionLoading, [userId]: true } }));
        const res = await friendsApi.send(userId);
        set((s) => ({ actionLoading: { ...s.actionLoading, [userId]: false } }));

        if (res.ok) {
            if (res.data.autoAccepted) {
                // Mutual request — already friends, refresh the list
                await get().fetchFriends();
            } else {
                // Add to sentRequests optimistically — we don't have full user data here
                // so just refresh requests
                await get().fetchRequests();
            }
            return { autoAccepted: res.data.autoAccepted };
        }
        return null;
    },

    // ── Accept Friend Request ─────────────────────────────────────────────────────

    acceptRequest: async (friendshipId) => {
        set((s) => ({ actionLoading: { ...s.actionLoading, [friendshipId]: true } }));
        const res = await friendsApi.accept(friendshipId);
        set((s) => ({ actionLoading: { ...s.actionLoading, [friendshipId]: false } }));

        if (res.ok) {
            // Move from receivedRequests to friends
            const request = get().receivedRequests.find(
                (r) => r.friendshipId === friendshipId
            );
            if (request) {
                const newFriend: Friend = {
                    friendshipId: request.friendshipId,
                    userId: request.userId,
                    name: request.name,
                    avatarUrl: request.avatarUrl,
                    initials: request.initials,
                    status: "accepted",
                    email: "",
                };
                set((s) => ({
                    friends: [...s.friends, newFriend],
                    receivedRequests: s.receivedRequests.filter(
                        (r) => r.friendshipId !== friendshipId
                    ),
                }));
            } else {
                // Fallback: full refresh
                await Promise.all([get().fetchFriends(), get().fetchRequests()]);
            }
            return true;
        }
        return false;
    },

    // ── Remove / Unfriend ─────────────────────────────────────────────────────────

    removeFriend: async (friendshipId) => {
        set((s) => ({ actionLoading: { ...s.actionLoading, [friendshipId]: true } }));
        const res = await friendsApi.remove(friendshipId);
        set((s) => ({ actionLoading: { ...s.actionLoading, [friendshipId]: false } }));

        if (res.ok) {
            set((s) => ({
                friends: s.friends.filter((f) => f.friendshipId !== friendshipId),
                sentRequests: s.sentRequests.filter((r) => r.friendshipId !== friendshipId),
            }));
            return true;
        }
        return false;
    },

    // ── Computed Helpers ──────────────────────────────────────────────────────────

    isFriend: (userId) =>
        get().friends.some((f) => f.userId === userId && f.status === "accepted"),

    hasPendingRequest: (userId) =>
        get().sentRequests.some((r) => r.userId === userId) ||
        get().receivedRequests.some((r) => r.userId === userId),

    getFriendshipId: (userId) =>
        get().friends.find((f) => f.userId === userId)?.friendshipId ??
        get().sentRequests.find((r) => r.userId === userId)?.friendshipId ??
        get().receivedRequests.find((r) => r.userId === userId)?.friendshipId ??
        null,

    clearError: () => set({ friendsError: null }),
}));