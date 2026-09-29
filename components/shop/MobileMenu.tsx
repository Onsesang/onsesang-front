"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { GearSixIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { STEPS } from "@/lib/data";
import { relativeTime } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { useOverlayNav } from "@/lib/overlay";

const SETTINGS_HREF = `/onboarding/${STEPS.findIndex((s) => s.key === "voice") + 1}`;

/**
 * Full-screen menu for phones and tablets (?sheet=menu), where the desktop sidebar is hidden:
 * new conversation, recent conversations, and the account row with settings.
 */
export default function MobileMenu() {
  const router = useRouter();
  const overlay = useOverlayNav();
  const { user, logout, sessionId, sessionList, openSession, newSession } = useStore();
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(overlay.close);
  useEffect(() => { closeRef.current = overlay.close; });

  // Same contract as the dialogs: focus on open, Escape closes, focus returns on close.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeRef.current(); };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, []);

  // Leaving the menu for another screen replaces the ?sheet=menu entry, so Back
  // doesn't reopen the menu.
  const go = (href: string) => router.replace(href, { scroll: false });
  const name = user?.display_name?.trim() || user?.email || "";

  return (
    <div ref={ref} className="mobile-menu" role="dialog" aria-modal="true" aria-label="메뉴" tabIndex={-1}>
      <div className="mobile-menu-head">
        <span className="brand">onsesang</span>
        <button type="button" className="mobile-menu-close" aria-label="메뉴 닫기" onClick={overlay.close}>
          <XIcon weight="bold" size={20} />
        </button>
      </div>

      <div className="mobile-menu-body">
        <button
          type="button"
          className="mobile-menu-item new"
          onClick={() => {
            newSession();
            go("/chat");
          }}
        >
          <PlusIcon weight="bold" size={20} />새 대화
        </button>

        <h2 className="mobile-menu-label">최근</h2>
        {sessionList.length === 0 && <p className="mobile-menu-empty">아직 이어볼 대화가 없어요.</p>}
        <ul className="mobile-menu-list">
          {sessionList.map((s) => {
            const current = s.id === sessionId;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  className="mobile-menu-item"
                  aria-current={current}
                  onClick={() => {
                    if (!current) openSession(s.id);
                    go("/chat");
                  }}
                >
                  <span className="clamp-1">{s.title}</span>
                  <span className="time">{current ? "지금 보는 대화" : relativeTime(s.updatedAt)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mobile-menu-foot">
        <span className="avatar" aria-hidden="true">{name.slice(0, 2)}</span>
        <div className="who">
          <span className="clamp-1">{name}</span>
          <button
            type="button"
            className="logout"
            onClick={async () => {
              await logout();
              go("/login");
            }}
          >
            로그아웃
          </button>
        </div>
        <button type="button" className="mobile-menu-settings" aria-label="설정" onClick={() => go(SETTINGS_HREF)}>
          <GearSixIcon weight="bold" size={24} />
        </button>
      </div>
    </div>
  );
}
