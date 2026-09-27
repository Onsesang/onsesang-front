import RequireAuth from "@/components/RequireAuth";
import ShopShell from "@/components/shop/ShopShell";

export default function ShopLayout({ children }: LayoutProps<"/">) {
  return (
    <RequireAuth>
      <ShopShell>{children}</ShopShell>
    </RequireAuth>
  );
}
