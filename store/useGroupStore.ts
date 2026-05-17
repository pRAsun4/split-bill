/**
 * store/useGroupStore.ts
 * ──────────────────────
 * Live data store for groups, expenses, messages, and balances.
 * All data fetched from the real backend via lib/api.ts.
 *
 * Replaces the fake seed data that was in useAppStore.ts.
 *
 * Key patterns:
 *  - Each resource has its own loading + error state
 *  - Socket events call the same actions as API calls (single source of truth)
 *  - "current" group / messages are cached until you navigate away
 */

import { create } from "zustand";
import {
    ApiBalance,
    ApiExpense,
    ApiGroup,
    ApiMessage,
    ApiSettlement,
    ApiSettlementTx,
    balancesApi,
    expensesApi,
    groupsApi,
    messagesApi,
    settlementsApi
} from "../lib/api";

// ─── Derived types the UI uses ────────────────────────────────────────────────

export type { ApiBalance, ApiExpense, ApiGroup, ApiMessage, ApiSettlement, ApiSettlementTx };

// Minimal member shape for display
export type GroupMember = {
    userId: string;
    name: string;
    avatarUrl: string | null;
    role: "admin" | "member";
    initials: string;
};

// Per-group pagination cursor for messages
type MessagePage = {
    items: ApiMessage[];
    hasMore: boolean;
    nextCursor: string | null;
};

// ─── Store State ──────────────────────────────────────────────────────────────

type GroupState = {
    // ── Groups list ──────────────────────────────────────────────────────────────
    groups: ApiGroup[];
    groupsLoading: boolean;
    groupsError: string | null;

    // ── Current open group ────────────────────────────────────────────────────────
    currentGroupId: string | null;
    currentGroup: ApiGroup | null;
    groupLoading: boolean;
    groupError: string | null;

    // ── Messages (per group) ──────────────────────────────────────────────────────
    messagePages: Record<string, MessagePage>;   // groupId → page
    messagesLoading: boolean;
    messagesLoadingMore: boolean;
    typingUsers: Record<string, string[]>;       // groupId → userId[]

    // ── Expenses (per group) ──────────────────────────────────────────────────────
    expenses: Record<string, ApiExpense[]>;    // groupId → expenses
    expensesLoading: boolean;
    expenseError: string | null;

    // ── Balances (per group) ──────────────────────────────────────────────────────
    balances: Record<string, ApiBalance[]>;
    summaries: Record<string, { transactions: ApiSettlementTx[]; isSettled: boolean }>;
    balancesLoading: boolean;

    // ── Settlements (per group) ───────────────────────────────────────────────────
    settlements: Record<string, ApiSettlement[]>;
    settlementsLoading: boolean;

    // ── Actions ───────────────────────────────────────────────────────────────────

    // Groups
    fetchGroups: () => Promise<void>;
    fetchGroup: (groupId: string) => Promise<void>;
    createGroup: (payload: { name: string; details?: string; iconEmoji?: string; memberIds?: string[] }) => Promise<ApiGroup | null>;
    updateGroup: (groupId: string, payload: { name?: string; details?: string; iconEmoji?: string }) => Promise<boolean>;
    deleteGroup: (groupId: string) => Promise<boolean>;
    addMembers: (groupId: string, memberIds: string[]) => Promise<boolean>;
    removeMember: (groupId: string, userId: string) => Promise<boolean>;
    leaveGroup: (groupId: string) => Promise<boolean>;

    // Messages
    fetchMessages: (groupId: string, reset?: boolean) => Promise<void>;
    fetchMoreMessages: (groupId: string) => Promise<void>;
    sendTextMessage: (groupId: string, content: string) => Promise<boolean>;
    sendExpenseMessage: (groupId: string, payload: { amount: number; description: string; currency?: string }) => Promise<ApiExpense | null>;
    deleteMessage: (groupId: string, messageId: string) => Promise<boolean>;

    // Expenses
    fetchExpenses: (groupId: string) => Promise<void>;
    lockExpense: (expenseId: string, groupId: string) => Promise<boolean>;
    unlockExpense: (expenseId: string, groupId: string) => Promise<boolean>;
    participate: (expenseId: string, groupId: string, status: "yes" | "no") => Promise<boolean>;
    deleteExpense: (expenseId: string, groupId: string) => Promise<boolean>;

    // Balances
    fetchBalances: (groupId: string) => Promise<void>;
    fetchSummary: (groupId: string) => Promise<void>;

    // Settlements
    fetchSettlements: (groupId: string) => Promise<void>;
    createSettlement: (groupId: string, payload: { payeeId: string; amount: number; currency?: string; note?: string }) => Promise<{ fullySettled: boolean } | null>;
    undoSettlement: (groupId: string, settlementId: string) => Promise<boolean>;

    // Socket event handlers (called by the screen that owns the socket listeners)
    handleNewMessage: (groupId: string, data: ApiMessage) => void;
    handleMessageDeleted: (groupId: string, messageId: string) => void;
    handleExpenseUpdated: (groupId: string, expense: ApiExpense) => void;
    handleExpenseDeleted: (groupId: string, expenseId: string) => void;
    handleBalancesUpdated: (groupId: string) => void;
    handleTypingChange: (groupId: string, userId: string, isTyping: boolean) => void;

    // Helpers
    getGroupMembers: (groupId: string) => GroupMember[];
    clearCurrentGroup: () => void;
    clearError: () => void;
};

