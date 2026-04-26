// ─── API Client ───────────────────────────────────────────────────────────────
// All backend calls go through here.
// Base URL and timeout come from .env via process.env.EXPO_PUBLIC_*

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
const VERSION  = process.env.EXPO_PUBLIC_API_VERSION ?? "v1";
const TIMEOUT  = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT ?? "10000", 10);

export const API_BASE = `${BASE_URL}/api/${VERSION}`;

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApiResponse<T> =
  | { ok: true;  data: T }
  | { ok: false; error: string; status?: number };

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<ApiResponse<T>> {
  const { token, ...fetchOptions } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(fetchOptions.headers ?? {}),
      },
    });

    clearTimeout(timer);

    // Try to parse JSON body
    let body: any = null;
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      body = await res.json();
    } else {
      body = await res.text();
    }

    if (!res.ok) {
      const msg =
        (typeof body === "object" && body?.message) ||
        (typeof body === "object" && body?.detail) ||
        (typeof body === "string" && body) ||
        `Request failed (${res.status})`;
      return { ok: false, error: msg, status: res.status };
    }

    return { ok: true, data: body as T };
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name === "AbortError") {
      return { ok: false, error: "Request timed out. Check your connection." };
    }
    return { ok: false, error: err?.message ?? "Network error. Please try again." };
  }
}

// ─── Auth endpoints ───────────────────────────────────────────────────────────

export type LoginPayload    = { email: string; password: string };
export type RegisterPayload = { name: string; email: string; password: string };
export type ForgotPayload   = { email: string };

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  username?: string;
  avatarColor?: string;
};

export type AuthTokenResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};

export const authApi = {
  login: (payload: LoginPayload) =>
    request<AuthTokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  register: (payload: RegisterPayload) =>
    request<AuthTokenResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  forgotPassword: (payload: ForgotPayload) =>
    request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  me: (token: string) =>
    request<AuthUser>("/auth/me", { token }),
};