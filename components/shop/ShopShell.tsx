"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BagIcon,
  ChatCircleIcon,
  GearSixIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react";
import { SESSIONS } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useOverlayNav } from "@/lib/overlay";
import ChatPanel from "./ChatPanel";
import Overlays from "./Overlays";

export default function ShopShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pane = pathname.startsWith("/chat") ? "chat" : "list";

  return (
    <div className="shop" data-pane={pane}>
      <Sidebar />
      <div className="shop-main">
        {children}
        <ChatPanel />
        <TabBar pane={pane} />
      </div>
      <Suspense fallback={null}>
        <Overlays />
      </Suspense>
    </div>
  );
}

function Sidebar() {
  const router = useRouter();
  const overlay = useOverlayNav();
  const { prefs, cartCount, sessionId, setSessionId, newSession, setFilter } = useStore();

  return (
    <aside className="sidebar" aria-label="메뉴">
      <span className="brand">onsesang</span>
      <nav className="nav-list">
        <Link className="nav-btn" href="/products" aria-current="page" onClick={() => setFilter(null)}>
          <SquaresFourIcon weight="bold" size={16} />전체 상품
        </Link>
        <button type="button" className="nav-btn" onClick={() => overlay.open({ sheet: "prefs" })}>
          <SlidersHorizontalIcon weight="bold" size={16} />내 취향<span className="nav-badge">{prefs.length}</span>
        </button>
        <button type="button" className="nav-btn" onClick={() => overlay.open({ sheet: "cart" })}>
          <BagIcon weight="bold" size={16} />장바구니
          {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
        </button>
        <Link className="nav-btn" href="/onboarding/3">
          <GearSixIcon weight="bold" size={16} />설정
        </Link>
      </nav>

      <div className="sidebar-divider" />
      <span className="sidebar-label">이어서 보던 대화</span>
      <div className="session-list">
        {SESSIONS.map((x) => (
          <button
            key={x.id}
            type="button"
            className="session-btn"
            aria-current={sessionId === x.id}
            onClick={() => {
              setSessionId(x.id);
              router.push("/chat");
            }}
          >
            <span className="title">{x.title}</span>
            <span className="time">{x.time}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-secondary new-session"
        onClick={() => {
          newSession();
          router.push("/chat");
        }}
      >
        <PlusIcon weight="bold" size={14} />새 대화
      </button>
      <Link className="btn btn-ghost is-quiet logout" href="/login">로그아웃</Link>
    </aside>
  );
}

function TabBar({ pane }: { pane: "list" | "chat" }) {
  const overlay = useOverlayNav();
  const { cartCount } = useStore();

  return (
    <nav className="tabbar" aria-label="하단 메뉴">
      <Link className="tab" href="/products" aria-current={pane === "list" ? "page" : undefined}>
        <SquaresFourIcon weight="bold" size={20} />상품
      </Link>
      <Link className="tab" href="/chat" aria-current={pane === "chat" ? "page" : undefined}>
        <ChatCircleIcon weight="bold" size={20} />대화
      </Link>
      <button type="button" className="tab" onClick={() => overlay.open({ sheet: "prefs" })}>
        <SlidersHorizontalIcon weight="bold" size={20} />취향
      </button>
      <button type="button" className="tab" onClick={() => overlay.open({ sheet: "cart" })}>
        <BagIcon weight="bold" size={20} />장바구니
        {cartCount > 0 && <span className="tab-badge">{cartCount}</span>}
      </button>
    </nav>
  );
}
