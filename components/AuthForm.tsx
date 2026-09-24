"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { WarningCircleIcon } from "@phosphor-icons/react";

export default function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const signUp = mode === "signup";
  // The prototype never shows a failed login; the banner is kept for the real API's 401.
  const authError = false;

  return (
    <main className="auth-page">
      <form
        className="auth-card"
        onSubmit={(e) => {
          e.preventDefault();
          router.push("/onboarding/1");
        }}
      >
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
          <input id="em" className="input" type="email" autoComplete="email" defaultValue="onsesang@onsesang.kr" />
        </div>
        <div className="field">
          <label htmlFor="pw">비밀번호</label>
          <input id="pw" className="input" type="password" autoComplete={signUp ? "new-password" : "current-password"} defaultValue="passwordhere" />
        </div>
        {signUp && (
          <div className="field">
            <label htmlFor="nm">이름</label>
            <input id="nm" className="input" type="text" autoComplete="name" placeholder="이유정" />
          </div>
        )}

        <div className="auth-meta">
          <label className="radio">
            <input type="checkbox" defaultChecked />
            <span className="dot" />
            로그인 유지
          </label>
        </div>

        <button type="submit" className="btn btn-primary btn-block auth-submit">
          {signUp ? "가입하고 시작하기" : "로그인"}
        </button>

        {authError && (
          <div className="auth-error" role="alert">
            <WarningCircleIcon weight="bold" size={15} style={{ marginTop: 1, flex: "none" }} />
            <span>401 · 이메일 또는 비밀번호가 맞지 않습니다.</span>
          </div>
        )}
      </form>
    </main>
  );
}
