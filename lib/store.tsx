"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { GREETING, STEPS } from "./data";
import { ApiError, errorMessage, getToken, onUnauthorized, setToken } from "./api/client";
import * as API from "./api/endpoints";
import type { Cart, Preference, Product, ProductPage, User } from "./api/types";

export type Msg = {
  id: number;
  role: "bot" | "user";
  text: string;
  /** Products returned by a search turn, in the order the agent's "N번" refers to. */
  products?: Product[];
  error?: boolean;
};

export type SessionSummary = { id: string; title: string; updatedAt: string };
export type AuthStatus = "unknown" | "authenticated" | "anonymous";

let msgSeq = 1;
const greeting = (): Msg => ({ id: msgSeq++, role: "bot", text: GREETING });

/* ───────────── per-device storage (sessions have no list API; spec 대화 API) ───────────── */

const PICKS_KEY = "onsesang.picks";
const sessionsKey = (userId: string) => `onsesang.sessions.${userId}`;
const currentKey = (userId: string) => `onsesang.currentSession.${userId}`;

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage unavailable */ }
}

function useStoreValue() {
  /* ── auth ── */
  const [user, setUser] = useState<User | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("unknown");

  /* ── onboarding picks (device-local) ── */
  const [picked, setPicked] = useState<Record<string, boolean>>({});

  /* ── catalog & agent results ── */
  const [catalog, setCatalog] = useState<ProductPage | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [results, setResults] = useState<Product[] | null>(null);

  /* ── chat ── */
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionList, setSessionList] = useState<SessionSummary[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>(() => [greeting()]);
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);

  /* ── cart & preferences ── */
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartBusy, setCartBusy] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Preference[] | null>(null);
  const [prefsError, setPrefsError] = useState<string | null>(null);

  /* ── transient notice (toast) ── */
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = useCallback((text: string) => {
    setNotice(text);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 5000);
  }, []);

  const resetUserData = useCallback(() => {
    setUser(null);
    setCatalog(null);
    setResults(null);
    setSessionId(null);
    setSessionList([]);
    setMsgs([greeting()]);
    setCart(null);
    setPrefs(null);
  }, []);

  // Restore the signed-in user from a saved token; any 401 later drops back to anonymous.
  useEffect(() => {
    setPicked(readJSON(PICKS_KEY, {}));
    onUnauthorized(() => {
      resetUserData();
      setAuthStatus("anonymous");
    });
    if (!getToken()) {
      setAuthStatus("anonymous");
      return () => onUnauthorized(null);
    }
    API.auth.me()
      .then(({ user }) => { setUser(user); setAuthStatus("authenticated"); })
      .catch(() => setAuthStatus(getToken() ? "authenticated" : "anonymous"));
    return () => onUnauthorized(null);
  }, [resetUserData]);

  // Load this user's saved conversations and reopen the last one.
  useEffect(() => {
    if (!user) return;
    setSessionList(readJSON(sessionsKey(user.user_id), []));
    const current = readJSON<string | null>(currentKey(user.user_id), null);
    if (!current) return;
    API.sessions.get(current)
      .then((s) => {
        setSessionId(s.session_id);
        const restored = (s.messages ?? []).map<Msg>((m) => ({
          id: msgSeq++, role: m.role === "user" ? "user" : "bot", text: m.content,
        }));
        setMsgs(restored.length ? restored : [greeting()]);
      })
      .catch(() => writeJSON(currentKey(user.user_id), null));
  }, [user]);

  const signIn = useCallback(async (res: { user: User; access_token: string }, remember: boolean) => {
    setToken(res.access_token, remember);
    resetUserData();
    setUser(res.user);
    setAuthStatus("authenticated");
  }, [resetUserData]);

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    await signIn(await API.auth.login(email, password), remember);
  }, [signIn]);

  const register = useCallback(async (email: string, password: string, name: string, remember: boolean) => {
    await signIn(await API.auth.register(email, password, name), remember);
  }, [signIn]);

  const logout = useCallback(async () => {
    await API.auth.logout().catch(() => {});
    setToken(null);
    resetUserData();
    setAuthStatus("anonymous");
  }, [resetUserData]);

  /* ── picks ── */
  const updatePicks = useCallback((fn: (p: Record<string, boolean>) => Record<string, boolean>) => {
    setPicked((p) => {
      const next = fn(p);
      writeJSON(PICKS_KEY, next);
      return next;
    });
  }, []);
  const togglePick = useCallback((id: string) => updatePicks((p) => ({ ...p, [id]: !p[id] })), [updatePicks]);
  const clearVoicePicks = useCallback(() => updatePicks((p) => {
    const next = { ...p };
    STEPS[2].options.forEach((o) => { delete next[o.id]; });
    return next;
  }), [updatePicks]);

  /* ── catalog ── */
  const loadPage = useCallback(async (page: number) => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      setCatalog(await API.products.list(page, 30));
    } catch (e) {
      setCatalogError(errorMessage(e));
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  /* ── cart ── */
  const refreshCart = useCallback(async () => {
    try {
      setCart(await API.cart.get());
    } catch (e) {
      if (!(e instanceof ApiError && e.code === "unauthorized")) notify(errorMessage(e));
    }
  }, [notify]);

  const setQuantity = useCallback(async (productId: string, quantity: number) => {
    setCartBusy(productId);
    try {
      if (quantity <= 0) await API.cart.remove(productId);
      else await API.cart.set(productId, Math.min(20, quantity), sessionId ?? undefined);
    } catch (e) {
      notify(errorMessage(e));
    } finally {
      await refreshCart(); // spec: always draw the cart and badge from GET /cart
      setCartBusy(null);
    }
  }, [notify, refreshCart, sessionId]);

  const quantityOf = useCallback(
    (productId: string) => cart?.items.find((i) => i.product_id === productId)?.quantity ?? 0,
    [cart],
  );
  const addToCart = useCallback((productId: string) => {
    const q = quantityOf(productId);
    if (q >= 20) {
      notify("한 상품은 20개까지 담을 수 있어요.");
      return Promise.resolve();
    }
    return setQuantity(productId, q + 1);
  }, [notify, quantityOf, setQuantity]);

  /* ── preferences ── */
  const refreshPrefs = useCallback(async () => {
    setPrefsError(null);
    try {
      setPrefs((await API.preferences.list()).items);
    } catch (e) {
      setPrefsError(errorMessage(e));
    }
  }, []);
  const togglePrefActive = useCallback(async (p: Preference) => {
    try {
      const updated = await API.preferences.update(p.preference_id, { active: p.active === false });
      setPrefs((ps) => ps?.map((x) => (x.preference_id === p.preference_id ? { ...x, ...updated } : x)) ?? ps);
    } catch (e) {
      notify(errorMessage(e));
      refreshPrefs();
    }
  }, [notify, refreshPrefs]);
  const forgetPref = useCallback(async (id: string) => {
    try {
      await API.preferences.remove(id);
      setPrefs((ps) => ps?.filter((x) => x.preference_id !== id) ?? ps);
    } catch (e) {
      notify(errorMessage(e));
      refreshPrefs();
    }
  }, [notify, refreshPrefs]);

  /* ── chat ── */
  const rememberSession = useCallback((id: string, firstMessage?: string) => {
    if (!user) return;
    setSessionList((list) => {
      const existing = list.find((s) => s.id === id);
      const entry: SessionSummary = {
        id,
        title: existing?.title ?? (firstMessage ? firstMessage.slice(0, 40) : "새 대화"),
        updatedAt: new Date().toISOString(),
      };
      const next = [entry, ...list.filter((s) => s.id !== id)].slice(0, 30);
      writeJSON(sessionsKey(user.user_id), next);
      return next;
    });
    writeJSON(currentKey(user.user_id), id);
  }, [user]);

  const startSession = useCallback(async () => {
    const s = await API.sessions.create();
    setSessionId(s.session_id);
    return s.session_id;
  }, []);

  const send = useCallback(async (text: string) => {
    const message = text.trim().slice(0, 4000);
    if (!message || sendingRef.current) return; // block duplicate sends while a turn is running
    sendingRef.current = true;
    setSending(true);
    setMsgs((m) => [...m, { id: msgSeq++, role: "user", text: message }]);
    try {
      let sid = sessionId ?? (await startSession());
      let reply;
      try {
        reply = await API.sessions.send(sid, message);
      } catch (e) {
        // Session expired or server switched: start a fresh one and try once more.
        if (!(e instanceof ApiError && e.code === "not_found")) throw e;
        sid = await startSession();
        reply = await API.sessions.send(sid, message);
      }
      rememberSession(sid, message);

      const isSearch = reply.action === "search_products";
      const found = isSearch ? reply.products ?? [] : [];
      setMsgs((m) => [...m, { id: msgSeq++, role: "bot", text: reply.message, products: found.length ? found : undefined }]);
      // Unknown actions behave like `respond`: reply only, list untouched (spec v1.2).
      if (found.length) setResults(found);
      if (reply.cart_updated) refreshCart();
      if (reply.preferences_saved?.length && prefs) refreshPrefs();
    } catch (e) {
      setMsgs((m) => [...m, { id: msgSeq++, role: "bot", text: errorMessage(e), error: true }]);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }, [sessionId, startSession, rememberSession, refreshCart, refreshPrefs, prefs]);

  const newSession = useCallback(() => {
    setSessionId(null); // created lazily on the first message
    setMsgs([greeting()]);
    setResults(null);
    if (user) writeJSON(currentKey(user.user_id), null);
  }, [user]);

  const openSession = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const s = await API.sessions.get(id);
      setSessionId(s.session_id);
      setResults(null);
      const restored = (s.messages ?? []).map<Msg>((m) => ({
        id: msgSeq++, role: m.role === "user" ? "user" : "bot", text: m.content,
      }));
      setMsgs(restored.length ? restored : [greeting()]);
      writeJSON(currentKey(user.user_id), s.session_id);
    } catch (e) {
      if (e instanceof ApiError && e.code === "not_found") {
        setSessionList((list) => {
          const next = list.filter((s) => s.id !== id);
          writeJSON(sessionsKey(user.user_id), next);
          return next;
        });
        notify("이 대화는 더 이상 열 수 없어요. 새 대화를 시작해 주세요.");
      } else {
        notify(errorMessage(e));
      }
    }
  }, [user, notify]);

  const cartCount = cart?.items.reduce((a, i) => a + i.quantity, 0) ?? 0;

  return {
    user, authStatus, login, register, logout,
    picked, togglePick, clearVoicePicks,
    // Voice settings come from onboarding step 3 and stay editable from the chat header.
    ttsEnabled: !!picked.tts,
    toggleTts: () => togglePick("tts"),
    speechRate: picked.speed ? 1.2 : 1,
    catalog, catalogLoading, catalogError, loadPage,
    results, clearResults: () => setResults(null),
    sessionId, sessionList, msgs, sending, send, newSession, openSession,
    cart, cartCount, cartBusy, refreshCart, setQuantity, addToCart, quantityOf,
    prefs, prefsError, refreshPrefs, togglePrefActive, forgetPref,
    notice, notify, dismissNotice: () => setNotice(null),
  };
}

type Store = ReturnType<typeof useStoreValue>;

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const value = useStoreValue();
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const s = useContext(StoreContext);
  if (!s) throw new Error("useStore must be used inside <StoreProvider>");
  return s;
}
