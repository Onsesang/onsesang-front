import ProductList from "@/components/shop/ProductList";

// 전체 상품 always lists the catalog. ?view=results shows the current conversation's
// results instead — the phone chat links here, since on phones the list and chat don't share a screen.
export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const { view } = await searchParams;
  return <ProductList showResults={view === "results"} />;
}
