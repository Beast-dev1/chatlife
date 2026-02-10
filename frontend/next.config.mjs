/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
let apiOrigin;
try {
  apiOrigin = new URL(apiUrl);
} catch {
  apiOrigin = null;
}

const nextConfig = {
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

export default nextConfig;
