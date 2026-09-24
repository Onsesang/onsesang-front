"use client";

import { usePathname, useRouter } from "next/navigation";

// Overlays (product detail, cart, preferences) live in the query string so they
// are linkable and the back button closes them: ?product=p01, ?sheet=cart, ?sheet=prefs.
export type OverlayParams = { product: string } | { sheet: "cart" | "prefs" };

// True while the current overlay was opened by an in-app push, so closing can
// pop history instead of stacking another entry. A deep link starts with false.
let openedInApp = false;

export function resetOverlayHistory() {
  openedInApp = false;
}

export function useOverlayNav() {
  const router = useRouter();
  const pathname = usePathname();
  const href = (params: OverlayParams) => `${pathname}?${new URLSearchParams(params)}`;

  return {
    open(params: OverlayParams) {
      openedInApp = true;
      router.push(href(params), { scroll: false });
    },
    swap(params: OverlayParams) {
      router.replace(href(params), { scroll: false });
    },
    close() {
      if (openedInApp) {
        openedInApp = false;
        router.back();
      } else {
        router.replace(pathname, { scroll: false });
      }
    },
  };
}
