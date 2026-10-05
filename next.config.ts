import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 85],
    formats: ["image/avif", "image/webp"],
    // YouTube thumbnails for the film cards (Films.tsx)
    remotePatterns: [new URL("https://i.ytimg.com/vi/**")],
  },
};

export default nextConfig;
