import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = { title: "로그인 · onsesang" };

export default function LoginPage() {
  return <AuthForm mode="signin" />;
}
