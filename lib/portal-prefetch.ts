import { warmCache, CACHE_KEYS, CACHE_TTL } from "@/lib/api/apiCache"
import { fetchClientProfile, fetchClientHistory } from "@/lib/services/clientService"
import { fetchActiveProductsWithImages, fetchProducts } from "@/lib/services/productService"

async function fetchPortalProducts() {
  try {
    const products = await fetchActiveProductsWithImages()
    if (Array.isArray(products) && products.length > 0) return products
  } catch {
    // El endpoint con imágenes puede no estar disponible en instalaciones antiguas.
  }
  return fetchProducts(100)
}

/** Precalienta una ruta del portal en segundo plano, igual que el panel admin. */
export function warmPortalRouteCache(href: string) {
  if (href === "/portal") {
    warmCache(CACHE_KEYS.PORTAL_PRODUCTOS, fetchPortalProducts, CACHE_TTL.PORTAL_PRODUCTOS)
  } else if (href === "/portal/compras") {
    warmCache(CACHE_KEYS.PORTAL_COMPRAS, fetchClientHistory, CACHE_TTL.PORTAL_COMPRAS)
  } else if (href === "/portal/configuracion") {
    warmCache(CACHE_KEYS.PORTAL_PERFIL, fetchClientProfile, CACHE_TTL.PORTAL_PERFIL)
  }
}

export { fetchPortalProducts }
