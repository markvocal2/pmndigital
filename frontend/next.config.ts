import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Allow larger image uploads via Server Actions (default is 1 MB).
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
