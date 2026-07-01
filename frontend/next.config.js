/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3001", "localhost:3000"],
    },
  },
  images: {
    domains: ["localhost"],
  },
  // Fix Cross-Origin-Opener-Policy so Firebase Google Sign-In popup can communicate back
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
