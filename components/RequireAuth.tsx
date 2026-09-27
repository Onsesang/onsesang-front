"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

/** Sends signed-out visitors (no token, or a 401 at any point) to /login. */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { authStatus } = useStore();

  useEffect(() => {
    if (authStatus === "anonymous") router.replace("/login");
  }, [authStatus, router]);

  if (authStatus !== "authenticated") {
    return (
      <div className="boot" role="status">
        <span className="brand">onsesang</span>
        <span>불러오는 중…</span>
      </div>
    );
  }
  return <>{children}</>;
}
