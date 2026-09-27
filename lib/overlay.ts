"use client";

import { usePathname, useRouter } from "next/navigation";

// Overlays (product detail, cart, preferences) live in the query string so they
// are linkable and the back button closes them: ?product=p01, ?sheet=cart, ?sheet=prefs.
// rank = the product's 1-based screen position, forwarded to the click event (spec 행동 이벤트).
export type OverlayParams = { product: string; rank?: number } | { sheet: "cart" | "prefs" };

// True while the current overlay was opened by an in-app push, so closing can
// pop history instead of stacking another entry. A deep link starts with false.
let openedInApp = false;

export function resetOverlayHistory() {
  openedInApp = false;
}

export function useOverlayNav() {
  const router = useRouter();
  const pathname = usePathname();
  const href = (params: OverlayParams) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v !== undefined) qs.set(k, String(v));
    return `${pathname}?${qs}`;
  };

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
