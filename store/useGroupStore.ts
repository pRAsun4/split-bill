/**
 * store/useGroupStore.ts
 * ──────────────────────
 * Live data store — fetches from real API.
 * Replaces the seed data in useAppStore.
 */

import { create } from "zustand";
import {
    ApiBalance,
    ApiExpense,
    ApiGroup,
    ApiMessage,
    ApiSettlementTx,
    balancesApi,
    expensesApi,
    groupsApi,
    messagesApi
} from "../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type GroupState = {
  // Data
  groups: ApiGroup[];
  // per-group caches keyed by groupId
  expenses: Record<string, ApiExpense[]>;
  messages: Record<string, ApiMessage[]>;
  balances: Record<string, ApiBalance[]>;
  summaries: Record<string, ApiSettlementTx[]>;
  settledFlags: Record<string, boolean>;

  // Pagination
  cursors: Record<string, string | null>;    // nextCursor per group
  hasMore: Record<string, boolean>;

  // Loading flags
  loadingGroups: boolean;
  loadingExpenses: Record<string, boolean>;
  loadingMessages: Record<string, boolean>;
  loadingBalances: Record<string, boolean>;

  // Errors
  error: string | null;

  // Actions
  fetchGroups: () => Promise<void>;
  fetchExpenses: (groupId: string) => Promise<void>;
  fetchMessages: (groupId: string, cursor?: string) => Promise<void>;
  fetchBalances: (groupId: string) => Promise<void>;
  fetchSummary: (groupId: string) => Promise<void>;

  createGroup: (payload: {
    name: string;
    iconEmoji?: string;
    memberIds?: string[];
  }) => Promise<ApiGroup | null>;

  // Optimistic / socket updates
  prependMessage: (groupId: string, msg: ApiMessage) => void;
  updateExpenseInCache: (groupId: string, expense: ApiExpense) => void;
  addExpenseToCache: (groupId: string, expense: ApiExpense) => void;
  removeExpenseFromCache: (groupId: string, expenseId: string) => void;
  invalidateBalances: (groupId: string) => void;

  reset: () => void;
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  expenses: {},
  messages: {},
  balances: {},
  summaries: {},
  settledFlags: {},
  cursors: {},
  hasMore: {},
  loadingGroups: false,
  loadingExpenses: {},
  loadingMessages: {},
  loadingBalances: {},
  error: null,

  // ── fetchGroups ─────────────────────────────────────────────────────────────

  fetchGroups: async () => {
    set({ loadingGroups: true, error: null });
    const res = await groupsApi.list();
    if (res.ok) {
      set({ groups: res.data.groups, loadingGroups: false });
    } else {
      set({ loadingGroups: false, error: res.error });
    }
  },

  // ── fetchExpenses ───────────────────────────────────────────────────────────

  fetchExpenses: async (groupId) => {
    set((s) => ({ loadingExpenses: { ...s.loadingExpenses, [groupId]: true } }));
    const res = await expensesApi.listByGroup(groupId);
    if (res.ok) {
      set((s) => ({
        expenses: { ...s.expenses, [groupId]: res.data.expenses },
        loadingExpenses: { ...s.loadingExpenses, [groupId]: false },
      }));
    } else {
      set((s) => ({ loadingExpenses: { ...s.loadingExpenses, [groupId]: false } }));
    }
  },

  // ── fetchMessages ───────────────────────────────────────────────────────────

  fetchMessages: async (groupId, cursor) => {
    set((s) => ({ loadingMessages: { ...s.loadingMessages, [groupId]: true } }));
    const res = await messagesApi.list(groupId, { limit: 30, cursor });
    if (res.ok) {
      const incoming = res.data.data;
      const { pagination } = res.data;
      set((s) => {
        const existing = cursor ? (s.messages[groupId] ?? []) : [];
        // Newer messages at end, older prepended when loading more
        const merged = cursor ? [...incoming, ...existing] : incoming;
        return {
          messages: { ...s.messages, [groupId]: merged },
          cursors: { ...s.cursors, [groupId]: pagination.nextCursor },
          hasMore: { ...s.hasMore, [groupId]: pagination.hasMore },
          loadingMessages: { ...s.loadingMessages, [groupId]: false },
        };
      });
    } else {
      set((s) => ({ loadingMessages: { ...s.loadingMessages, [groupId]: false } }));
    }
  },

  // ── fetchBalances ───────────────────────────────────────────────────────────

  fetchBalances: async (groupId) => {
    set((s) => ({ loadingBalances: { ...s.loadingBalances, [groupId]: true } }));
    const res = await balancesApi.list(groupId);
    if (res.ok) {
      set((s) => ({
        balances: { ...s.balances, [groupId]: res.data.balances },
        loadingBalances: { ...s.loadingBalances, [groupId]: false },
      }));
    } else {
      set((s) => ({ loadingBalances: { ...s.loadingBalances, [groupId]: false } }));
    }
  },

  // ── fetchSummary ─────────────────────────────────────────────────────────────

  fetchSummary: async (groupId) => {
    const res = await balancesApi.summary(groupId);
    if (res.ok) {
      set((s) => ({
        summaries: { ...s.summaries, [groupId]: res.data.transactions },
        settledFlags: { ...s.settledFlags, [groupId]: res.data.isSettled },
      }));
    }
  },

  // ── createGroup ──────────────────────────────────────────────────────────────

  createGroup: async (payload) => {
    const res = await groupsApi.create(payload);
    if (res.ok) {
      set((s) => ({ groups: [res.data.group, ...s.groups] }));
      return res.data.group;
    }
    return null;
  },

  // ── socket / optimistic helpers ──────────────────────────────────────────────

  prependMessage: (groupId, msg) => {
    set((s) => ({
      messages: {
        ...s.messages,
        [groupId]: [...(s.messages[groupId] ?? []), msg],
      },
    }));
  },

  updateExpenseInCache: (groupId, expense) => {
    set((s) => ({
      expenses: {
        ...s.expenses,
        [groupId]: (s.expenses[groupId] ?? []).map((e) =>
          e.id === expense.id ? expense : e
        ),
      },
    }));
  },

  addExpenseToCache: (groupId, expense) => {
    set((s) => ({
      expenses: {
        ...s.expenses,
        [groupId]: [...(s.expenses[groupId] ?? []), expense],
      },
    }));
  },

  removeExpenseFromCache: (groupId, expenseId) => {
    set((s) => ({
      expenses: {
        ...s.expenses,
        [groupId]: (s.expenses[groupId] ?? []).filter((e) => e.id !== expenseId),
      },
    }));
  },

  invalidateBalances: (groupId) => {
    // Trigger a re-fetch next time balances are needed
    set((s) => ({
      balances: { ...s.balances, [groupId]: [] },
      summaries: { ...s.summaries, [groupId]: [] },
    }));
  },

  reset: () =>
    set({
      groups: [],
      expenses: {},
      messages: {},
      balances: {},
      summaries: {},
      settledFlags: {},
      cursors: {},
      hasMore: {},
      loadingGroups: false,
      loadingExpenses: {},
      loadingMessages: {},
      loadingBalances: {},
      error: null,
    }),
}));

// ─── Selectors / helpers ──────────────────────────────────────────────────────

/** Total owed to me and I owe across all groups from balances cache */
export function getTotalsFromBalances(balances: Record<string, ApiBalance[]>) {
  let totalOwed = 0;
  let totalOwes = 0;
  for (const groupBalances of Object.values(balances)) {
    for (const b of groupBalances) {
      totalOwed += b.owesYou;
      totalOwes += b.youOwe;
    }
  }
  return {
    totalOwed: parseFloat(totalOwed.toFixed(2)),
    totalOwes: parseFloat(totalOwes.toFixed(2)),
  };
}

/** Get initials from a name */
export function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.trim().slice(0, 2).toUpperCase();
}

/** Generate a deterministic avatar color from a user id */
const AVATAR_COLORS = [
  "#6C63FF", "#FF6584", "#43BCCD", "#FF9F43",
  "#EE5A24", "#4CAF50", "#9C27B0", "#2196F3",
  "#FF5722", "#607D8B",
];
export function getAvatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}