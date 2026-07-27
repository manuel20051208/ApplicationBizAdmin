import { fetchClient, API_BASE_URL } from "../api/httpClient";
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

export interface DashboardShowLatestSales {
  content: LatestSaleItem[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
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
  if (photoPath.startsWith("http://") || photoPath.startsWith("https://")) return photoPath;

  const path = photoPath.startsWith("/") ? photoPath : `/${photoPath}`;
  if (path.startsWith("/uploads/")) return `${API_BASE_URL}${path}`;
  if (path.startsWith("/")) return `${API_BASE_URL}${path}`;
  return `${API_BASE_URL}/uploads/perfiles/${photoPath}`;
}

const DASHBOARD_API = "dashboard-controller";

export async function fetchDashboardData(userId?: number | null): Promise<DashboardDataResponse> {
  const user = getStoredUser("admin");
  const id = userId ?? user?.id;

  if (!id) {
    return {
      totalSales: 0,
      totalProducts: 0,
      totalClients: 0,
      monthlyData: [],
      showLatestSales: { content: [], page: { size: 0, number: 0, totalElements: 0, totalPages: 0 } },
    };
  }

  try {
    const [sumRes, stockRes, clientsRes, graphicRes, salesRes] = await Promise.allSettled([
      fetchClient(`${DASHBOARD_API}/sum/${id}`),
      fetchClient(`${DASHBOARD_API}/stock/${id}`),
      fetchClient(`${DASHBOARD_API}/count-clients/${id}`),
      fetchClient(`${DASHBOARD_API}/data-graphic/${id}`),
      fetchClient(`${DASHBOARD_API}/latest-sales/${id}?pageSize=10`),
    ]);

    const totalSales = sumRes.status === "fulfilled" && sumRes.value.ok ? await sumRes.value.json() : 0;
    const totalProducts = stockRes.status === "fulfilled" && stockRes.value.ok ? await stockRes.value.json() : 0;
    const totalClients = clientsRes.status === "fulfilled" && clientsRes.value.ok ? await clientsRes.value.json() : 0;

    let monthlyDataRaw: Record<string, number> = {};
    if (graphicRes.status === "fulfilled" && graphicRes.value.ok) {
      try { monthlyDataRaw = await graphicRes.value.json(); } catch { }
    }

    const SPANISH_MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const monthlyData = Object.entries(monthlyDataRaw).map(([key, val]) => {
      const monthNum = parseInt(key, 10);
      const monthName = !isNaN(monthNum) && monthNum >= 1 && monthNum <= 12 ? SPANISH_MONTHS[monthNum - 1] : key;
      return {
        monthName,
        monthlyTotal: Number(val) || 0,
        numberOfProducts: 0,
        countClients: 0,
      };
    });

    let showLatestSalesData = { content: [], page: { size: 10, number: 0, totalElements: 0, totalPages: 0 } };
    if (salesRes.status === "fulfilled" && salesRes.value.ok) {
      try {
        const data = await salesRes.value.json();
        const content = Array.isArray(data) ? data : (data.content || []);
        showLatestSalesData = {
          content,
          page: data.page || { size: content.length, number: 0, totalElements: content.length, totalPages: 1 },
        };
      } catch { }
    }

    return {
      totalSales: Number(totalSales) || 0,
      totalProducts: Number(totalProducts) || 0,
      totalClients: Number(totalClients) || 0,
      monthlyData,
      showLatestSales: showLatestSalesData,
    };
  } catch (err) {
    console.error("Error al obtener datos del dashboard:", err);
    throw err;
  }
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
