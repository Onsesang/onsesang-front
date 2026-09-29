"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { STEPS } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function Onboarding({ index }: { index: number }) {
  const router = useRouter();
  const { picked, togglePick, clearVoicePicks, completeOnboarding } = useStore();
  const step = STEPS[index];
  const total = STEPS.length;
  const isLast = index === total - 1;
  const prevHref = index === 0 ? "/login" : `/onboarding/${index}`;
  // Finishing (or skipping) onboarding opens the conversation first; on phones that is the chat pane.
  const nextHref = isLast ? "/chat" : `/onboarding/${index + 2}`;

  return (
    <main className="onb">
      <header className="onb-top">
        <span className="brand">onsesang</span>
        <span className="step-count">취향 설정 {index + 1} / {total}</span>
        <Link className="btn btn-ghost" style={{ fontSize: 13 }} href="/chat">나중에 하기</Link>
      </header>
      <div
        className="onb-progress"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={index + 1}
        aria-label="취향 설정 진행도"
      >
        <span style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>

      <div className="onb-body">
        <div className="onb-inner">
          <div className="onb-heading">
            <h1>{step.title}</h1>
            <p>{step.desc}</p>
          </div>

          <div className="onb-grid" data-cols={step.options.length === 4 ? 2 : 3}>
            {step.options.map((o) => (
              <button
                key={o.id}
                type="button"
                className="onb-option"
                aria-pressed={!!picked[o.id]}
                onClick={() => togglePick(o.id)}
              >
                <span className="label display">{o.label}</span>
                <span className="note">{o.note}</span>
              </button>
            ))}
          </div>

          <div className="onb-actions">
            {isLast && (
              <button
                type="button"
                className="btn btn-secondary plain"
                onClick={async () => {
                  clearVoicePicks();
                  await completeOnboarding(); // the product list is filtered by the saved answers
                  router.push("/chat");
                }}
              >
                그냥 해도 괜찮아요
              </button>
            )}
            <span className="spacer" />
            <Link className="btn btn-secondary" href={prevHref}>이전</Link>
            {isLast ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  await completeOnboarding(); // the product list is filtered by the saved answers
                  router.push(nextHref);
                }}
              >
                시작하기
              </button>
            ) : (
              <Link className="btn btn-primary" href={nextHref}>다음</Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
