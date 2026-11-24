import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@tiptap/react', 'date-fns'],
  },
  async redirects() {
    // Pages removed in cleanup now land on the dashboard instead of crashing
    const gone = ['showcase', 'reviews', 'contributions', 'templates', 'gantt', 'kanban', 'search', 'export'];
    return gone.map((page) => ({
      source: `/${page}/:path*`,
      destination: '/dashboard',
      permanent: false,
    }));
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Content-Type", value: "application/manifest+json" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default withAnalyzer(nextConfig);
