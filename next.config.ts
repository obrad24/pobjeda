import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "pg",
  ],
  experimental: {
    // Default 1 MB; player photos are allowed up to 4 MB plus multipart overhead.
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "*.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "sportdc.net",
        pathname: "/img/club/**",
      },
    ],
  },
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
