import ShopShell from "@/components/shop/ShopShell";

export default function ShopLayout({ children }: LayoutProps<"/">) {
  return <ShopShell>{children}</ShopShell>;
}
