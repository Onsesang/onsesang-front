import ProductList from "@/components/shop/ProductList";

// The chat column lives in the shop layout. On desktop the list sits beside it and shows what
// the conversation found; on compact screens the layout shows chat only.
export default function ChatPage() {
  return <ProductList showResults />;
}
