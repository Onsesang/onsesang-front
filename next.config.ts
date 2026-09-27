import type { NextConfig } from "next";
import { BACKEND_ORIGIN } from "./lib/api/config";

const nextConfig: NextConfig = {
  experimental: {
    // The proxy below cuts requests off at 30s by default; a chat turn may take longer and the
    // client allows 60s (lib/api/endpoints.ts), so let the client's timeout decide.
    proxyTimeout: 65_000,
  },
  async redirects() {
    return [
      { source: "/", destination: "/signup", permanent: false },
      { source: "/onboarding", destination: "/onboarding/1", permanent: false },
    ];
  },
  // Same-origin proxy for the agent API, used in development and by builds made with
  // NEXT_PUBLIC_API_BASE_URL="" (see lib/api/client.ts). A server that hosts the front next to
  // its own backend points it there at build time, e.g. API_PROXY_TARGET=http://127.0.0.1:8878
  // on the A100 fallback. Rewrites are fixed when `next build` runs.
  async rewrites() {
    const target = process.env.API_PROXY_TARGET || process.env.NEXT_PUBLIC_API_BASE_URL || BACKEND_ORIGIN;
    return [{ source: "/agent/v1/:path*", destination: `${target}/agent/v1/:path*` }];
  },
};

export default nextConfig;
