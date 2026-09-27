"use client";

// Thin fetch wrapper for the agent backend: Bearer auth, JSON, timeouts and a
// single ApiError shape. Never log tokens or request bodies (spec: 오류 형식).

import { BACKEND_ORIGIN } from "./config";

// Development: same-origin /agent/v1, proxied by next.config.ts, because the backend's
// CORS list only allows :3000 and the Vercel domain (this dev server may run elsewhere).
// Production: the browser calls the backend directly so per-IP rate limits (login,
// register) apply to each user rather than to Vercel's shared server IPs.
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? (process.env.NODE_ENV === "production" ? BACKEND_ORIGIN : "");
const PREFIX = "/agent/v1";

const TOKEN_KEY = "onsesang.token";

// "로그인 유지" on → localStorage (survives restarts, token lasts 30 days); off → this tab only.
let memoryToken: string | null = null;

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY) ?? memoryToken;
  } catch {
    return memoryToken;
  }
}
export function setToken(token: string | null, remember = true) {
  memoryToken = token;
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    if (token) (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  } catch { /* storage unavailable (private mode) — memoryToken keeps this tab signed in */ }
}

export type ApiErrorCode =
  | "invalid_request" | "unauthorized" | "not_found" | "too_many_requests"
  | "internal_error" | "network" | "timeout" | (string & {});

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    readonly serverMessage: string,
    readonly retryAfter: number | null = null,
  ) {
    super(serverMessage || code);
  }
}

// Called on any 401 so the app can drop the token and send the user to /login.
let unauthorizedHandler: (() => void) | null = null;
export function onUnauthorized(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  timeoutMs?: number;
};

export async function api<T>(path: string, { method = "GET", body, auth = true, timeoutMs = 15000 }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${PREFIX}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (e) {
    const aborted = e instanceof DOMException && e.name === "AbortError";
    throw new ApiError(0, aborted ? "timeout" : "network", "");
  } finally {
    clearTimeout(timer);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string } } | null)?.error;
    const retry = Number(res.headers.get("Retry-After"));
    const apiError = new ApiError(res.status, err?.code ?? `http_${res.status}`, err?.message ?? "", Number.isFinite(retry) && retry > 0 ? retry : null);
    if (res.status === 401 && auth) {
      setToken(null);
      unauthorizedHandler?.();
    }
    throw apiError;
  }
  return data as T;
}

/** Korean copy per error code. Auth and rate-limit messages from the server are already Korean. */
export function errorMessage(e: unknown): string {
  if (!(e instanceof ApiError)) return "문제가 생겼어요. 잠시 후 다시 시도해 주세요.";
  switch (e.code) {
    case "too_many_requests":
      return e.retryAfter
        ? `요청이 너무 많아요. ${formatWait(e.retryAfter)} 후에 다시 시도해 주세요.`
        : e.serverMessage || "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.";
    case "unauthorized":
      return e.serverMessage || "로그인이 필요해요.";
    case "invalid_request":
      // Validation messages for auth are Korean; product/cart ones can be English.
      return /[가-힣]/.test(e.serverMessage) ? e.serverMessage : "입력한 값을 다시 확인해 주세요.";
    case "not_found":
      return "찾는 항목이 없어요. 목록을 새로 불러왔어요.";
    case "internal_error":
      return "서버에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.";
    case "timeout":
      return "응답이 너무 오래 걸려요. 잠시 후 다시 시도해 주세요.";
    case "network":
      return "서버에 연결할 수 없어요. 인터넷 연결을 확인하거나 잠시 후 다시 시도해 주세요.";
    default:
      return "문제가 생겼어요. 잠시 후 다시 시도해 주세요.";
  }
}

function formatWait(seconds: number) {
  return seconds >= 60 ? `${Math.ceil(seconds / 60)}분` : `${seconds}초`;
}
