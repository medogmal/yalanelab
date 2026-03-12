import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  // Fix: allow mobile dev access
  allowedDevOrigins: ["192.168.1.9"],
  async redirects() {
    return [
      {
        source: "/avatars/default.png",
        destination: "/branding/1772931007554_logo.png",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
