import { fetchClient } from "../api/httpClient";

const CLIENTS_SUMMARY_API = "api/client-show-summary";

export interface ClientsSummaryView {
  id?: number | string;
  name?: string;
  clientName?: string;
  client_name?: string;
  email?: string;
  totalPurchases?: number;
  total_purchases?: number;
  totalSpent?: number;
  total_spent?: number;
  lastPurchase?: string;
  last_purchase?: string;
  lastPurchaseDate?: string;
}

export async function fetchClientsSummary(adminId: number): Promise<ClientsSummaryView[]> {
  const res = await fetchClient(`${CLIENTS_SUMMARY_API}/getNames/${adminId}`);
  if (!res.ok) throw new Error("Error al obtener el resumen de clientes");
  const data = await res.json();
  return Array.isArray(data) ? data : (data.content || []);
}

export async function fetchClientsSummaryByName(adminId: number, name: string): Promise<ClientsSummaryView[]> {
  const res = await fetchClient(`${CLIENTS_SUMMARY_API}/name/${adminId}?name=${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error("Error al buscar cliente por nombre");
  return res.json();
}

export async function fetchClientsSummaryByEmail(adminId: number, email: string): Promise<ClientsSummaryView[]> {
  const res = await fetchClient(`${CLIENTS_SUMMARY_API}/email/${adminId}?email=${encodeURIComponent(email)}`);
  if (!res.ok) throw new Error("Error al buscar cliente por email");
  return res.json();
}

// ==================== PAYMENT CARDS ====================

export interface PaymentCardRequestDTO {
  cardHolderName: string;
  brand: string;
  lastFour: string;
  active: boolean;
}

export interface PaymentCardResponseDTO {
  id: number;
  clientId: number;
  cardHolderName: string;
  brand: string;
  lastFour: string;
  active: boolean;
  createdAt: string;
}

export async function addPaymentCard(request: PaymentCardRequestDTO): Promise<PaymentCardResponseDTO> {
  const res = await fetchClient(`api/client/payment-cards`, {
    method: "POST",
    body: JSON.stringify(request)
  });
  if (!res.ok) throw new Error("Error al agregar tarjeta");
  return res.json();
}

export async function getPaymentCards(): Promise<PaymentCardResponseDTO[]> {
  const res = await fetchClient(`api/client/payment-cards`);
  if (!res.ok) throw new Error("Error al obtener tarjetas");
  return res.json();
}

export async function updatePaymentCardStatus(
  cardId: number,
  active: boolean
): Promise<PaymentCardResponseDTO> {
  const res = await fetchClient(`api/client/payment-cards/${cardId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  });
  if (!res.ok) throw new Error("Error al actualizar estado de la tarjeta");
  return res.json();
}

// ==================== USER PROFILES (CLIENT) ====================

export interface PaymentCardInProfile {
  id: number;
  cardHolderName: string;
  brand: string;
  lastFour: string;
  active: boolean;
  createdAt: string;
}

export interface ClientProfile {
  id: number;
  fullName: string;
  email: string;
  phone: number | null;
  paymentCards: PaymentCardInProfile[];
  address: string | null;
  createdAt: string;
  photo: string | null;
}

export async function fetchClientProfile(): Promise<ClientProfile> {
  const res = await fetchClient("api/client/user-data");
  if (!res.ok) throw new Error("Error al obtener perfil del cliente");
  return res.json();
}

export interface ClientUpdatePayload {
  fullName: string;
  email?: string;
  password?: string;
  phone?: number | null;
  address?: string | null;
}

export async function updateClientProfile(payload: ClientUpdatePayload): Promise<ClientProfile> {
  const res = await fetchClient("api/client/modify", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Error al actualizar perfil del cliente");
  return res.json();
}

// ==================== CLIENT PURCHASE HISTORY ====================

export interface ClientHistoryProjection {
  saleId: number;
  saleItemId: number;
  occurredAt: string;
  state: string;
  clientId: number;
  clientName: string;
  clientEmail: string;
  productId: number;
  productName: string;
  productCategory: string;
  unitPrice: number;
  quantity: number;
  totalAmount: number;
  userId: number;
}

export async function fetchClientHistory(): Promise<ClientHistoryProjection[]> {
  const res = await fetchClient("api/client/user-payments");
  if (!res.ok) throw new Error(`Error al cargar historial del cliente (${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function uploadClientProfilePhoto(file: File): Promise<void> {
  const formData = new FormData();
  formData.append("profilePhoto", file);

  const res = await fetchClient(`api/client/upload-profile`, {
    method: "PATCH",
    body: formData,
  });

  if (!res.ok) throw new Error("Error al subir la foto de perfil");

  // El backend devuelve la imagen; consumimos el body.
  await res.blob();
}

/**
 * Obtiene la foto de perfil del cliente autenticado como Blob URL (GET /api/client/profile-photo).
 */
export async function fetchClientProfilePhotoBlobUrl(): Promise<string | null> {
  const res = await fetchClient(`api/client/profile-photo`, {
    requireAuth: true,
  });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
