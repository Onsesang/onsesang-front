"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BagIcon,
  ChatCircleIcon,
  GearSixIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  SquaresFourIcon,
  XIcon,
} from "@phosphor-icons/react";
import { STEPS } from "@/lib/data";
import { relativeTime } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { useOverlayNav } from "@/lib/overlay";
import ChatPanel from "./ChatPanel";
import Overlays from "./Overlays";

export default function ShopShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pane = pathname.startsWith("/chat") ? "chat" : "list";
  const { refreshCart, notice, dismissNotice } = useStore();

  useEffect(() => { refreshCart(); }, [refreshCart]);

  return (
    <div className="shop" data-pane={pane}>
      <Sidebar pane={pane} />
      <div className="shop-main">
        {children}
        <ChatPanel />
        <TabBar pane={pane} />
      </div>
      <Suspense fallback={null}>
        <Overlays />
      </Suspense>
      {notice && (
        <div className="toast" role="status">
          <span>{notice}</span>
          <button type="button" className="btn btn-ghost btn-icon xs" aria-label="알림 닫기" onClick={dismissNotice}>
            <XIcon weight="bold" size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

function Sidebar({ pane }: { pane: "list" | "chat" }) {
  const router = useRouter();
  const overlay = useOverlayNav();
  const { user, logout, prefs, cartCount, sessionId, sessionList, openSession, newSession } = useStore();

  return (
    <aside className="sidebar" aria-label="메뉴">
      <span className="brand">onsesang</span>
      <nav className="nav-list">
        {/* 전체 상품 = list only; 대화 = list + chat side by side. Only the open one is marked. */}
        <Link className="nav-btn" href="/products" aria-current={pane === "list" ? "page" : undefined}>
          <SquaresFourIcon weight="bold" size={16} />전체 상품
        </Link>
        <Link className="nav-btn" href="/chat" aria-current={pane === "chat" ? "page" : undefined}>
          <ChatCircleIcon weight="bold" size={16} />대화
        </Link>
        <button type="button" className="nav-btn" onClick={() => overlay.open({ sheet: "prefs" })}>
          <SlidersHorizontalIcon weight="bold" size={16} />내 취향
          {prefs && prefs.length > 0 && <span className="nav-badge">{prefs.length}</span>}
        </button>
        <button type="button" className="nav-btn" onClick={() => overlay.open({ sheet: "cart" })}>
          <BagIcon weight="bold" size={16} />장바구니
          {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
        </button>
        <Link className="nav-btn" href={`/onboarding/${STEPS.findIndex((s) => s.key === "voice") + 1}`}>
          <GearSixIcon weight="bold" size={16} />설정
        </Link>
      </nav>

      <div className="sidebar-divider" />
      <span className="sidebar-label">이어서 보던 대화</span>
      <div className="session-list">
        {sessionList.length === 0 && <span className="session-empty">아직 대화가 없어요.</span>}
        {sessionList.map((x) => (
          <button
            key={x.id}
            type="button"
            className="session-btn"
            // Highlight the open conversation only while the chat is on screen.
            aria-current={pane === "chat" && sessionId === x.id}
            onClick={() => {
              openSession(x.id);
              router.push("/chat");
            }}
          >
            <span className="title">{x.title}</span>
            <span className="time">{relativeTime(x.updatedAt)}</span>
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
      <div className="sidebar-user">
        <span className="clamp-1" title={user?.email}>{user?.display_name?.trim() || user?.email}</span>
        <button
          type="button"
          className="btn btn-ghost is-quiet logout"
          onClick={async () => {
            await logout();
            router.replace("/login");
          }}
        >
          로그아웃
        </button>
      </div>
    </aside>
  );
}

function TabBar({ pane }: { pane: "list" | "chat" }) {
  const overlay = useOverlayNav();
  const { cartCount, results, resultsLoading } = useStore();
  // On phones chat and list never share a screen, so 상품 shows what the open conversation
  // found (its list header has 전체 보기 for the catalog); without results it is the catalog.
  const productsHref = results?.length || resultsLoading ? "/products?view=results" : "/products";

  return (
    <nav className="tabbar" aria-label="하단 메뉴">
      <Link className="tab" href="/chat" aria-current={pane === "chat" ? "page" : undefined}>
        <ChatCircleIcon weight="bold" size={20} />대화
      </Link>
      <Link className="tab" href={productsHref} aria-current={pane === "list" ? "page" : undefined}>
        <SquaresFourIcon weight="bold" size={20} />상품
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
