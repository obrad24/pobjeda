import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "pg",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "sportdc.net",
        pathname: "/img/club/**",
      },
    ],
  },
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
