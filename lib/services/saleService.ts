import { fetchClient } from "../api/httpClient";

const SALES_API = "api/sales-items";

export interface SaleItemView {
  id: number;
  sale_id?: number;
  product_id?: number;
  quantity: number;
  client_id?: number;
  state?: string; // En tu DB es 'state', no 'status'
  date: string;
  // Campos alternativos en camelCase (por si el backend serializa diferente)
  [key: string]: any;
}

// Función auxiliar interna para normalizar las respuestas (evita repetir código)
async function handleSalesResponse(res: Response): Promise<SaleItemView[]> {
  const data = await res.json();
  const arr = Array.isArray(data) ? data : (data.content || []);
  return arr as SaleItemView[];
}

export async function fetchSalesItems(adminId: number, sizePage: number = 20): Promise<SaleItemView[]> {
  const params = new URLSearchParams({ userId: String(adminId), sizePage: String(sizePage) });
  const res = await fetchClient(`${SALES_API}/show-with-limits?${params.toString()}`);
  if (!res.ok) throw new Error("Error al obtener los items de ventas");
  return handleSalesResponse(res);
}

/** Panel admin: filtra ventas de un negocio por nombre de cliente. `adminUserId` = id del usuario ADMIN. */
export async function fetchSalesItemsByClient(
  adminUserId: number,
  clientName: string
): Promise<SaleItemView[]> {
  const params = new URLSearchParams({
    userId: String(adminUserId),
    clientName,
  });
  const res = await fetchClient(`${SALES_API}/client?${params.toString()}`);
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `Error al buscar ventas por cliente (${res.status})${detail ? `: ${detail}` : ""}`
    );
  }
  return handleSalesResponse(res);
}

/** Portal cliente: historial de compras del cliente autenticado. Requiere endpoint en backend. */
export async function fetchClientPurchases(clientId: number): Promise<SaleItemView[]> {
  const params = new URLSearchParams({ clientId: String(clientId) });
  const res = await fetchClient(`${SALES_API}/by-client?${params.toString()}`);
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `Error al cargar compras del cliente (${res.status})${detail ? `: ${detail}` : ""}`
    );
  }
  return handleSalesResponse(res);
}

export async function fetchSalesItemsByProduct(adminId: number, productName: string): Promise<SaleItemView[]> {
  const params = new URLSearchParams({ userId: String(adminId), productName });
  const res = await fetchClient(`${SALES_API}/product?${params.toString()}`); // Se eliminó el "/" final defectuoso
  if (!res.ok) throw new Error("Error al buscar ventas por producto");
  return handleSalesResponse(res);
}

// ==================== PURCHASES ====================

export interface PurchaseItemRequestDTO {
  productId: number;
  quantity: number;
}

export interface PurchaseRequestDTO {
  clientId: number;
  userId: number[];
  items: PurchaseItemRequestDTO[];
}

export async function purchase(request: PurchaseRequestDTO): Promise<any> {
  const normalizedRequest = {
    clientId: Number(request.clientId),
    userId: request.userId || [],
    items: (request.items || []).map((item) => ({
      productId: Number(item.productId),
      quantity: Number(item.quantity),
    })),
  }

  if (!Number.isFinite(normalizedRequest.clientId) || normalizedRequest.clientId <= 0) {
    throw new Error("No se encontró un ID de cliente válido para procesar la compra.")
  }

  if (!normalizedRequest.items.length) {
    throw new Error("El carrito está vacío.")
  }

  console.debug("[purchase] payload", normalizedRequest)

  const res = await fetchClient("api/sale/purchase", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(normalizedRequest),
  })

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error al procesar la compra: ${text}`);
  }

  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  } else {
    return res.text();
  }
}