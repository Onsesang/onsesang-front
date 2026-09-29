"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUpRightIcon, BagIcon, ListIcon } from "@phosphor-icons/react";
import type { Product } from "@/lib/api/types";
import { sendEvent } from "@/lib/api/endpoints";
import { categoryLabel, tactileSourceLabel } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { useOverlayNav } from "@/lib/overlay";
import ProductImage from "@/components/ProductImage";

// product_impression is sent once per product per page load (spec 행동 이벤트).
const impressed = new Set<string>();

/** showResults: list the conversation's search results when there are any (else the catalog). */
export default function ProductList({ showResults = false }: { showResults?: boolean }) {
  const overlay = useOverlayNav();
  const {
    catalog, catalogLoading, catalogError, loadPage,
    results, resultsLoading, quantityOf, addToCart, cartBusy, cartCount, sessionId,
  } = useStore();

  useEffect(() => {
    if (!catalog && !catalogLoading && !catalogError) loadPage(1);
  }, [catalog, catalogLoading, catalogError, loadPage]);

  const showingResults = showResults && (results !== null || resultsLoading);
  const list = showingResults ? results ?? [] : catalog?.items ?? [];
  const loading = showingResults ? resultsLoading : catalogLoading;
  const scroller = useRef<HTMLDivElement>(null);

  // Back to the top when the list is replaced (new search results or another page).
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [results, catalog?.page]);

  const goToPage = (page: number) => loadPage(page);

  return (
    <section className="list-pane" aria-labelledby="list-title">
      <div className="pane-head">
        <button
          type="button"
          className="btn btn-ghost is-quiet btn-icon sm compact-only menu-btn"
          aria-label="메뉴 열기 (대화 목록)"
          onClick={() => overlay.open({ sheet: "menu" })}
        >
          <ListIcon weight="bold" size={20} />
        </button>
        <h1 id="list-title">{showingResults ? "대화로 좁힌 결과" : "전체 상품"}</h1>
        <span className="count">
          {showingResults ? `${list.length}개` : catalog ? `${catalog.total.toLocaleString("ko-KR")}개` : ""}
        </span>
        {showingResults && (
          // Goes to the catalog without dropping the conversation's results, so 대화 shows them again.
          <Link className="btn btn-ghost" style={{ fontSize: 13 }} href="/products">
            전체 보기
          </Link>
        )}
        <button
          type="button"
          className="btn btn-secondary btn-icon compact-only"
          aria-label={`장바구니 ${cartCount}개`}
          onClick={() => overlay.open({ sheet: "cart" })}
        >
          <BagIcon weight="bold" size={16} />
        </button>
      </div>

      <div ref={scroller} className="list-scroll">
        {catalogError && !showingResults && (
          <div className="state-box" role="alert">
            <span>{catalogError}</span>
            <button type="button" className="btn btn-secondary" onClick={() => loadPage(catalog?.page ?? 1)}>다시 시도</button>
          </div>
        )}
        {!catalogError && list.length === 0 && !loading && (
          <div className="state-box" role="status">보여드릴 상품이 없어요.</div>
        )}
        {list.length === 0 && loading && (
          <ol className="product-grid" aria-busy="true" aria-label={showingResults ? "이 대화에서 찾은 상품을 불러오는 중" : "상품을 불러오는 중"}>
            {Array.from({ length: 8 }, (_, i) => (
              <li key={i} className="product-card skeleton" aria-hidden="true">
                <div className="thumb" />
                <span className="sk-line short" />
                <span className="sk-line" />
                <span className="sk-line" />
                <span className="sk-btn" />
              </li>
            ))}
          </ol>
        )}

        <ol className="product-grid" aria-busy={loading}>
          {list.map((p, i) => (
            <ProductCard
              key={p.product_id}
              product={p}
              rank={i + 1}
              numbered={showingResults}
              quantity={quantityOf(p.product_id)}
              busy={cartBusy === p.product_id}
              sessionId={sessionId}
              onOpen={() => overlay.open({ product: p.product_id, rank: i + 1 })}
              onAdd={() => addToCart(p.product_id)}
            />
          ))}
        </ol>

        {!showingResults && catalog && (
          <nav className="pager" aria-label="페이지">
            <span className="caption">
              {catalog.page.toLocaleString("ko-KR")} / {catalog.total_pages.toLocaleString("ko-KR")} 페이지
            </span>
            <button type="button" className="btn btn-secondary" disabled={!catalog.has_previous || catalogLoading} onClick={() => goToPage(catalog.page - 1)}>
              이전
            </button>
            <button type="button" className="btn btn-secondary" disabled={!catalog.has_next || catalogLoading} onClick={() => goToPage(catalog.page + 1)}>
              다음
            </button>
          </nav>
        )}
      </div>
    </section>
  );
}

function ProductCard({
  product: p, rank, numbered, quantity, busy, sessionId, onOpen, onAdd,
}: {
  product: Product;
  rank: number;
  numbered: boolean;
  quantity: number;
  busy: boolean;
  sessionId: string | null;
  onOpen: () => void;
  onAdd: () => void;
}) {
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || impressed.has(p.product_id)) return;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting) || impressed.has(p.product_id)) return;
      impressed.add(p.product_id);
      sendEvent("product_impression", p.product_id, { sessionId, context: { rank } });
      io.disconnect();
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [p.product_id, rank, sessionId]);

  const source = tactileSourceLabel(p.tactile_target_source);

  return (
    <li ref={ref} className="product-card">
      <div className="thumb">
        {numbered && <span className="rank-badge" aria-hidden="true">{rank}</span>}
        <ProductImage product={p} />
      </div>
      <button type="button" className="product-info" onClick={onOpen}>
        <span className="brand-name">
          {numbered && <span className="sr-only">{rank}번, </span>}
          {categoryLabel(p.category)}
          {source && <> · {source}</>}
        </span>
        <span className="name display">{p.title}</span>
      </button>
      <div className="card-actions">
        <button
          type="button"
          className={`btn btn-secondary add${quantity ? " is-added" : ""}`}
          disabled={busy}
          aria-busy={busy}
          onClick={onAdd}
        >
          {quantity ? `담김 ${quantity}` : "담기"}
        </button>
        <button type="button" className="btn btn-secondary btn-icon sm" aria-label={`${p.title} 상세`} onClick={onOpen}>
          <ArrowUpRightIcon weight="bold" size={14} />
        </button>
      </div>
    </li>
  );
}
