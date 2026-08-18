/**
 * Configuración central del backend Spring Boot.
 *
 * - `NEXT_PUBLIC_API_URL`: URL pública del backend (ej. https://api.mitienda.com).
 *   Si está vacía, las llamadas API pasan por los rewrites de Next.js (mismo origen)
 *   y el destino de esos rewrites se configura con `BACKEND_API_URL` en next.config.mjs
 *   (por defecto http://localhost:8080).
 *
 * En local (sin env) todo sigue apuntando a http://localhost:8080 como antes.
 * En producción configura `NEXT_PUBLIC_API_URL` con HTTPS para que el navegador
 * no bloquee peticiones mixtas (mixed content) ni muestre el sitio como inseguro.
 */

/** Base vacía = las rutas usan prefijo `api/...` y Next rewrites a localhost:8080/api */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

/** URL del backend para llamadas que el navegador hace directo (OAuth, SSE, imágenes). */
export const BACKEND_URL = API_BASE_URL || "http://localhost:8080";

/** Construye una URL absoluta hacia el backend. */
export function backendUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND_URL}${p}`;
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
