import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = { title: "회원가입 · onsesang" };

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
