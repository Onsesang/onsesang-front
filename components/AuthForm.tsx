"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { errorMessage } from "@/lib/api/client";
import { useStore } from "@/lib/store";

export default function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const { login, register } = useStore();
  const signUp = mode === "signup";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "").trim();
    const remember = form.get("remember") === "on";

    setPending(true);
    setError(null);
    try {
      // Onboarding only runs right after sign-up; logging in always goes straight to shopping
      // (settings stay reachable from 설정 in the sidebar).
      if (signUp) {
        await register(email, password, name, remember);
        router.push("/onboarding/1");
      } else {
        await login(email, password, remember);
        router.push("/products");
      }
    } catch (err) {
      setError(errorMessage(err));
      setPending(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={onSubmit}>
        <div className="auth-brand">
          <span className="brand">onsesang</span>
          <span className="tagline">소재 기준으로 옷을 좁혀주는 쇼핑 도우미</span>
        </div>

        <nav className="seg" aria-label="로그인 또는 회원가입" style={{ alignSelf: "flex-start" }}>
          <Link className="seg-opt" href="/login" replace aria-current={!signUp ? "page" : undefined}>로그인</Link>
          <Link className="seg-opt" href="/signup" replace aria-current={signUp ? "page" : undefined}>회원가입</Link>
        </nav>

        <div className="field">
          <label htmlFor="em">이메일</label>
          <input id="em" name="email" className="input" type="email" required autoComplete="email" placeholder="you@example.com" />
        </div>
        <div className="field">
          <label htmlFor="pw">비밀번호</label>
          <input
            id="pw"
            name="password"
            className="input"
            type="password"
            required
            minLength={signUp ? 8 : undefined}
            maxLength={256}
            autoComplete={signUp ? "new-password" : "current-password"}
            placeholder={signUp ? "8자 이상" : undefined}
          />
        </div>
        {signUp && (
          <div className="field">
            <label htmlFor="nm">이름</label>
            <input id="nm" name="name" className="input" type="text" required maxLength={80} autoComplete="name" placeholder="이름" />
          </div>
        )}

        <div className="auth-meta">
          <label className="radio">
            <input type="checkbox" name="remember" defaultChecked />
            <span className="dot" />
            로그인 유지
          </label>
        </div>

        <button type="submit" className="btn btn-primary btn-block auth-submit" disabled={pending} aria-busy={pending}>
          {pending ? (signUp ? "가입하는 중…" : "로그인하는 중…") : signUp ? "가입하고 시작하기" : "로그인"}
        </button>

        {error && (
          <div className="auth-error" role="alert">
            <WarningCircleIcon weight="bold" size={15} style={{ marginTop: 1, flex: "none" }} />
            <span>{error}</span>
          </div>
        )}
      </form>
    </main>
  );
}
