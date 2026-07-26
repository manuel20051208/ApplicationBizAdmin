/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
      },
      {
        source: "/sale/:path*",
        destination: "http://localhost:8080/sale/:path*",
      },
      {
        source: "/dashboard-controller/:path*",
        destination: "http://localhost:8080/dashboard-controller/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: "http://localhost:8080/uploads/:path*",
      },
      {
        source: "/api/auth/:path*",
        destination: "http://localhost:8080/api/auth/:path*",
      },
    ];
  },
};

export default nextConfig;
