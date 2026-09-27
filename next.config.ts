import type { NextConfig } from "next";
import { BACKEND_ORIGIN } from "./lib/api/config";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/", destination: "/signup", permanent: false },
      { source: "/onboarding", destination: "/onboarding/1", permanent: false },
    ];
  },
  // Dev proxy for the agent API (see lib/api/client.ts for why production calls it directly).
  async rewrites() {
    const target = process.env.NEXT_PUBLIC_API_BASE_URL || BACKEND_ORIGIN;
    return [{ source: "/agent/v1/:path*", destination: `${target}/agent/v1/:path*` }];
  },
};

export default nextConfig;
