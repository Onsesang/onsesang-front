"use client";

import { ArrowUpRightIcon, BagIcon } from "@phosphor-icons/react";
import { BY_ID, PRODUCTS, won } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useOverlayNav } from "@/lib/overlay";
import ImageSlot from "@/components/ImageSlot";

export default function ProductList() {
  const overlay = useOverlayNav();
  const { filter, setFilter, cart, cartAdd, cartCount } = useStore();
  const list = (filter ? filter.map((id) => BY_ID[id]) : PRODUCTS).filter(Boolean);

  return (
    <section className="list-pane" aria-labelledby="list-title">
      <div className="pane-head">
        <h1 id="list-title">{filter ? "대화로 좁힌 결과" : "전체 상품"}</h1>
        <span className="count">{list.length}개</span>
        {filter && (
          <button type="button" className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => setFilter(null)}>
            전체 보기
          </button>
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

      <div className="list-scroll">
        <div className="product-grid">
          {list.map((p) => {
            const inCart = cart[p.id];
            const openDetail = () => overlay.open({ product: p.id });
            return (
              <article key={p.id} className="product-card">
                <div className="thumb">
                  <ImageSlot label={`${p.name} 대표 이미지`} />
                </div>
                <button type="button" className="product-info" onClick={openDetail}>
                  <span className="brand-name">{p.brand}</span>
                  <span className="name display">{p.name}</span>
                  <span className="material">{p.material}</span>
                </button>
                <div className="price-row">
                  <span className="price">{won(p.price)}</span>
                  <span className="rating">★ {p.rating} ({p.reviews})</span>
                </div>
                <div className="card-actions">
                  <button
                    type="button"
                    className={`btn btn-secondary add${inCart ? " is-added" : ""}`}
                    onClick={() => cartAdd(p.id)}
                  >
                    {inCart ? `담김 ${inCart}` : "담기"}
                  </button>
                  <button type="button" className="btn btn-secondary btn-icon sm" aria-label={`${p.name} 상세`} onClick={openDetail}>
                    <ArrowUpRightIcon weight="bold" size={14} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        <div className="pager">
          <span className="caption">{list.length}개 중 1–{list.length} 표시</span>
          <button type="button" className="btn btn-secondary" disabled>이전</button>
          <button type="button" className="btn btn-secondary" disabled>다음</button>
        </div>
      </div>
    </section>
  );
}
