import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Allow larger image/video uploads via Server Actions (default is 1 MB).
      // Keep >= the client cap in components/admin/ui.tsx and the Caddy
      // request_body.max_size label, or the request dies before Next sees it.
      bodySizeLimit: "200mb",
    },
  },
};

export default nextConfig;
