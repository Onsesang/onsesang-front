import type { Metadata } from "next";
import ProductList from "@/components/shop/ProductList";

export const metadata: Metadata = { title: "상품 · onsesang" };

export default function ProductsPage() {
  return <ProductList />;
}
