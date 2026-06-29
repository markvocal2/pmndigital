import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Allow larger image/video uploads via Server Actions (default is 1 MB).
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
