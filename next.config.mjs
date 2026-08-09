/** @type {import('next').NextConfig} */

// Destino del backend para los rewrites.
// En local apunta a http://localhost:8080; en producción configúralo con
// BACKEND_API_URL (o NEXT_PUBLIC_API_URL) apuntando al backend real.
const BACKEND = (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/+$/, "");

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
        destination: `${BACKEND}/api/:path*`,
      },
      {
        source: "/sale/:path*",
        destination: `${BACKEND}/sale/:path*`,
      },
      {
        source: "/dashboard-controller/:path*",
        destination: `${BACKEND}/dashboard-controller/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${BACKEND}/uploads/:path*`,
      },
      {
        source: "/api/auth/:path*",
        destination: `${BACKEND}/api/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
