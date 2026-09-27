"use client";

import { api } from "./client";
import type {
  AgentReply, AuthResponse, Cart, EventType, Preference, PreferenceDirection,
  ProductDetail, ProductPage, Session, User,
} from "./types";

const enc = encodeURIComponent;

export const auth = {
  register: (email: string, password: string, display_name: string) =>
    api<AuthResponse>("/auth/register", { method: "POST", body: { email, password, display_name }, auth: false }),
  login: (email: string, password: string) =>
    api<AuthResponse>("/auth/login", { method: "POST", body: { email, password }, auth: false }),
  logout: () => api<{ status: "logged_out" }>("/auth/logout", { method: "POST" }),
  me: () => api<{ user: User }>("/auth/me"),
};

export const products = {
  list: (page = 1, pageSize = 30) => api<ProductPage>(`/products?page=${page}&page_size=${pageSize}`),
  detail: (id: string) => api<ProductDetail>(`/products/${enc(id)}`),
};

export const sessions = {
  create: () => api<Session>("/sessions", { method: "POST", body: {} }),
  get: (id: string) => api<Session>(`/sessions/${enc(id)}`),
  // Chat turns take ~3s (sometimes 10s+); spec recommends a 60s timeout.
  send: (id: string, message: string) =>
    api<AgentReply>(`/sessions/${enc(id)}/messages`, { method: "POST", body: { message }, timeoutMs: 60000 }),
};

export const preferences = {
  list: () => api<{ items: Preference[]; auto_save: boolean }>("/preferences"),
  update: (id: string, patch: { direction?: PreferenceDirection; active?: boolean }) =>
    api<Preference>(`/preferences/${enc(id)}`, { method: "PATCH", body: patch }),
  remove: (id: string) => api<{ status: "forgotten" }>(`/preferences/${enc(id)}`, { method: "DELETE" }),
};

export const cart = {
  get: () => api<Cart>("/cart"),
  // Sets the quantity (overwrites, does not add). 1–20.
  set: (productId: string, quantity: number, sessionId?: string) =>
    api<{ status: "added" }>("/cart/items", { method: "POST", body: { product_id: productId, quantity, session_id: sessionId } }),
  remove: (productId: string) => api<{ status: "removed" }>(`/cart/items/${enc(productId)}`, { method: "DELETE" }),
};

/** Fire-and-forget behaviour event. event_id is generated here so retries never double count. */
export function sendEvent(
  eventType: EventType,
  productId: string,
  { sessionId, context }: { sessionId?: string | null; context?: Record<string, number> } = {},
) {
  // randomUUID needs a secure context; plain-http LAN testing falls back to Math.random.
  const uuid = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
  const event_id = `evt_${uuid.replace(/-/g, "")}`;
  api("/events", {
    method: "POST",
    body: { event_id, event_type: eventType, product_id: productId, session_id: sessionId ?? undefined, context },
  }).catch(() => { /* personalization signal only; never block the UI */ });
}
