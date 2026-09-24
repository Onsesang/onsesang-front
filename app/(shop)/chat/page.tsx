import type { Metadata } from "next";
import ProductList from "@/components/shop/ProductList";

export const metadata: Metadata = { title: "대화 · onsesang" };

// The chat column lives in the shop layout. On desktop both panes are visible,
// so this route still renders the list; on compact screens the layout shows chat only.
export default function ChatPage() {
  return <ProductList />;
}
