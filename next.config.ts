import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/", destination: "/login", permanent: false },
      { source: "/onboarding", destination: "/onboarding/1", permanent: false },
    ];
  },
};

export default nextConfig;
