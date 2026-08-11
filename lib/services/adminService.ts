import { fetchClient } from "../api/httpClient";
import { resolveMediaUrl, optimizeCloudinaryUrl } from "@/lib/config";
import { SaleItemView } from "./saleService";
import { getStoredUser } from "@/lib/auth/session";

// ==================== USER PROFILES (ADMIN) ====================

export interface AdminProfile {
  id: number;
  fullName: string;
  email: string;
  phone: number;
  businessName: string;
  profilePhoto?: string;    // foto subida manualmente (path local)
  profilePhotoUrl?: string; // foto de Google OAuth2 (URL externa)
  fotoPerfil?: string;
  photo?: string;
}

export interface DashboardMonthlyData {
  monthName: string;
  monthlyTotal: number;
  numberOfProducts: number;
  countClients: number;
}

export interface LatestSaleItem {
  totalQuantity: number;
  totalSpent: number;
  latestSale: string;
  userId: number;
  id: number;
  fullName: string;
  email: string;
}

export interface PageableInfo {
  page: number;
  size: number;
}

export interface PageSortInfo {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

export interface DashboardShowLatestSales {
  content: LatestSaleItem[];
  pageable: PageableInfo;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  number: number;
  size: number;
  sort: PageSortInfo;
  numberOfElements: number;
  empty: boolean;
}

export interface DashboardDataResponse {
  totalSales: number;
  totalProducts: number;
  totalClients: number;
  monthlyData: DashboardMonthlyData[];
  showLatestSales: DashboardShowLatestSales;
}

export async function fetchAdminProfile(): Promise<AdminProfile> {
  const res = await fetchClient(`api/user/admin`, {
    requireAuth: true,
    skipSessionCheck: true
  });
  if (!res.ok) {
    let errorMessage = `Error ${res.status}: Error al obtener perfil del administrador`;
    try {
      const errorData = await res.json();
      if (typeof errorData === "object" && errorData && "message" in errorData) {
        errorMessage = `Error ${res.status}: ${(errorData as { message: string }).message}`;
      }
    } catch {
      // No JSON body, use default message
    }
    console.error("fetchAdminProfile failed:", { status: res.status, message: errorMessage });
    throw new Error(errorMessage);
  }
  return res.json();
}
export interface StoreDescription {
  id: number;
  businessName: string;
  photo: string | null;
}

export async function fetchStoreDescription(adminId: number): Promise<StoreDescription> {
  const res = await fetchClient(`api/client/${adminId}/admin`, {
    requireAuth: true,
  });
  if (!res.ok) {
    console.error(`fetchStoreDescription status: ${res.status}`);
    throw new Error("Error al obtener información de la tienda");
  }
  return res.json();
}

export async function updateAdminProfile(profile: AdminProfile): Promise<AdminProfile> {
  const res = await fetchClient(`api/user/modify`, {
    method: "PATCH",
    body: JSON.stringify(profile)
  });
  if (!res.ok) throw new Error("Error al actualizar perfil del administrador");
  return res.json();
}

/**
 * Actualiza la foto de perfil del administrador enviando una URL externa
 * (puede ser de Google OAuth2 o de Cloudinary).
 * El backend la guarda en el campo profilePhoto del entity UserAdmin.
 */
export async function updateProfilePhotoUrl(photoUrl: string): Promise<AdminProfile> {
  const user = getStoredUser("admin");
  if (!user?.id) throw new Error("Usuario no autenticado");

  // Traemos el perfil actual para hacer un PATCH parcial sin pisar otros campos
  const current = await fetchAdminProfile();

  const res = await fetchClient(`api/user/modify`, {
    method: "PATCH",
    body: JSON.stringify({
      ...current,
      profilePhoto: photoUrl,     // Cloudinary URL o URL de Google
      profilePhotoUrl: photoUrl,  // También se guarda aquí para OAuth2
    }),
  });

  if (!res.ok) throw new Error("Error al actualizar la foto de perfil");
  return res.json();
}

export function getProfilePhotoUrl(photoPath?: string | null): string {
  if (!photoPath) return "";
  if (photoPath.startsWith("data:") || photoPath.startsWith("blob:")) return photoPath;
  if (/^https?:\/\//i.test(photoPath)) return optimizeCloudinaryUrl(resolveMediaUrl(photoPath));

  const path = photoPath.startsWith("/") ? photoPath : `/${photoPath}`;
  return optimizeCloudinaryUrl(resolveMediaUrl(path));
}

const DASHBOARD_API = "dashboard-controller";

/**
 * Obtiene todos los datos del dashboard en una sola petición
 * (GET /dashboard-controller/get-data-dashboard).
 * El backend resuelve el usuario autenticado (id()) y devuelve el DashboardDTO completo.
 * showLatestSales se serializa como Page<ClientSummaryProjection> e incluye los metadatos
 * de paginación (pageable, totalElements, totalPages, first, last, sort, ...).
 */
export async function fetchDashboardData(): Promise<DashboardDataResponse> {
  const res = await fetchClient(`${DASHBOARD_API}/get-data-dashboard`, {
    requireAuth: true,
  });
  if (!res.ok) {
    console.error(`fetchDashboardData status: ${res.status}`);
    throw new Error("Error al obtener datos del dashboard");
  }
  return res.json();
}

/**
 * Descarga el reporte del dashboard en Excel
 * (GET /dashboard-controller/excel, respuesta binaria .xlsx, Content-Disposition: attachment).
 */
export async function fetchDashboardExcel(): Promise<Blob> {
  const res = await fetchClient(`${DASHBOARD_API}/excel`, {
    requireAuth: true,
  });
  if (!res.ok) throw new Error("Error al descargar el reporte Excel");
  return res.blob();
}

/**
 * Descarga el reporte del dashboard en PDF
 * (GET /dashboard-controller/pdf, respuesta binaria .pdf, Content-Disposition: attachment).
 */
export async function fetchDashboardPdf(): Promise<Blob> {
  const res = await fetchClient(`${DASHBOARD_API}/pdf`, {
    requireAuth: true,
  });
  if (!res.ok) throw new Error("Error al descargar el reporte PDF");
  return res.blob();
}

export async function fetchDashboardSum(): Promise<number> {
  const res = await fetchClient(`${DASHBOARD_API}/sum`);
  if (!res.ok) throw new Error("Error al obtener ingresos totales");
  return res.json();
}

export async function fetchDashboardStock(): Promise<number> {
  const res = await fetchClient(`${DASHBOARD_API}/stock`);
  if (!res.ok) throw new Error("Error al obtener stock");
  return res.json();
}

export async function fetchDashboardClientCount(): Promise<number> {
  const res = await fetchClient(`${DASHBOARD_API}/count-clients`);
  if (!res.ok) throw new Error("Error al obtener conteo de clientes");
  return res.json();
}

const MONTH_LABELS: Record<number, string> = {
  1: "Ene", 2: "Feb", 3: "Mar", 4: "Abr", 5: "May", 6: "Jun",
  7: "Jul", 8: "Ago", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dic",
};

export interface RevenueDataPoint {
  month: string;
  ingresos: number;
}

export async function fetchDashboardGraphic(): Promise<RevenueDataPoint[]> {
  const res = await fetchClient(`${DASHBOARD_API}/data-graphic`);
  if (!res.ok) throw new Error("Error al obtener datos de la gráfica");
  const data: Record<string, number> = await res.json();

  const currentMonth = new Date().getMonth() + 1;
  const result: RevenueDataPoint[] = [];

  for (let i = 1; i <= currentMonth; i++) {
    result.push({
      month: MONTH_LABELS[i] || `Mes ${i}`,
      ingresos: data[String(i)] || 0,
    });
  }

  return result;
}

export async function fetchDashboardLatestSales(pageSize: number = 5): Promise<SaleItemView[]> {
  const res = await fetchClient(`${DASHBOARD_API}/latest-sales?pageSize=${pageSize}`);
  if (!res.ok) throw new Error("Error al obtener últimas ventas");
  const data = await res.json();
  const arr = Array.isArray(data) ? data : (data.content || []);

  return arr.map((item: any) => {
    // Formatear la fecha para que no se vea el string raro (ej. 2026-06-06T03:20:48.187Z)
    let dateStr = "—";
    if (item.latestSale) {
      const d = new Date(item.latestSale);
      if (!isNaN(d.getTime())) {
        dateStr = d.toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" });
      }
    }

    return {
      id: item.clientId || Math.floor(Math.random() * 10000),
      full_name: item.fullName || "Cliente Desconocido",
      quantity: item.totalQuantity || 0,
      totalPrice: item.totalSpent || 0,
      status: "completado",
      date: dateStr,
      productName: `${item.totalQuantity || 1} producto(s)`
    };
  });
}
