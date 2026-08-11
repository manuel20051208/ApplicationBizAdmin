/**
 * apiCache.ts — Caché in-memory ultra-ligero con stale-while-revalidate.
 *
 * Devuelve datos cacheados inmediatamente mientras revalida en background.
 * TTL configurable. Invalidación manual para mutaciones.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  /** Indica que ya se inició una revalidación en background */
  revalidating: boolean;
}

const cache = new Map<string, CacheEntry<any>>();

/** Listeners para notificar cuando un cache entry se actualiza */
type CacheListener = (key: string) => void;
const listeners = new Set<CacheListener>();

export function onCacheUpdate(listener: CacheListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners(key: string) {
  listeners.forEach((l) => l(key));
}

/**
 * Obtiene datos del caché o los fetcha.
 * - Si hay datos en caché y no están expirados, los devuelve inmediatamente.
 * - Si están expirados (stale), devuelve los stale Y revalida en background.
 * - Si no hay caché, fetcha y espera.
 *
 * @param key Clave única (ej: "dashboard", "ventas-50")
 * @param fetcher Función que retorna la Promise con los datos frescos
 * @param ttlMs Time-to-live en milisegundos (default: 60s)
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 60_000
): Promise<T> {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  const now = Date.now();

  // Cache HIT y fresh
  if (entry && now - entry.timestamp < ttlMs) {
    return entry.data;
  }

  // Cache HIT pero stale → devolver stale y revalidar en background
  if (entry && !entry.revalidating) {
    entry.revalidating = true;
    // Revalidar en background (no await)
    fetcher()
      .then((freshData) => {
        cache.set(key, { data: freshData, timestamp: Date.now(), revalidating: false });
        notifyListeners(key);
      })
      .catch(() => {
        entry.revalidating = false;
      });
    return entry.data;
  }

  // Stale y ya revalidando → devolver stale
  if (entry) {
    return entry.data;
  }

  // Cache MISS → fetch y esperar
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now(), revalidating: false });
  return data;
}

/**
 * Lee datos del caché sin fetchear. Retorna undefined si no hay datos.
 * Útil para pre-popular skeletons con datos anteriores.
 */
export function readCache<T>(key: string): T | undefined {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  return entry?.data;
}

/**
 * Invalida una o varias claves del caché.
 * Llamar después de mutaciones (crear, editar, eliminar).
 */
export function invalidateCache(...keys: string[]) {
  for (const key of keys) {
    cache.delete(key);
  }
}

/**
 * Invalida todas las claves que empiezan con un prefijo.
 * Ej: invalidateCacheByPrefix("ventas") limpia "ventas-50", "ventas-100", etc.
 */
export function invalidateCacheByPrefix(prefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Pre-calienta el caché sin bloquear.
 * Ideal para llamar al hacer hover en el sidebar.
 */
export function warmCache<T>(key: string, fetcher: () => Promise<T>, ttlMs: number = 60_000) {
  const entry = cache.get(key);
  const now = Date.now();
  // Solo fetchear si no hay datos o están stale
  if (!entry || now - entry.timestamp >= ttlMs) {
    fetcher()
      .then((data) => {
        cache.set(key, { data, timestamp: Date.now(), revalidating: false });
      })
      .catch(() => {
        // Silencioso — es un prefetch optimista
      });
  }
}

/** Cache keys constants para consistencia */
export const CACHE_KEYS = {
  DASHBOARD: "dashboard-data",
  VENTAS: (size: number) => `ventas-${size}`,
  CLIENTES: (adminId: number) => `clientes-${adminId}`,
  PRODUCTOS: (size: number) => `productos-${size}`,
} as const;

/** TTL defaults (ms) */
export const CACHE_TTL = {
  DASHBOARD: 60_000,     // 60s
  VENTAS: 30_000,        // 30s
  CLIENTES: 30_000,      // 30s
  PRODUCTOS: 30_000,     // 30s
} as const;
