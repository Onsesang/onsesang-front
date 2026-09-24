"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpIcon,
  MicrophoneIcon,
  SlidersHorizontalIcon,
  SpeakerHighIcon,
  SpeakerSlashIcon,
  StopIcon,
} from "@phosphor-icons/react";
import { BY_ID, SCRIPT, won } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useOverlayNav } from "@/lib/overlay";
import type { Msg } from "@/lib/store";
import { useSpeechToText, useTextToSpeech } from "@/lib/speech";

// What 읽어주기 says for a message: the reply plus the product cards shown inside the bubble.
function spokenText(m: Msg) {
  const items = (m.ids ?? []).map((id) => `${BY_ID[id].name}, ${won(BY_ID[id].price)}.`);
  return items.length ? `${m.text} 추천 상품입니다. ${items.join(" ")}` : m.text;
}

export default function ChatPanel() {
  const overlay = useOverlayNav();
  const { msgs, typing, send, sessionId, ttsEnabled, toggleTts, speechRate } = useStore();
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
  }, [msgs, typing]);

  // Read each new bot reply aloud when 읽어주기 is on. Messages that were already
  // on screen when the panel mounted are skipped.
  const lastSeen = useRef(msgs[msgs.length - 1]?.id);
  const { say, stop: stopTts } = tts;
  useEffect(() => {
    const last = msgs[msgs.length - 1];
    if (!last || last.id === lastSeen.current) return;
    lastSeen.current = last.id;
    if (last.role === "bot" && ttsEnabled) say(last.id, spokenText(last));
  }, [msgs, ttsEnabled, say]);

  useEffect(() => {
    if (!ttsEnabled) stopTts();
  }, [ttsEnabled, stopTts]);

  const submit = () => {
    const text = input.trim();
    if (!text) return;
    send(text);
    setInput("");
  };

  const micLabel = !stt.supported
    ? "이 브라우저는 음성 입력을 지원하지 않아요"
    : stt.listening ? "음성 입력 멈추기" : "음성으로 질문하기";

  return (
    <section className="chat-pane" aria-label="대화">
      <div className="chat-head">
        <div className="title">
          <strong className="display">대화</strong>
          <span>세션 {sessionId}</span>
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
          className="btn btn-secondary btn-icon sm compact-hide"
          aria-label="내 취향"
          onClick={() => overlay.open({ sheet: "prefs" })}
        >
          <SlidersHorizontalIcon weight="bold" size={15} />
        </button>
      </div>

      <div ref={scroller} className="chat-scroll" aria-live="polite">
        {msgs.map((m) => {
          const speaking = tts.speakingId === m.id;
          return (
            <div key={m.id} className="msg-row" data-role={m.role}>
              <div className="bubble">
                <span className="text">{m.text}</span>
                {m.ids && m.ids.length > 0 && (
                  <div className="refs">
                    {m.ids.map((id) => (
                      <button key={id} type="button" className="ref-btn" onClick={() => overlay.open({ product: id })}>
                        <span className="name">{BY_ID[id].name}</span>
                        <span className="price">{won(BY_ID[id].price)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {m.role === "bot" && tts.supported && (
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
        {typing && (
          <div className="typing" aria-label="답변 작성 중">
            <span /><span /><span />
          </div>
        )}
      </div>

      <div className="quick">
        {SCRIPT.map((q) => (
          <button key={q.user} type="button" className="btn btn-secondary" onClick={() => send(q.user, q)}>
            {q.user}
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
          submit();
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
        <button type="submit" className="btn btn-primary btn-icon send" aria-label="보내기">
          <ArrowUpIcon weight="bold" size={15} />
        </button>
      </form>
    </section>
  );
}
