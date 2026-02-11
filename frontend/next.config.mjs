/** @type {import('next').NextConfig} */
import bundleAnalyzer from "@next/bundle-analyzer";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
let apiOrigin;
try {
  apiOrigin = new URL(apiUrl);
} catch {
  apiOrigin = null;
}

const nextConfig = {
  async rewrites() {
    return [
      // Proxy /uploads/* to the backend so image URLs work for all clients (same-origin requests)
      { source: "/uploads/:path*", destination: `${apiUrl}/uploads/:path*` },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/uploads/**",
      },
      ...(apiOrigin
        ? [
            {
              protocol: apiOrigin.protocol.replace(":", ""),
              hostname: apiOrigin.hostname,
              port: apiOrigin.port || "",
              pathname: "/uploads/**",
            },
          ]
        : []),
    ],
  },
};

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(nextConfig);
