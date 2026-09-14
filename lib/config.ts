/**
 * Configuración central del backend Spring Boot.
 *
 * Variable de entorno canónica: `BACKEND_API_URL` (server-side, NO expuesta al navegador).
 *   - La defines en Vercel (Environment Variable normal, scope Production)
 *     apuntando al backend real, p.ej. `https://api-project-vh4u.onrender.com`.
 *   - La usan los rewrites de next.config.mjs: el navegador llama al mismo origen
 *     (`/api/...`) y Next.js reenvía al backend → sin CORS y sin exponer la URL.
 *
 * NO usar `NEXT_PUBLIC_API_URL`: las variables `NEXT_PUBLIC_*` se inyectan en el
 * bundle del navegador (Vercel te avisa de que quedan expuestas). Solo se deja el
 * fallback por compatibilidad con configuraciones antiguas.
 *
 * Si ni `BACKEND_API_URL` ni `NEXT_PUBLIC_API_URL` están definidas:
 *   - En producción el fallback es el backend de Render (https://api-project-vh4u.onrender.com),
 *     para que las peticiones nunca dependan de rutas locales.
 *   - En desarrollo el fallback sigue siendo http://localhost:8080 (backend local).
 */

const DEFAULT_BACKEND_URL =
  process.env.NODE_ENV === "production"
    ? "https://api-project-vh4u.onrender.com"
    : "http://localhost:8080";

/** Base vacía = las rutas usan prefijo `api/...` y Next rewrites al backend de config. */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

/** URL del backend para llamadas que el navegador hace directo (OAuth, SSE, imágenes). */
export const BACKEND_URL = API_BASE_URL || DEFAULT_BACKEND_URL;

/** Construye una URL absoluta hacia el backend. */
export function backendUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND_URL}${p}`;
}

/**
 * Inicia Google OAuth yendo DIRECTAMENTE al backend (URL absoluta).
 * El navegador llama a Spring Security sin depender del rewrite de Next.js.
 */
export function googleOAuthStartPath(role: "admin" | "client"): string {
  const registration = role === "admin" ? "google-admin" : "google-client";
  const base = (process.env.BACKEND_API_URL || BACKEND_URL || "").replace(/\/+$/, "");
  return `${base}/oauth2/authorization/${registration}`;
}

/**
 * Sube http→https cuando la página se sirve por https.
 * Evita que el navegador bloquee imágenes/peticiones mixtas (mixed content),
 * que es lo que Chrome marca como "no segura" y rompe las fotos de Google.
 */
export function toHttps(url: string): string {
  if (
    url.startsWith("http://") &&
    typeof window !== "undefined" &&
    window.location.protocol === "https:"
  ) {
    return `https://${url.slice("http://".length)}`;
  }
  return url;
}

/**
 * Normaliza fotos entregadas por Google OAuth.
 * Google sirve avatares desde dominios HTTPS; nunca debemos guardar o renderizar
 * una variante HTTP porque el navegador la bloquea cuando la app usa HTTPS.
 */
export function normalizeGooglePhotoUrl(url?: string | null): string {
  if (!url) return "";
  const value = url.trim();
  if (!value) return "";

  if (/^http:\/\/(?:[^/]+\.)?(googleusercontent\.com|googleapis\.com|gstatic\.com|google\.com)\//i.test(value)) {
    return `https://${value.slice("http://".length)}`;
  }

  return toHttps(value);
}

/**
 * Resuelve la URL de un medio (imagen de producto o foto de perfil).
 * - URLs absolutas (http/https/data/blob) se devuelven tal cual (con https si aplica).
 * - Rutas relativas: si hay API_BASE_URL se antepone; si no se dejan relativas
 *   para que las resuelva el rewrite de Next.js.
 */
export function resolveMediaUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("data:") || pathOrUrl.startsWith("blob:")) return pathOrUrl;
  if (/^https?:\/\//i.test(pathOrUrl)) return toHttps(pathOrUrl);

  const p = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return API_BASE_URL ? `${API_BASE_URL}${p}` : p;
}

/**
 * Optimiza URLs de Cloudinary para servir WebP/AVIF automático (f_auto),
 * calidad óptima (q_auto) y, opcionalmente, un ancho máximo (w_).
 * Solo afecta a URLs de res.cloudinary.com; cualquier otra URL se devuelve intacta.
 *
 * Ejemplo:
 *   https://res.cloudinary.com/xyz/image/upload/v123/foto.png
 *   → https://res.cloudinary.com/xyz/image/upload/f_auto,q_auto,w_400/v123/foto.png
 */
export function optimizeCloudinaryUrl(
  url: string | null | undefined,
  options: { width?: number } = {}
): string {
  if (!url || !url.includes("res.cloudinary.com")) return url ?? "";

  const [base, query] = url.split("?");
  const marker = "/image/upload/";
  const idx = base.indexOf(marker);
  if (idx === -1) return url;

  const transforms = ["f_auto", "q_auto"];
  if (options.width) transforms.push(`w_${Math.round(options.width)}`);

  const insertAt = idx + marker.length;
  const optimized = `${base.slice(0, insertAt)}${transforms.join(",")}/${base.slice(insertAt)}`;
  return query ? `${optimized}?${query}` : optimized;
}
