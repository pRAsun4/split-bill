/**
 * lib/api.ts
 * ──────────
 * Centralised HTTP client for the Splitty backend.
 *
 * Key behaviours:
 *  - All responses follow { success, data, message } shape
 *  - On 401, automatically attempts one token refresh via the httpOnly cookie
 *  - If refresh also fails, calls onUnauthorized() (wired to useAuthStore.logout)
 *  - Cookie credentials always sent so the refreshToken cookie flows through
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL  = process.env.EXPO_PUBLIC_API_URL  ?? "http://localhost:3001";
const VERSION   = process.env.EXPO_PUBLIC_API_VERSION ?? "v1";
const TIMEOUT   = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT ?? "10000", 10);
const TOKEN_KEY = process.env.EXPO_PUBLIC_TOKEN_KEY ?? "splitty_auth_token";

export const API_BASE = `${BASE_URL}/api/${VERSION}`;

// ─── Callback wired by useAuthStore on boot ───────────────────────────────────
// Avoids circular import: store imports api, api doesn't import store.

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

// ─── Core Types ───────────────────────────────────────────────────────────────

export type ApiResponse<T> =
  | { ok: true;  data: T;    message?: string }
  | { ok: false; error: string; status?: number; fieldErrors?: FieldError[] };

export type FieldError = { field: string; message: string };

// ─── Shared API types (used by stores) ───────────────────────────────────────

export type ApiUserProfile = {
  id: string;
  userId: string;
  bio: string | null;
  phone?: string | null;
  currency: string;
  theme: "system" | "light" | "dark";
  fontSize: "small" | "medium" | "large";
  notifyNewExpense: boolean;
  notifySettlement: boolean;
  notifyGroupInvite: boolean;
  notifyExpenseReminder: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  showEmail: boolean;
  showPhone: boolean;
  country?: string | null;
};

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  profile?: ApiUserProfile;
};

export type ApiMember = {
  userId: string;
  role: "admin" | "member";
  user: Pick<ApiUser, "id" | "name" | "avatarUrl">;
};

export type ApiGroup = {
  id: string;
  name: string;
  details: string | null;
  iconEmoji: string | null;
  createdById: string;
  createdAt: string;
  members: ApiMember[];
};

export type ParticipationStatus = "invited" | "yes" | "no" | "manual";
export type ExpenseStatus       = "pending" | "locked" | "settled";

export type ApiPayer = {
  userId: string;
  amountPaid: string | number;
  user: Pick<ApiUser, "id" | "name" | "avatarUrl">;
};

export type ApiParticipant = {
  userId: string;
  participationStatus: ParticipationStatus;
  respondedAt: string | null;
  user: Pick<ApiUser, "id" | "name" | "avatarUrl">;
};

export type ApiSplit = {
  id: string;
  debtorId: string;
  creditorId: string;
  splitAmount: string | number;
  isSettled: boolean;
  debtor?:   Pick<ApiUser, "id" | "name">;
  creditor?: Pick<ApiUser, "id" | "name">;
};

export type ApiExpense = {
  id: string;
  groupId: string;
  createdById: string;
  title: string;
  totalAmount: string | number;
  currency: string;
  status: ExpenseStatus;
  createdAt: string;
  createdBy?: Pick<ApiUser, "id" | "name" | "avatarUrl">;
  payers: ApiPayer[];
  participants: ApiParticipant[];
  splits: ApiSplit[];
};

export type ApiMessage = {
  id: string;
  groupId: string;
  senderId: string;
  messageType: "text" | "expense" | "system";
  content: string | null;
  amountSnapshot: number | null;
  description: string | null;
  expenseId: string | null;
  createdAt: string;
  sender: Pick<ApiUser, "id" | "name" | "avatarUrl">;
  expense?: ApiExpense | null;
};

export type ApiBalance = {
  id: string;
  otherUser: Pick<ApiUser, "id" | "name" | "avatarUrl">;
  youOwe: number;
  owesYou: number;
  netAmount: number;
  currency: string;
  lastUpdated: string;
};

export type ApiSettlementTx = {
  from: Pick<ApiUser, "id" | "name">;
  to:   Pick<ApiUser, "id" | "name">;
  amount: number;
  currency: string;
};

export type ApiSettlement = {
  id: string;
  groupId: string;
  payerId: string;
  payeeId: string;
  amount: string | number;
  currency: string;
  note: string | null;
  settledAt: string;
  payer: Pick<ApiUser, "id" | "name" | "avatarUrl">;
  payee: Pick<ApiUser, "id" | "name" | "avatarUrl">;
};

export type ApiFriendship = {
  friendshipId: string;
  status: "accepted" | "pending";
  since?: string;
  user: Pick<ApiUser, "id" | "name" | "avatarUrl" | "email">;
};

export type ApiFriendRequest = {
  friendshipId: string;
  user: Pick<ApiUser, "id" | "name" | "avatarUrl">;
  sentAt: string;
};

// ─── Raw fetch (no auto-refresh) ─────────────────────────────────────────────

async function rawRequest<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<ApiResponse<T>> {
  const { token, ...rest } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...rest,
      credentials: "include",           // always send cookies (refreshToken)
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(rest.headers ?? {}),
      },
    });

    clearTimeout(timer);

    let body: any = null;
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) body = await res.json();
    else body = await res.text();

    if (!res.ok) {
      const msg =
        body?.message ||
        (typeof body === "string" ? body : null) ||
        `Request failed (${res.status})`;
      const fieldErrors: FieldError[] = Array.isArray(body?.errors)
        ? body.errors
        : [];
      return { ok: false, error: msg, status: res.status, fieldErrors };
    }

    // Unwrap { success, data, message }
    const data = body?.data !== undefined ? body.data : body;
    return { ok: true, data: data as T, message: body?.message };
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name === "AbortError")
      return { ok: false, error: "Request timed out. Check your connection." };
    return { ok: false, error: err?.message ?? "Network error. Please try again." };
  }
}

// ─── request() — with automatic token refresh on 401 ─────────────────────────

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<ApiResponse<T>> {
  // 1. Read token from AsyncStorage if not supplied
  const token = options.token ?? (await AsyncStorage.getItem(TOKEN_KEY)) ?? undefined;

  const res = await rawRequest<T>(path, { ...options, token });

  // 2. Not a 401 — return as-is
  if (res.ok || res.status !== 401) return res;

  // 3. 401 — try to refresh the token (one concurrent refresh max)
  if (isRefreshing) {
    // Queue this request until the refresh resolves
    return new Promise((resolve) => {
      refreshQueue.push(async (newToken) => {
        if (!newToken) {
          resolve({ ok: false, error: "Session expired. Please log in again.", status: 401 });
          return;
        }
        resolve(rawRequest<T>(path, { ...options, token: newToken }));
      });
    });
  }

  isRefreshing = true;

  const refreshRes = await rawRequest<{ accessToken: string }>(
    "/auth/refresh",
    { method: "POST" },   // no body — uses httpOnly cookie automatically
  );

  isRefreshing = false;

  if (refreshRes.ok) {
    const newToken = refreshRes.data.accessToken;
    await AsyncStorage.setItem(TOKEN_KEY, newToken);

    // Flush queue
    refreshQueue.forEach((cb) => cb(newToken));
    refreshQueue = [];

    // Retry original request with new token
    return rawRequest<T>(path, { ...options, token: newToken });
  } else {
    // Refresh failed — session is dead
    refreshQueue.forEach((cb) => cb(null));
    refreshQueue = [];
    onUnauthorized?.();
    return { ok: false, error: "Session expired. Please log in again.", status: 401 };
  }
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export type LoginPayload    = { email: string; password: string };
export type RegisterPayload = { name: string; email: string; password: string };

export const authApi = {
  register: (payload: RegisterPayload) =>
    rawRequest<{ user: ApiUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload: LoginPayload) =>
    rawRequest<{ user: ApiUser; accessToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  logout: (token: string) =>
    rawRequest<null>("/auth/logout", {
      method: "POST",
      token,
    }),

  refresh: () =>
    rawRequest<{ accessToken: string }>("/auth/refresh", { method: "POST" }),

  me: (token: string) =>
    rawRequest<{ user: ApiUser }>("/auth/me", { token }),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    request<null>("/auth/change-password", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};

// ─── Users API ────────────────────────────────────────────────────────────────

export const usersApi = {
  search: (q: string, limit = 20) =>
    request<{ users: Pick<ApiUser, "id" | "name" | "email" | "avatarUrl">[]; count: number }>(
      `/users/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    ),

  getById: (userId: string) =>
    request<{ user: ApiUser }>(`/users/${userId}`),

  updateMe: (payload: { name?: string; avatarUrl?: string }) =>
    request<{ user: ApiUser }>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  updateMyProfile: (payload: Partial<ApiUserProfile>) =>
    request<{ profile: ApiUserProfile }>("/users/me/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteMe: () =>
    request<null>("/users/me", { method: "DELETE" }),
};

// ─── Friends API ──────────────────────────────────────────────────────────────

export const friendsApi = {
  list: () =>
    request<{ friends: ApiFriendship[]; count: number }>("/users/me/friends"),

  requests: () =>
    request<{ received: ApiFriendRequest[]; sent: ApiFriendRequest[] }>(
      "/users/me/friends/requests",
    ),

  send: (userId: string) =>
    request<{ friendship: { id: string; status: string }; autoAccepted: boolean }>(
      "/users/me/friends",
      { method: "POST", body: JSON.stringify({ userId }) },
    ),

  accept: (friendshipId: string) =>
    request<{ friendship: { id: string; status: string } }>(
      `/users/me/friends/${friendshipId}/accept`,
      { method: "PATCH" },
    ),

  remove: (friendshipId: string) =>
    request<null>(`/users/me/friends/${friendshipId}`, { method: "DELETE" }),
};

// ─── Groups API ───────────────────────────────────────────────────────────────

export const groupsApi = {
  list: () =>
    request<{ groups: ApiGroup[]; count: number }>("/groups"),

  create: (payload: { name: string; details?: string; iconEmoji?: string; memberIds?: string[] }) =>
    request<{ group: ApiGroup }>("/groups", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  get: (groupId: string) =>
    request<{ group: ApiGroup }>(`/groups/${groupId}`),

  update: (groupId: string, payload: { name?: string; details?: string; iconEmoji?: string }) =>
    request<{ group: ApiGroup }>(`/groups/${groupId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  delete: (groupId: string) =>
    request<null>(`/groups/${groupId}`, { method: "DELETE" }),

  addMembers: (groupId: string, memberIds: string[]) =>
    request<{ added: number; alreadyMembers: number; addedUsers: ApiUser[] }>(
      `/groups/${groupId}/members`,
      { method: "POST", body: JSON.stringify({ memberIds }) },
    ),

  removeMember: (groupId: string, userId: string) =>
    request<null>(`/groups/${groupId}/members/${userId}`, { method: "DELETE" }),

  leave: (groupId: string) =>
    request<null>(`/groups/${groupId}/leave`, { method: "POST" }),

  updateMemberRole: (groupId: string, userId: string, role: "admin" | "member") =>
    request<{ member: { userId: string; role: string } }>(
      `/groups/${groupId}/members/${userId}/role`,
      { method: "PATCH", body: JSON.stringify({ role }) },
    ),
};

// ─── Messages API ─────────────────────────────────────────────────────────────

export const messagesApi = {
  list: (groupId: string, params?: { limit?: number; cursor?: string }) => {
    const qs = new URLSearchParams();
    if (params?.limit)  qs.set("limit",  String(params.limit));
    if (params?.cursor) qs.set("cursor", params.cursor);
    const query = qs.toString() ? `?${qs}` : "";
    return request<{
      data: ApiMessage[];
      pagination: { hasMore: boolean; nextCursor: string | null; count: number };
    }>(`/groups/${groupId}/messages${query}`);
  },

  sendText: (groupId: string, content: string) =>
    request<{ message: ApiMessage; expense: null }>(
      `/groups/${groupId}/messages`,
      { method: "POST", body: JSON.stringify({ messageType: "text", content }) },
    ),

  sendExpense: (groupId: string, payload: { amount: number; description: string; currency?: string }) =>
    request<{ message: ApiMessage; expense: ApiExpense }>(
      `/groups/${groupId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ messageType: "expense", ...payload }),
      },
    ),

  delete: (groupId: string, messageId: string) =>
    request<null>(`/groups/${groupId}/messages/${messageId}`, { method: "DELETE" }),
};

// ─── Expenses API ─────────────────────────────────────────────────────────────

export const expensesApi = {
  listByGroup: (groupId: string) =>
    request<{ expenses: ApiExpense[] }>(`/groups/${groupId}/expenses`),

  get: (expenseId: string) =>
    request<{ expense: ApiExpense }>(`/expenses/${expenseId}`),

  update: (expenseId: string, payload: { title?: string; totalAmount?: number; currency?: string }) =>
    request<{ expense: ApiExpense }>(`/expenses/${expenseId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  delete: (expenseId: string) =>
    request<null>(`/expenses/${expenseId}`, { method: "DELETE" }),

  lock: (expenseId: string) =>
    request<{ expense: ApiExpense }>(`/expenses/${expenseId}/lock`, { method: "POST" }),

  unlock: (expenseId: string) =>
    request<{ expense: ApiExpense }>(`/expenses/${expenseId}/unlock`, { method: "POST" }),

  participate: (expenseId: string, status: "yes" | "no") =>
    request<{ participant: ApiParticipant }>(`/expenses/${expenseId}/participate`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  updateParticipant: (expenseId: string, userId: string, status: ParticipationStatus) =>
    request<{ participant: ApiParticipant }>(`/expenses/${expenseId}/participants`, {
      method: "PATCH",
      body: JSON.stringify({ userId, status }),
    }),

  addPayer: (expenseId: string, userId: string, amountPaid: number) =>
    request<{ payer: ApiPayer }>(`/expenses/${expenseId}/payers`, {
      method: "POST",
      body: JSON.stringify({ userId, amountPaid }),
    }),

  removePayer: (expenseId: string, userId: string) =>
    request<null>(`/expenses/${expenseId}/payers/${userId}`, { method: "DELETE" }),
};

// ─── Balances API ─────────────────────────────────────────────────────────────

export const balancesApi = {
  list: (groupId: string) =>
    request<{ balances: ApiBalance[] }>(`/groups/${groupId}/balances`),

  summary: (groupId: string) =>
    request<{ transactions: ApiSettlementTx[]; totalTransactions: number; isSettled: boolean }>(
      `/groups/${groupId}/balances/summary`,
    ),

  getWithUser: (groupId: string, userId: string) =>
    request<{ balance: { netAmount: number; youOwe: number; owesYou: number; currency: string; lastUpdated: string } }>(
      `/groups/${groupId}/balances/${userId}`,
    ),

  recalculate: (groupId: string) =>
    request<{ recalculated: number }>(`/groups/${groupId}/balances/recalculate`, {
      method: "POST",
    }),
};

// ─── Settlements API ──────────────────────────────────────────────────────────

export const settlementsApi = {
  list: (groupId: string) =>
    request<{ settlements: ApiSettlement[]; count: number }>(`/groups/${groupId}/settlements`),

  listWithUser: (groupId: string, userId: string) =>
    request<{ settlements: ApiSettlement[]; count: number }>(
      `/groups/${groupId}/settlements/with/${userId}`,
    ),

  create: (
    groupId: string,
    payload: { payeeId: string; amount: number; currency?: string; note?: string },
  ) =>
    request<{
      settlement: ApiSettlement;
      previousBalance: number;
      newBalance: number;
      fullySettled: boolean;
    }>(`/groups/${groupId}/settlements`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  undo: (groupId: string, settlementId: string) =>
    request<{ deleted: boolean; note: string }>(
      `/groups/${groupId}/settlements/${settlementId}`,
      { method: "DELETE" },
    ),
};