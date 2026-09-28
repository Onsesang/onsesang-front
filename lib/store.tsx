"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { GREETING, STEPS } from "./data";
import { ApiError, errorMessage, getToken, onServerSwitch, onUnauthorized, setToken } from "./api/client";
import * as API from "./api/endpoints";
import type {
  Cart, OnboardingAnswers, Preference, Product, ProductPage, SessionListItem, User,
} from "./api/types";

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

/* ───────────── storage ───────────── */
// Conversations (GET /sessions) and onboarding picks (GET/PUT /onboarding) live on the server.
// This device keeps which conversation was open last, and a per-user copy of the picks so
// voice settings apply before GET /onboarding answers.

type Picks = Record<string, boolean>;

const LEGACY_PICKS_KEY = "onsesang.picks"; // device-wide picks from before the onboarding API
const picksKey = (userId: string) => `onsesang.picks.${userId}`;
// Until a user saves onboarding, 답변 읽어주기 starts on. Saved answers always win, so turning
// it off (or "그냥 해도 괜찮아요") sticks.
const DEFAULT_PICKS: Picks = { tts: true };
const currentKey = (userId: string) => `onsesang.currentSession.${userId}`;

// One answer group per onboarding step (Step.key).
function toAnswers(picks: Picks): OnboardingAnswers {
  const answers: OnboardingAnswers = { gender: [], categories: [], tactile: [], voice: [] };
  for (const step of STEPS) answers[step.key] = step.options.filter((o) => picks[o.id]).map((o) => o.id);
  return answers;
}
function fromAnswers(answers: OnboardingAnswers): Picks {
  return Object.fromEntries(STEPS.flatMap((step) => answers[step.key] ?? []).map((id) => [id, true]));
}
const stepOf = (id: string) => STEPS.find((step) => step.options.some((o) => o.id === id));

