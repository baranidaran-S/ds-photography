import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 85],
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // YouTube thumbnails for the film cards (Films.tsx)
      new URL("https://i.ytimg.com/vi/**"),
      // every photo uploaded through the admin
      new URL("https://res.cloudinary.com/**"),
    ],
  },
};

export default nextConfig;
