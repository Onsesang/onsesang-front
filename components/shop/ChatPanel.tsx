"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpIcon,
  ListIcon,
  MicrophoneIcon,
  NotePencilIcon,
  SlidersHorizontalIcon,
  SpeakerHighIcon,
  SpeakerSlashIcon,
  StopIcon,
} from "@phosphor-icons/react";
import { QUICK_PROMPTS } from "@/lib/data";
import { categoryLabel } from "@/lib/labels";
import { useStore, type Msg } from "@/lib/store";
import { useOverlayNav } from "@/lib/overlay";
import { useSpeechToText, useTextToSpeech } from "@/lib/speech";

// How many of a search turn's products are listed inside the bubble; the rest are in the list pane.
const REFS_IN_BUBBLE = 3;

// What 읽어주기 says: the reply plus the numbered products shown inside the bubble.
function spokenText(m: Msg) {
  const shown = (m.products ?? []).slice(0, REFS_IN_BUBBLE);
  if (!shown.length) return m.text;
  const items = shown.map((p, i) => `${i + 1}번, ${categoryLabel(p.category)}. ${p.title}.`);
  return `${m.text} 추천 상품입니다. ${items.join(" ")}`;
}

export default function ChatPanel() {
  const overlay = useOverlayNav();
  const {
    msgs, sending, send, sessionId, sessionList, newSession,
    ttsEnabled, toggleTts, speechRate, screenReaderMode,
  } = useStore();
  const [input, setInput] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const tts = useTextToSpeech(speechRate);
  // Speech goes into the input box (after anything already typed) so it can be
  // checked and edited before sending.
  const typedBefore = useRef("");
  const stt = useSpeechToText({
    onTranscript: (text, final) => {
      const base = typedBefore.current;
      setInput(text ? (base ? `${base} ${text}` : text) : base);
      if (final) inputRef.current?.focus();
    },
  });
  const startListening = () => {
    typedBefore.current = input.trim();
    stt.start();
  };

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, sending]);

  // Read each new bot reply aloud when 읽어주기 is on. Messages already on screen
  // when the panel mounted (or restored from a saved session) are skipped.
  const lastSeen = useRef(msgs[msgs.length - 1]?.id);
  const lastUserSent = useRef(false);
  const { say, stop: stopTts } = tts;
  useEffect(() => {
    const last = msgs[msgs.length - 1];
    if (!last || last.id === lastSeen.current) return;
    lastSeen.current = last.id;
    if (last.role === "user") {
      lastUserSent.current = true;
      return;
    }
    if (!lastUserSent.current) return;
    if (ttsEnabled && !last.error) say(last.id, spokenText(last));
    // 스크린리더 우선: move focus to the new reply so it is read in full and the
    // numbered product buttons right after it are next in tab order.
    if (screenReaderMode) document.getElementById(`msg-${last.id}`)?.focus();
  }, [msgs, ttsEnabled, say, screenReaderMode]);

  useEffect(() => {
    if (!ttsEnabled) stopTts();
  }, [ttsEnabled, stopTts]);

  const submit = (text: string) => {
    if (!text.trim() || sending) return;
    send(text);
    setInput("");
  };

  const title = sessionList.find((s) => s.id === sessionId)?.title ?? "새 대화";
  const micLabel = !stt.supported
    ? "이 브라우저는 음성 입력을 지원하지 않아요"
    : stt.listening ? "음성 입력 멈추기" : "음성으로 질문하기";

  return (
    <section className="chat-pane" aria-label="대화">
      <div className="chat-head">
        <button
          type="button"
          className="btn btn-ghost is-quiet btn-icon sm compact-only menu-btn"
          aria-label="메뉴 열기 (대화 목록)"
          onClick={() => overlay.open({ sheet: "menu" })}
        >
          <ListIcon weight="bold" size={20} />
        </button>
        <div className="title">
          <strong className="display">대화</strong>
          <span className="clamp-1">{title}</span>
        </div>
        <button
          type="button"
          className={`btn voice${ttsEnabled ? " is-on" : ""}`}
          aria-pressed={ttsEnabled}
          disabled={!tts.supported}
          title={tts.supported ? "새 답변을 소리로 읽어줘요" : "이 브라우저는 읽어주기를 지원하지 않아요"}
          onClick={toggleTts}
        >
          {ttsEnabled ? <SpeakerHighIcon weight="bold" size={14} /> : <SpeakerSlashIcon weight="bold" size={14} />}
          읽어주기
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-icon sm compact-only"
          aria-label="새 대화"
          onClick={newSession}
        >
          <NotePencilIcon weight="bold" size={15} />
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-icon sm compact-hide"
          aria-label="내 취향"
          onClick={() => overlay.open({ sheet: "prefs" })}
        >
          <SlidersHorizontalIcon weight="bold" size={15} />
        </button>
      </div>

      {/* Spec: new replies in an aria-live="polite" region */}
      <div ref={scroller} className="chat-scroll" aria-live="polite" aria-busy={sending}>
        {msgs.map((m) => {
          const speaking = tts.speakingId === m.id;
          const products = m.products ?? [];
          return (
            <div key={m.id} className="msg-row" data-role={m.role}>
              <div
                id={`msg-${m.id}`}
                tabIndex={-1}
                className={`bubble${m.error ? " is-error" : ""}`}
                role={m.error ? "alert" : undefined}
              >
                <span className="text">{m.text}</span>
                {products.length > 0 && (
                  <ol className="refs">
                    {products.slice(0, REFS_IN_BUBBLE).map((p, i) => (
                      <li key={p.product_id}>
                        <button type="button" className="ref-btn" onClick={() => overlay.open({ product: p.product_id, rank: i + 1 })}>
                          <span className="ref-no">{i + 1}</span>
                          <span className="name clamp-1">{p.title}</span>
                        </button>
                      </li>
                    ))}
                    {products.length > REFS_IN_BUBBLE && (
                      <li>
                        <Link className="ref-more compact-only" href="/products?view=results">
                          {products.length}개 모두 목록에서 보기
                        </Link>
                      </li>
                    )}
                  </ol>
                )}
              </div>
              {m.role === "bot" && !m.error && tts.supported && (
                <button
                  type="button"
                  className={`btn btn-ghost is-quiet btn-icon xs speak-btn${speaking ? " is-speaking" : ""}`}
                  aria-label={speaking ? "읽기 멈추기" : "이 답변 읽어주기"}
                  onClick={() => (speaking ? tts.stop() : tts.say(m.id, spokenText(m)))}
                >
                  {speaking ? <StopIcon weight="fill" size={12} /> : <SpeakerHighIcon weight="bold" size={13} />}
                </button>
              )}
            </div>
          );
        })}
        {sending && (
          <div className="typing" role="status" aria-label="답변을 준비하고 있어요">
            <span /><span /><span />
          </div>
        )}
      </div>

      <div className="quick">
        {QUICK_PROMPTS.map((q) => (
          <button key={q} type="button" className="btn btn-secondary" disabled={sending} onClick={() => submit(q)}>
            {q}
          </button>
        ))}
      </div>

      {stt.error && (
        <div className="stt-error" role="alert">
          <span>{stt.error}</span>
          <button type="button" className="btn btn-ghost is-quiet" onClick={stt.clearError}>닫기</button>
        </div>
      )}

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
      >
        <label htmlFor="chat-input" className="sr-only">메시지</label>
        <input
          ref={inputRef}
          id="chat-input"
          className={`input${stt.listening ? " is-listening" : ""}`}
          placeholder={stt.listening ? "듣고 있어요…" : "어떤 옷을 찾으시나요"}
          autoComplete="off"
          enterKeyHint="send"
          maxLength={4000}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="button"
          className={`btn mic${stt.listening ? " is-listening" : ""}`}
          aria-label={micLabel}
          title={micLabel}
          aria-pressed={stt.listening}
          disabled={!stt.supported}
          onClick={() => (stt.listening ? stt.stop() : startListening())}
        >
          <MicrophoneIcon weight={stt.listening ? "fill" : "bold"} size={16} />
        </button>
        <button type="submit" className="btn btn-primary btn-icon send" aria-label="보내기" disabled={sending || !input.trim()}>
          <ArrowUpIcon weight="bold" size={15} />
        </button>
      </form>
    </section>
  );
}
