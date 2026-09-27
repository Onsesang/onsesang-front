"use client";

import { useState } from "react";
import type { Product } from "@/lib/api/types";
import ImageSlot from "./ImageSlot";

// Spec: prefer remote_image_url (Amazon CDN). image_url is relative and currently 404s on
// the main server, so it is not used. alt is the product title for screen readers.
export default function ProductImage({ product, eager = false }: { product: Product; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  const src = product.remote_image_url;

  if (!src || failed) return <ImageSlot label="이미지 없음" alt={product.title} />;
  return (
    // Remote catalog images of arbitrary size; next/image optimization adds nothing here.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="product-img"
      src={src}
      alt={product.title}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
