"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MinusIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import * as API from "@/lib/api/endpoints";
import { errorMessage } from "@/lib/api/client";
import type { ProductDetail } from "@/lib/api/types";
import { categoryLabel, preferenceLabel, preferenceMeta, tactileSourceLabel } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { resetOverlayHistory, useOverlayNav } from "@/lib/overlay";
import ProductImage from "@/components/ProductImage";

export default function Overlays() {
  const params = useSearchParams();
  const productId = params.get("product");
  const rank = Number(params.get("rank")) || undefined;
  const sheet = params.get("sheet");

  useEffect(() => {
    if (!productId && !sheet) resetOverlayHistory();
  }, [productId, sheet]);

  if (productId) return <DetailDialog key={productId} productId={productId} rank={rank} />;
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

// Guards against React StrictMode's dev double-mount sending the click twice.
let lastClick = { id: "", at: 0 };

function DetailDialog({ productId, rank }: { productId: string; rank?: number }) {
  const overlay = useOverlayNav();
  const { addToCart, quantityOf, cartBusy, sessionId } = useStore();
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    API.products.detail(productId)
      .then((d) => { if (alive) setDetail(d); })
      .catch((e) => { if (alive) setError(errorMessage(e)); });
    return () => { alive = false; };
  }, [productId]);

  // product_click on open; product_dwell with the time actually spent when it closes.
  useEffect(() => {
    const opened = Date.now();
    if (lastClick.id !== productId || opened - lastClick.at > 1000) {
      lastClick = { id: productId, at: opened };
      sendEvent("product_click", { rank });
    }
    return () => {
      const dwell = Date.now() - opened;
      if (dwell >= 500) sendEvent("product_dwell", { dwell_ms: Math.min(dwell, 300000) });
    };
    function sendEvent(type: "product_click" | "product_dwell", context: Record<string, number | undefined>) {
      const clean = Object.fromEntries(Object.entries(context).filter(([, v]) => v !== undefined)) as Record<string, number>;
      API.sendEvent(type, productId, { sessionId, context: Object.keys(clean).length ? clean : undefined });
    }
    // sessionId only labels the event; re-sending on session change would double count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, rank]);

  const product = detail?.product;
  const profile = detail?.tactile_profile;
  const source = tactileSourceLabel(profile?.source ?? product?.tactile_target_source);
  const quantity = quantityOf(productId);

  return (
    <Dialog labelledBy="detail-title" onClose={overlay.close}>
      <div className="dialog-head">
        <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
          <span className="caption">
            {rank ? `${rank}번 · ` : ""}{product ? categoryLabel(product.category) : "상품"}
          </span>
          <h2 id="detail-title" className="dialog-title" style={{ margin: 0 }}>
            {product?.title ?? (error ? "상품을 불러오지 못했어요" : "불러오는 중…")}
          </h2>
        </div>
        <CloseButton onClick={overlay.close} />
      </div>

      {error && <p className="dialog-body" role="alert">{error}</p>}

      {product && (
        <>
          <div className="detail-image">
            <ProductImage product={product} eager />
          </div>

          <section className="tactile" aria-labelledby="tactile-title">
            <div className="tactile-head">
              <h3 id="tactile-title">촉감</h3>
              {source && <span className="tag tag-source">{source}</span>}
            </div>
            {profile?.strongest.length ? (
              // Spec: show label_ko only — never the probability numbers.
              <ul className="tactile-chips">
                {profile.strongest.map((t) => <li key={t.class}>{t.label_ko.trim()}</li>)}
              </ul>
            ) : (
              <p className="caption">촉감 정보가 아직 없어요.</p>
            )}
            {profile?.note && <p className="caption">{profile.note.trim()}</p>}
          </section>

          {detail.related.length > 0 && (
            <section aria-label="비슷한 상품">
              <h3 className="section-title">비슷한 상품</h3>
              <ul className="related">
                {detail.related.slice(0, 6).map((r) => (
                  <li key={r.product_id}>
                    <button
                      type="button"
                      className="ref-btn"
                      onClick={() => {
                        API.sendEvent("similar_product_click", r.product_id, { sessionId });
                        overlay.swap({ product: r.product_id });
                      }}
                    >
                      <span className="name">{r.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <div className="dialog-actions">
        <button type="button" className="btn btn-secondary" onClick={overlay.close}>닫기</button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!product || cartBusy === productId}
          onClick={async () => {
            await addToCart(productId);
            overlay.swap({ sheet: "cart" });
          }}
        >
          {quantity ? `하나 더 담기 (${quantity})` : "장바구니에 담기"}
        </button>
      </div>
    </Dialog>
  );
}

function CartDialog() {
  const overlay = useOverlayNav();
  const { cart, cartBusy, refreshCart, setQuantity } = useStore();

  useEffect(() => { refreshCart(); }, [refreshCart]);

  const items = cart?.items ?? [];

  return (
    <Dialog labelledBy="cart-title" onClose={overlay.close}>
      <div className="dialog-head" style={{ alignItems: "center" }}>
        <h2 id="cart-title" className="dialog-title" style={{ margin: 0 }}>장바구니</h2>
        <CloseButton onClick={overlay.close} />
      </div>

      {!cart && <p className="dialog-body" role="status">불러오는 중…</p>}
      {cart && items.length === 0 && <p className="dialog-body">담은 상품이 없습니다.</p>}

      <ul className="row-list">
        {items.map((item) => {
          const busy = cartBusy === item.product_id;
          return (
            <li key={item.product_id} className="row">
              <button
                type="button"
                className="cart-thumb"
                aria-label={`${item.product.title} 상세`}
                onClick={() => overlay.swap({ product: item.product_id })}
              >
                <ProductImage product={item.product} />
              </button>
              <div className="row-text">
                <span className="clamp-2">{item.product.title}</span>
                <span>{categoryLabel(item.product.category)}</span>
              </div>
              <div className="qty" aria-busy={busy}>
                <button type="button" className="btn btn-secondary btn-icon xs" aria-label="수량 감소" disabled={busy || item.quantity <= 1} onClick={() => setQuantity(item.product_id, item.quantity - 1)}>
                  <MinusIcon weight="bold" size={13} />
                </button>
                <span aria-live="polite">{item.quantity}</span>
                <button type="button" className="btn btn-secondary btn-icon xs" aria-label="수량 증가" disabled={busy || item.quantity >= 20} onClick={() => setQuantity(item.product_id, item.quantity + 1)}>
                  <PlusIcon weight="bold" size={13} />
                </button>
              </div>
              <button type="button" className="btn btn-ghost is-quiet" style={{ fontSize: 12 }} disabled={busy} onClick={() => setQuantity(item.product_id, 0)}>삭제</button>
            </li>
          );
        })}
      </ul>

      {/* No checkout API yet (spec: 구매 버튼은 비활성) */}
      <div className="dialog-actions">
        <button type="button" className="btn btn-primary" disabled title="구매 기능은 준비 중이에요">
          구매하기 (준비 중)
        </button>
      </div>
    </Dialog>
  );
}

function PrefsDialog() {
  const overlay = useOverlayNav();
  const { prefs, prefsError, refreshPrefs, togglePrefActive, forgetPref } = useStore();

  useEffect(() => { refreshPrefs(); }, [refreshPrefs]);

  return (
    <Dialog labelledBy="prefs-title" onClose={overlay.close}>
      <div className="dialog-head" style={{ alignItems: "center" }}>
        <h2 id="prefs-title" className="dialog-title" style={{ margin: 0 }}>내 취향</h2>
        <CloseButton onClick={overlay.close} />
      </div>
      <p className="dialog-body">대화에서 모은 기준입니다. 끄거나 지울 수 있고, 다음 추천부터 반영돼요.</p>

      {prefsError && <p className="dialog-body" role="alert">{prefsError}</p>}
      {!prefs && !prefsError && <p className="dialog-body" role="status">불러오는 중…</p>}
      {prefs && prefs.length === 0 && (
        <p className="caption">아직 저장된 취향이 없어요. 대화에서 &ldquo;얇은&rdquo;, &ldquo;검은색&rdquo; 같은 조건을 말하면 자동으로 저장돼요.</p>
      )}

      <ul className="row-list">
        {prefs?.map((p) => {
          const active = p.active !== false;
          return (
            <li key={p.preference_id} className={`row${active ? "" : " is-inactive"}`}>
              <div className="row-text">
                <span>{preferenceLabel(p)}</span>
                <span>{active ? preferenceMeta(p) : `꺼짐 · ${preferenceMeta(p)}`}</span>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ minHeight: 30, fontSize: 12, marginLeft: "auto" }}
                aria-pressed={!active}
                onClick={() => togglePrefActive(p)}
              >
                {active ? "끄기" : "켜기"}
              </button>
              <button type="button" className="btn btn-ghost is-quiet" style={{ fontSize: 12 }} onClick={() => forgetPref(p.preference_id)}>잊기</button>
            </li>
          );
        })}
      </ul>
    </Dialog>
  );
}
