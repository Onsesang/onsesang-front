"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpIcon, MicrophoneIcon, SlidersHorizontalIcon, SpeakerHighIcon } from "@phosphor-icons/react";
import { BY_ID, SCRIPT, won } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useOverlayNav } from "@/lib/overlay";

export default function ChatPanel() {
  const overlay = useOverlayNav();
  const { msgs, typing, send, sessionId, voice, toggleVoice } = useStore();
  const [input, setInput] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, typing]);

  const submit = () => {
    const text = input.trim();
    if (!text) return;
    send(text);
    setInput("");
  };

  return (
    <section className="chat-pane" aria-label="대화">
      <div className="chat-head">
        <div className="title">
          <strong className="display">대화</strong>
          <span>세션 {sessionId}</span>
        </div>
        <button
          type="button"
          className={`btn voice${voice ? " is-on" : ""}`}
          aria-pressed={voice}
          onClick={toggleVoice}
        >
          <SpeakerHighIcon weight="bold" size={14} />읽어주기
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
        {msgs.map((m) => (
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
          </div>
        ))}
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

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="chat-input" className="sr-only">메시지</label>
        <input
          id="chat-input"
          className="input"
          placeholder="어떤 옷을 찾으시나요"
          autoComplete="off"
          enterKeyHint="send"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="button"
          className={`btn mic${voice ? " is-on" : ""}`}
          aria-label="음성 입력"
          aria-pressed={voice}
          onClick={toggleVoice}
        >
          <MicrophoneIcon weight="bold" size={16} />
        </button>
        <button type="submit" className="btn btn-primary btn-icon send" aria-label="보내기">
          <ArrowUpIcon weight="bold" size={15} />
        </button>
      </form>
    </section>
  );
}