const toSummary = (s: SessionListItem): SessionSummary => ({ id: s.session_id, title: s.title, updatedAt: s.updated_at });

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

  /* ── onboarding picks (server, cached per user on this device) ── */
  const [picked, setPicked] = useState<Picks>({});
  const pickedRef = useRef<Picks>({});
  const onboardingDone = useRef(false);
  const picksDirty = useRef(false); // changed here before GET /onboarding answered
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedGender = useRef(""); // gender answer the server has, to notice changes
  const applyPicks = useCallback((next: Picks) => {
    pickedRef.current = next;
    setPicked(next);
  }, []);

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
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = null;
    onboardingDone.current = false;
    picksDirty.current = false;
    applyPicks({});
    setUser(null);
    setCatalog(null);
    setResults(null);
    setSessionId(null);
    setSessionList([]);
    setMsgs([greeting()]);
    setCart(null);
    setPrefs(null);
  }, [applyPicks]);

  // Tell the user when requests move between the main and the fallback server.
  useEffect(() => {
    onServerSwitch((role) => notify(role === "fallback"
      ? "메인 서버에 연결할 수 없어 예비 서버로 전환했어요."
      : "메인 서버가 복구되어 다시 연결했어요."));
    return () => onServerSwitch(null);
  }, [notify]);

  // Restore the signed-in user from a saved token; any 401 later drops back to anonymous.
  useEffect(() => {
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

  // Load this user's onboarding picks and conversations, and reopen the last conversation.
  useEffect(() => {
    if (!user) return;
    const userId = user.user_id;
    let cancelled = false;
    applyPicks(readJSON(picksKey(userId), DEFAULT_PICKS));
    API.onboarding.get()
      .then((o) => {
        if (cancelled) return;
        onboardingDone.current = o.completed;
        savedGender.current = o.answers.gender?.[0] ?? "";
        const legacy = readJSON<Picks>(LEGACY_PICKS_KEY, {});
        writeJSON(LEGACY_PICKS_KEY, null);
        if (picksDirty.current) return; // the pending save carries the newer picks
        if (o.updated_at) {
          applyPicks(fromAnswers(o.answers));
          writeJSON(picksKey(userId), pickedRef.current);
        } else if (Object.values(legacy).some(Boolean)) {
          // Nothing on the server yet: keep what this device showed before the API existed.
          applyPicks(legacy);
          writeJSON(picksKey(userId), legacy);
          API.onboarding.save(toAnswers(legacy), false).catch(() => {});
        }
      })
      .catch(() => { /* cached picks stay in effect */ });
    API.sessions.list()
      .then(({ items }) => { if (!cancelled) setSessionList(items.map(toSummary)); })
      .catch(() => { /* the list stays empty; sending still works */ });
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
    return () => { cancelled = true; };
  }, [user, applyPicks]);

  const signIn = useCallback(async (res: { user: User; access_token: string }, remember: boolean) => {
    setToken(res.access_token, remember);
    resetUserData();
    setUser(res.user);
    setAuthStatus("authenticated");
  }, [resetUserData]);

  /** Resolves to whether this user already finished onboarding. */
  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    await signIn(await API.auth.login(email, password), remember);
    return API.onboarding.get().then((o) => o.completed, () => false);
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

  // Page-wide display settings from 설정: <html data-text="large"> scales type, data-sr
  // turns off motion and strengthens focus rings (see globals.css).
  useEffect(() => {
    const root = document.documentElement;
    if (picked.big) root.dataset.text = "large";
    else delete root.dataset.text;
    if (picked.sr) root.dataset.sr = "on";
    else delete root.dataset.sr;
  }, [picked.big, picked.sr]);

  // Defined before picks: onboarding saves turn tactile picks into preferences (직접 설정).
  const refreshPrefs = useCallback(async () => {
    setPrefsError(null);
    try {
      setPrefs((await API.preferences.list()).items);
    } catch (e) {
      setPrefsError(errorMessage(e));
    }
  }, []);

  /* ── picks ── */
  // The server filters the product list by the saved gender, so reload it when that changes.
  const onboardingSaved = useCallback((answers: OnboardingAnswers) => {
    const gender = answers.gender[0] ?? "";
    if (gender !== savedGender.current) {
      savedGender.current = gender;
      setCatalog(null);
    }
    refreshPrefs();
  }, [refreshPrefs]);
  // Toggles are batched into one PUT /onboarding shortly after the last change.
  const updatePicks = useCallback((fn: (p: Picks) => Picks) => {
    if (!user) return;
    const next = fn(pickedRef.current);
    applyPicks(next);
    picksDirty.current = true;
    writeJSON(picksKey(user.user_id), next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      const answers = toAnswers(next);
      API.onboarding.save(answers, onboardingDone.current)
        .then(() => onboardingSaved(answers))
        .catch(() => notify("취향 설정을 저장하지 못했어요. 잠시 후 다시 시도해 주세요."));
    }, 500);
  }, [user, applyPicks, notify, onboardingSaved]);
  /** Called when the last onboarding step is finished; saves right away. */
  const completeOnboarding = useCallback(async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = null;
    onboardingDone.current = true;
    const answers = toAnswers(pickedRef.current);
    try {
      await API.onboarding.save(answers, true);
    } catch (e) {
      notify(errorMessage(e));
      return;
    }
    onboardingSaved(answers);
  }, [notify, onboardingSaved]);
  // A single-choice step (gender) keeps exactly the option just picked.
  const togglePick = useCallback((id: string) => updatePicks((p) => {
    const step = stepOf(id);
    if (!step?.single) return { ...p, [id]: !p[id] };
    const next = { ...p };
    step.options.forEach((o) => { delete next[o.id]; });
    next[id] = true;
    return next;
  }), [updatePicks]);
  const clearVoicePicks = useCallback(() => updatePicks((p) => {
    const next = { ...p };
    STEPS.find((step) => step.key === "voice")?.options.forEach((o) => { delete next[o.id]; });
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
      // Same title rule as GET /sessions, so the row does not change on the next load.
      const entry: SessionSummary = {
        id,
        title: existing?.title ?? (firstMessage?.replace(/\s+/g, " ").trim().slice(0, 40) || "새 대화"),
        updatedAt: new Date().toISOString(),
      };
      return [entry, ...list.filter((s) => s.id !== id)].slice(0, 30);
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
        setSessionList((list) => list.filter((s) => s.id !== id));
        notify("이 대화는 더 이상 열 수 없어요. 새 대화를 시작해 주세요.");
      } else {
        notify(errorMessage(e));
      }
    }
  }, [user, notify]);

  const cartCount = cart?.items.reduce((a, i) => a + i.quantity, 0) ?? 0;

  return {
    user, authStatus, login, register, logout,
    picked, togglePick, clearVoicePicks, completeOnboarding,
    // Voice settings come from onboarding step 3 and stay editable from the chat header.
    ttsEnabled: !!picked.tts,
    toggleTts: () => togglePick("tts"),
    // 천천히 읽기. 0.8 was barely audible with the macOS Korean voice, so it is set clearly slower.
    speechRate: picked.speed ? 0.7 : 1,
    screenReaderMode: !!picked.sr,
    largeText: !!picked.big,
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
