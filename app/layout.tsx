import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { StoreProvider } from "@/lib/store";
import "./globals.css";
import "./screens.css";

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  weight: "45 920",
  display: "swap",
  variable: "--font-pretendard",
});

export const metadata: Metadata = {
  title: "onsesang", // one tab title everywhere; pages don't override it
  description: "소재 기준으로 옷을 좁혀주는 쇼핑 도우미",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
