import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Onboarding from "@/components/Onboarding";
import { STEPS } from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return STEPS.map((_, i) => ({ step: String(i + 1) }));
}

export const metadata: Metadata = { title: "취향 설정 · onsesang" };

export default async function OnboardingPage({ params }: PageProps<"/onboarding/[step]">) {
  const { step } = await params;
  const index = Number(step) - 1;
  if (!STEPS[index]) notFound();
  return <Onboarding index={index} />;
}