// ─── Helper: derive initials from name ───────────────────────────────────────

function toInitials(name: string): string {
    const parts = name.trim().split(" ");
    return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.trim().slice(0, 2).toUpperCase();
}

// ─── Store Implementation ─────────────────────────────────────────────────────

export const useGroupStore = create<GroupState>((set, get) => ({
    groups: [],
    groupsLoading: false,
    groupsError: null,
    currentGroupId: null,
    currentGroup: null,
    groupLoading: false,
    groupError: null,
    messagePages: {},
    messagesLoading: false,
    messagesLoadingMore: false,
    typingUsers: {},
    expenses: {},
    expensesLoading: false,
    expenseError: null,
    balances: {},
    summaries: {},
    balancesLoading: false,
    settlements: {},
    settlementsLoading: false,

    // ── Groups ────────────────────────────────────────────────────────────────────

    fetchGroups: async () => {
        set({ groupsLoading: true, groupsError: null });
        const res = await groupsApi.list();
        if (res.ok) {
            set({ groups: res.data.groups, groupsLoading: false });
        } else {
            set({ groupsLoading: false, groupsError: res.error });
        }
    },

    fetchGroup: async (groupId) => {
        set({ groupLoading: true, groupError: null, currentGroupId: groupId });
        const res = await groupsApi.get(groupId);
        if (res.ok) {
            set({ currentGroup: res.data.group, groupLoading: false });
            // Also update in the groups list
            set((s) => ({
                groups: s.groups.map((g) => g.id === groupId ? res.data.group : g),
            }));
        } else {
            set({ groupLoading: false, groupError: res.error });
        }
    },

    createGroup: async (payload) => {
        const res = await groupsApi.create(payload);
        if (res.ok) {
            set((s) => ({ groups: [res.data.group, ...s.groups] }));
            return res.data.group;
        }
        return null;
    },

    updateGroup: async (groupId, payload) => {
        const res = await groupsApi.update(groupId, payload);
        if (res.ok) {
            set((s) => ({
                groups: s.groups.map((g) => g.id === groupId ? res.data.group : g),
                currentGroup: s.currentGroupId === groupId ? res.data.group : s.currentGroup,
            }));
            return true;
        }
        return false;
    },

    deleteGroup: async (groupId) => {
        const res = await groupsApi.delete(groupId);
        if (res.ok) {
            set((s) => ({ groups: s.groups.filter((g) => g.id !== groupId) }));
            return true;
        }
        return false;
    },

    addMembers: async (groupId, memberIds) => {
        const res = await groupsApi.addMembers(groupId, memberIds);
        if (res.ok) {
            // Refresh the group to get updated members list
            await get().fetchGroup(groupId);
            return true;
        }
        return false;
    },

    removeMember: async (groupId, userId) => {
        const res = await groupsApi.removeMember(groupId, userId);
        if (res.ok) {
            await get().fetchGroup(groupId);
            return true;
        }
        return false;
    },

    leaveGroup: async (groupId) => {
        const res = await groupsApi.leave(groupId);
        if (res.ok) {
            set((s) => ({ groups: s.groups.filter((g) => g.id !== groupId) }));
            return true;
        }
        return false;
    },

    // ── Messages ──────────────────────────────────────────────────────────────────

    fetchMessages: async (groupId, reset = false) => {
        set({ messagesLoading: true });
        const res = await messagesApi.list(groupId, { limit: 30 });
        if (res.ok) {
            // API returns newest-first; reverse for chat display (oldest at top)
            const items = [...res.data.data].reverse();
            set((s) => ({
                messagesLoading: false,
                messagePages: {
                    ...s.messagePages,
                    [groupId]: {
                        items,
                        hasMore: res.data.pagination.hasMore,
                        nextCursor: res.data.pagination.nextCursor,
                    },
                },
            }));
        } else {
            set({ messagesLoading: false });
        }
    },

    fetchMoreMessages: async (groupId) => {
        const page = get().messagePages[groupId];
        if (!page?.hasMore || !page.nextCursor) return;

        set({ messagesLoadingMore: true });
        const res = await messagesApi.list(groupId, {
            limit: 30,
            cursor: page.nextCursor,
        });

        if (res.ok) {
            const older = [...res.data.data].reverse();
            set((s) => ({
                messagesLoadingMore: false,
                messagePages: {
                    ...s.messagePages,
                    [groupId]: {
                        items: [...older, ...(s.messagePages[groupId]?.items ?? [])],
                        hasMore: res.data.pagination.hasMore,
                        nextCursor: res.data.pagination.nextCursor,
                    },
                },
            }));
        } else {
            set({ messagesLoadingMore: false });
        }
    },

    sendTextMessage: async (groupId, content) => {
        const res = await messagesApi.sendText(groupId, content);
        if (res.ok) {
            // Optimistically append — socket will also emit new_message but dedup
            get().handleNewMessage(groupId, res.data.message);
            return true;
        }
        return false;
    },

    sendExpenseMessage: async (groupId, payload) => {
        const res = await messagesApi.sendExpense(groupId, payload);
        if (res.ok) {
            get().handleNewMessage(groupId, res.data.message);
            // Also add expense to local cache
            if (res.data.expense) {
                set((s) => ({
                    expenses: {
                        ...s.expenses,
                        [groupId]: [res.data.expense!, ...(s.expenses[groupId] ?? [])],
                    },
                }));
            }
            return res.data.expense ?? null;
        }
        return null;
    },

    deleteMessage: async (groupId, messageId) => {
        const res = await messagesApi.delete(groupId, messageId);
        if (res.ok) {
            get().handleMessageDeleted(groupId, messageId);
            return true;
        }
        return false;
    },

    // ── Expenses ──────────────────────────────────────────────────────────────────

    fetchExpenses: async (groupId) => {
        set({ expensesLoading: true, expenseError: null });
        const res = await expensesApi.listByGroup(groupId);
        if (res.ok) {
            set((s) => ({
                expensesLoading: false,
                expenses: { ...s.expenses, [groupId]: res.data.expenses },
            }));
        } else {
            set({ expensesLoading: false, expenseError: res.error });
        }
    },

    lockExpense: async (expenseId, groupId) => {
        const res = await expensesApi.lock(expenseId);
        if (res.ok) {
            get().handleExpenseUpdated(groupId, res.data.expense);
            // Balances will update via socket event; also proactively refetch
            await get().fetchBalances(groupId);
            return true;
        }
        return false;
    },

    unlockExpense: async (expenseId, groupId) => {
        const res = await expensesApi.unlock(expenseId);
        if (res.ok) {
            get().handleExpenseUpdated(groupId, res.data.expense);
            await get().fetchBalances(groupId);
            return true;
        }
        return false;
    },

    participate: async (expenseId, groupId, status) => {
        const res = await expensesApi.participate(expenseId, status);
        if (res.ok) {
            // Update participation status in local expense cache
            set((s) => ({
                expenses: {
                    ...s.expenses,
                    [groupId]: (s.expenses[groupId] ?? []).map((exp) =>
                        exp.id !== expenseId
                            ? exp
                            : {
                                ...exp,
                                participants: exp.participants.map((p) =>
                                    p.userId === res.data.participant.userId
                                        ? { ...p, participationStatus: res.data.participant.participationStatus, respondedAt: res.data.participant.respondedAt }
                                        : p
                                ),
                            }
                    ),
                },
            }));
            return true;
        }
        return false;
    },

    deleteExpense: async (expenseId, groupId) => {
        const res = await expensesApi.delete(expenseId);
        if (res.ok) {
            get().handleExpenseDeleted(groupId, expenseId);
            return true;
        }
        return false;
    },

    // ── Balances ──────────────────────────────────────────────────────────────────

    fetchBalances: async (groupId) => {
        set({ balancesLoading: true });
        const [balRes, sumRes] = await Promise.all([
            balancesApi.list(groupId),
            balancesApi.summary(groupId),
        ]);
        set((s) => ({
            balancesLoading: false,
            balances: balRes.ok
                ? { ...s.balances, [groupId]: balRes.data.balances }
                : s.balances,
            summaries: sumRes.ok
                ? { ...s.summaries, [groupId]: { transactions: sumRes.data.transactions, isSettled: sumRes.data.isSettled } }
                : s.summaries,
        }));
    },

    fetchSummary: async (groupId) => {
        const res = await balancesApi.summary(groupId);
        if (res.ok) {
            set((s) => ({
                summaries: {
                    ...s.summaries,
                    [groupId]: { transactions: res.data.transactions, isSettled: res.data.isSettled },
                },
            }));
        }
    },

    // ── Settlements ───────────────────────────────────────────────────────────────

    fetchSettlements: async (groupId) => {
        set({ settlementsLoading: true });
        const res = await settlementsApi.list(groupId);
        if (res.ok) {
            set((s) => ({
                settlementsLoading: false,
                settlements: { ...s.settlements, [groupId]: res.data.settlements },
            }));
        } else {
            set({ settlementsLoading: false });
        }
    },

    createSettlement: async (groupId, payload) => {
        const res = await settlementsApi.create(groupId, payload);
        if (res.ok) {
            // Append to local list
            set((s) => ({
                settlements: {
                    ...s.settlements,
                    [groupId]: [res.data.settlement, ...(s.settlements[groupId] ?? [])],
                },
            }));
            // Refresh balances immediately
            await get().fetchBalances(groupId);
            return { fullySettled: res.data.fullySettled };
        }
        return null;
    },

    undoSettlement: async (groupId, settlementId) => {
        const res = await settlementsApi.undo(groupId, settlementId);
        if (res.ok) {
            set((s) => ({
                settlements: {
                    ...s.settlements,
                    [groupId]: (s.settlements[groupId] ?? []).filter((s) => s.id !== settlementId),
                },
            }));
            // Recalculate balances after undo (as the API docs recommend)
            await balancesApi.recalculate(groupId);
            await get().fetchBalances(groupId);
            return true;
        }
        return false;
    },

    // ── Socket Event Handlers ─────────────────────────────────────────────────────

    handleNewMessage: (groupId, message) => {
        set((s) => {
            const page = s.messagePages[groupId];
            if (!page) return s;
            // Deduplicate by id
            const exists = page.items.some((m) => m.id === message.id);
            if (exists) return s;
            return {
                messagePages: {
                    ...s.messagePages,
                    [groupId]: { ...page, items: [...page.items, message] },
                },
            };
        });
    },

    handleMessageDeleted: (groupId, messageId) => {
        set((s) => {
            const page = s.messagePages[groupId];
            if (!page) return s;
            return {
                messagePages: {
                    ...s.messagePages,
                    [groupId]: {
                        ...page,
                        items: page.items.filter((m) => m.id !== messageId),
                    },
                },
            };
        });
    },

    handleExpenseUpdated: (groupId, expense) => {
        set((s) => ({
            expenses: {
                ...s.expenses,
                [groupId]: (s.expenses[groupId] ?? []).map((e) =>
                    e.id === expense.id ? expense : e
                ),
            },
        }));
    },

    handleExpenseDeleted: (groupId, expenseId) => {
        set((s) => ({
            expenses: {
                ...s.expenses,
                [groupId]: (s.expenses[groupId] ?? []).filter((e) => e.id !== expenseId),
            },
        }));
    },

    handleBalancesUpdated: (groupId) => {
        // Re-fetch balances when socket says they changed
        get().fetchBalances(groupId);
    },

    handleTypingChange: (groupId, userId, isTyping) => {
        set((s) => {
            const current = s.typingUsers[groupId] ?? [];
            const updated = isTyping
                ? current.includes(userId) ? current : [...current, userId]
                : current.filter((id) => id !== userId);
            return { typingUsers: { ...s.typingUsers, [groupId]: updated } };
        });
    },

    // ── Helpers ───────────────────────────────────────────────────────────────────

    getGroupMembers: (groupId) => {
        const group =
            get().currentGroupId === groupId
                ? get().currentGroup
                : get().groups.find((g) => g.id === groupId);
        if (!group) return [];
        return group.members.map((m) => ({
            userId: m.userId,
            name: m.user.name,
            avatarUrl: m.user.avatarUrl,
            role: m.role,
            initials: toInitials(m.user.name),
        }));
    },

    clearCurrentGroup: () => {
        set({ currentGroup: null, currentGroupId: null, groupError: null });
    },

    clearError: () => {
        set({ groupsError: null, groupError: null, expenseError: null });
    },
}));