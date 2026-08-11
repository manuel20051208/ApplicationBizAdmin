/** @type {import('next').NextConfig} */

// Destino del backend para los rewrites.
// En local apunta a http://localhost:8080; en producción configúralo con
// BACKEND_API_URL (o NEXT_PUBLIC_API_URL) apuntando al backend real.
const BACKEND = (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/+$/, "");

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: process.cwd(),
  },
  images: {
    unoptimized: true,
  },
  // Caché de router agresivo: las páginas visitadas se sirven del cache client-side
  experimental: {
    staleTimes: {
      dynamic: 60,  // Páginas dinámicas se cachean 60s en el router client
      static: 300,  // Páginas estáticas se cachean 5 min
    },
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
  async headers() {
    return [
      {
        // Imágenes de productos servidas vía el proxy hacia el backend.
        // Cache corto en navegador + largo en CDN, con revalidación en background.
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // Iconos/favicon: no llevan hash en el nombre pero cambian muy rara vez.
        source: "/(apple-icon|icon|icon-light-32x32|icon-dark-32x32)\\.(png|svg)$",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
