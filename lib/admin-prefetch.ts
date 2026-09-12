import { warmCache, CACHE_KEYS, CACHE_TTL } from "@/lib/api/apiCache"
import { fetchSalesItems } from "@/lib/services/saleService"
import { fetchClientsSummary } from "@/lib/services/clientService"
import { fetchAllProducts } from "@/lib/services/productService"
import { fetchDashboardData } from "@/lib/services/adminService"
import { getStoredUser } from "@/lib/services/authService"

/** Pre-calienta la caché de API para una ruta del panel admin. */
export function warmAdminRouteCache(href: string, adminId?: string | number | null) {
  const numericAdminId = adminId == null ? null : Number(adminId)
  if (href === "/") {
    warmCache(CACHE_KEYS.DASHBOARD, () => fetchDashboardData(), CACHE_TTL.DASHBOARD)
    return
  }
  if (href === "/inventario") {
    warmCache(CACHE_KEYS.PRODUCTOS(50), () => fetchAllProducts(50), CACHE_TTL.PRODUCTOS)
    return
  }
  if (href === "/ventas" && numericAdminId) {
    warmCache(CACHE_KEYS.VENTAS(50), () => fetchSalesItems(numericAdminId, 50), CACHE_TTL.VENTAS)
    return
  }
  if (href === "/clientes" && numericAdminId) {
    warmCache(CACHE_KEYS.CLIENTES(numericAdminId), () => fetchClientsSummary(numericAdminId), CACHE_TTL.CLIENTES)
  }
}

/** Pre-calienta todas las rutas principales del panel (login ya realizado). */
export function warmAllAdminRoutes() {
  const userData = getStoredUser("admin")
  const adminId = userData?.id ?? null
  warmAdminRouteCache("/")
  warmAdminRouteCache("/inventario")
  warmAdminRouteCache("/ventas", adminId)
  warmAdminRouteCache("/clientes", adminId)
}

export const ADMIN_NAV_ROUTES = ["/", "/inventario", "/ventas", "/clientes", "/configuracion"] as const
