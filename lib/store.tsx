"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { STEPS, type ScriptEntry } from "./data";

export type Msg = { id: number; role: "bot" | "user"; text: string; ids?: string[] };
export type Pref = { id: string; label: string; source: string };

const INITIAL_MSGS: Msg[] = [
  { id: 2, role: "bot", text: "무엇을 찾으시는지 알려주세요. 소재나 세탁 방법처럼 겉으로 잘 안 보이는 조건도 괜찮습니다." },
  { id: 3, role: "user", text: "겨울에 사무실에서 입을 상의요. 목이 따가운 건 못 입어요." },
  { id: 4, role: "bot", text: "따가움은 울의 섬도와 관계가 큽니다. 19미크론 아래 제품만 남겼습니다.", ids: ["p05", "p01"] },
];

const INITIAL_PREFS: Pref[] = [
  { id: "pf_1", label: "보풀이 적은 소재를 선호", source: "대화에서 추론 · 9월 21일" },
  { id: "pf_2", label: "드라이클리닝 전용은 제외", source: "직접 입력" },
  { id: "pf_3", label: "상의 M, 하의 30인치", source: "취향 설정" },
];

function useStoreValue() {
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [voice, setVoice] = useState(false);
  const [sessionId, setSessionId] = useState("s_8c41");
  const [msgs, setMsgs] = useState<Msg[]>(INITIAL_MSGS);
  const [typing, setTyping] = useState(false);
  const [filter, setFilter] = useState<string[] | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({ p03: 1 });
  const [prefs, setPrefs] = useState<Pref[]>(INITIAL_PREFS);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const send = useCallback((text: string, data?: ScriptEntry) => {
    const id = Date.now();
    setMsgs((m) => [...m, { id, role: "user", text }]);
    setTyping(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const reply: Msg = data
        ? { id: id + 1, role: "bot", text: data.reply, ids: data.ids }
        : { id: id + 1, role: "bot", text: "조건을 반영해 목록을 다시 정렬했습니다. 무게와 관리 편의 중 어느 쪽이 더 중요하세요?", ids: [] };
      setMsgs((m) => [...m, reply]);
      setTyping(false);
      if (data) setFilter(data.filter);
    }, 800);
  }, []);

  const togglePick = useCallback((id: string) => setPicked((p) => ({ ...p, [id]: !p[id] })), []);

  const clearVoicePicks = useCallback(() => {
    setPicked((p) => {
      const next = { ...p };
      STEPS[2].options.forEach((o) => { delete next[o.id]; });
      return next;
    });
  }, []);

  const newSession = useCallback(() => {
    setSessionId("s_" + Math.random().toString(16).slice(2, 6));
    setMsgs([{ id: 1, role: "bot", text: "무엇을 찾으시는지 알려주세요." }]);
    setFilter(null);
  }, []);

  const cartAdd = useCallback((id: string) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 })), []);
  const cartDec = useCallback((id: string) => setCart((c) => ({ ...c, [id]: Math.max(1, (c[id] || 1) - 1) })), []);
  const cartRemove = useCallback((id: string) => setCart((c) => {
    const next = { ...c };
    delete next[id];
    return next;
  }), []);

  const editPref = useCallback((id: string) =>
    setPrefs((ps) => ps.map((p) => (p.id === id ? { ...p, source: "직접 수정 · 방금" } : p))), []);
  const forgetPref = useCallback((id: string) => setPrefs((ps) => ps.filter((p) => p.id !== id)), []);

  const cartCount = Object.values(cart).reduce((a, n) => a + n, 0);

  return {
    picked, togglePick, clearVoicePicks,
    voice, toggleVoice: () => setVoice((v) => !v),
    sessionId, setSessionId, newSession,
    msgs, typing, send,
    filter, setFilter,
    cart, cartCount, cartAdd, cartDec, cartRemove,
    prefs, editPref, forgetPref,
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
