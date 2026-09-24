"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { CaretLeftIcon, CaretRightIcon, MinusIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { BY_ID, won, type Product } from "@/lib/data";
import { useStore } from "@/lib/store";
import { resetOverlayHistory, useOverlayNav } from "@/lib/overlay";
import ImageSlot from "@/components/ImageSlot";

export default function Overlays() {
  const params = useSearchParams();
  const productId = params.get("product");
  const sheet = params.get("sheet");
  const product = productId ? BY_ID[productId] : undefined;

  useEffect(() => {
    if (!productId && !sheet) resetOverlayHistory();
  }, [productId, sheet]);

  if (product) return <DetailDialog product={product} />;
  if (sheet === "cart") return <CartDialog />;
  if (sheet === "prefs") return <PrefsDialog />;
  return null;
}

function Dialog({ labelledBy, onClose, children }: { labelledBy: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });

  // Mount-only: focus the dialog, close on Escape, return focus to the opener on unmount.
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

  return (
    <div className="dialog-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} className="dialog" role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="btn btn-secondary btn-icon" aria-label="닫기" onClick={onClick}>
      <XIcon weight="bold" size={15} />
    </button>
  );
}

const SHOTS = ["착용 컷", "정면", "소재 접사", "디테일"];

function DetailDialog({ product }: { product: Product }) {
  const overlay = useOverlayNav();
  const { cartAdd } = useStore();
  const gallery = useRef<HTMLDivElement>(null);
  const scrollGallery = (dir: 1 | -1) => {
    const g = gallery.current;
    const item = g?.firstElementChild as HTMLElement | null;
    if (g) g.scrollBy({ left: dir * ((item?.offsetWidth ?? 214) + 8), behavior: "smooth" });
  };

  return (
    <Dialog labelledBy="detail-title" onClose={overlay.close}>
      <div className="dialog-head">
        <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
          <span className="caption">{product.brand}</span>
          <h2 id="detail-title" className="dialog-title" style={{ margin: 0 }}>{product.name}</h2>
        </div>
        <CloseButton onClick={overlay.close} />
      </div>

      <div className="gallery-wrap">
        <div ref={gallery} className="gallery">
          {SHOTS.map((label) => (
            <div key={label} className="gallery-item">
              <ImageSlot label={label} />
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-secondary btn-icon sm gallery-nav prev" aria-label="이전 이미지" onClick={() => scrollGallery(-1)}>
          <CaretLeftIcon weight="bold" size={15} />
        </button>
        <button type="button" className="btn btn-secondary btn-icon sm gallery-nav next" aria-label="다음 이미지" onClick={() => scrollGallery(1)}>
          <CaretRightIcon weight="bold" size={15} />
        </button>
      </div>

      <div className="detail-price">
        <span className="price">{won(product.price)}</span>
        <span className="rating">★ {product.rating} · 리뷰 {product.reviews}</span>
      </div>

      <dl className="spec-list" style={{ margin: 0 }}>
        {product.specs.map((s) => (
          <div key={s.k} className="spec">
            <dt>{s.k}</dt>
            <dd>{s.v}</dd>
          </div>
        ))}
      </dl>

      <p className="dialog-body" style={{ lineHeight: 1.65 }}>{product.note}</p>

      <div className="dialog-actions">
        <button type="button" className="btn btn-secondary" onClick={overlay.close}>닫기</button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            cartAdd(product.id);
            overlay.swap({ sheet: "cart" });
          }}
        >
          장바구니에 담기
        </button>
      </div>
    </Dialog>
  );
}

function CartDialog() {
  const overlay = useOverlayNav();
  const { cart, cartAdd, cartDec, cartRemove } = useStore();
  const ids = Object.keys(cart);
  const total = ids.reduce((a, id) => a + BY_ID[id].price * cart[id], 0);

  return (
    <Dialog labelledBy="cart-title" onClose={overlay.close}>
      <div className="dialog-head" style={{ alignItems: "center" }}>
        <h2 id="cart-title" className="dialog-title" style={{ margin: 0 }}>장바구니</h2>
        <CloseButton onClick={overlay.close} />
      </div>

      {ids.length === 0 && <p className="dialog-body">담은 상품이 없습니다.</p>}

      <div className="row-list">
        {ids.map((id) => (
          <div key={id} className="row">
            <div className="row-text">
              <span>{BY_ID[id].name}</span>
              <span>{won(BY_ID[id].price)}</span>
            </div>
            <div className="qty">
              <button type="button" className="btn btn-secondary btn-icon xs" aria-label="수량 감소" onClick={() => cartDec(id)}>
                <MinusIcon weight="bold" size={13} />
              </button>
              <span aria-live="polite">{cart[id]}</span>
              <button type="button" className="btn btn-secondary btn-icon xs" aria-label="수량 증가" onClick={() => cartAdd(id)}>
                <PlusIcon weight="bold" size={13} />
              </button>
            </div>
            <button type="button" className="btn btn-ghost is-quiet" style={{ fontSize: 12 }} onClick={() => cartRemove(id)}>삭제</button>
          </div>
        ))}
      </div>

      <div className="cart-total">
        <span className="label">합계</span>
        <span className="value">{won(total)}</span>
      </div>
    </Dialog>
  );
}

function PrefsDialog() {
  const overlay = useOverlayNav();
  const { prefs, editPref, forgetPref } = useStore();

  return (
    <Dialog labelledBy="prefs-title" onClose={overlay.close}>
      <div className="dialog-head" style={{ alignItems: "center" }}>
        <h2 id="prefs-title" className="dialog-title" style={{ margin: 0 }}>내 취향</h2>
        <CloseButton onClick={overlay.close} />
      </div>
      <p className="dialog-body">대화에서 모은 기준입니다. 틀린 항목은 바꾸거나 지울 수 있습니다.</p>

      <div className="row-list">
        {prefs.map((p) => (
          <div key={p.id} className="row">
            <div className="row-text">
              <span>{p.label}</span>
              <span>{p.source}</span>
            </div>
            <button type="button" className="btn btn-secondary" style={{ minHeight: 30, fontSize: 12, marginLeft: "auto" }} onClick={() => editPref(p.id)}>
              수정
            </button>
            <button type="button" className="btn btn-ghost is-quiet" style={{ fontSize: 12 }} onClick={() => forgetPref(p.id)}>잊기</button>
          </div>
        ))}
      </div>
    </Dialog>
  );
}
