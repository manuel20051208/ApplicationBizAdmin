import { fetchClient } from "../api/httpClient"

const COUPONS_API = "api/cupons"

export interface ProductCouponRequest {
  cuponCode: string
  cuponDateLimit: string
  discount: number
  quantity: number
  productIds: number[]
}

export interface ProductCoupon {
  id: number
  cuponCode: string
  cuponDateLimit: string
  discount: number
  quantity: number
  active: boolean
  ownerId: number
  productIds: number[]
}

export interface CouponAssignmentRequest {
  cuponId: number
  clientIds: number[]
  assignToAll: boolean
}

/** Una fila de cupón asignado al cliente (una por producto al que aplica). */
export interface CouponAssignment {
  id: number
  clientId?: number
  clientName?: string
  clientEmail?: string
  cuponId: number
  cuponCode: string
  discount: number
  cuponDateLimit: string
  productId?: number
  productName?: string
}

export async function fetchMyCoupons(): Promise<ProductCoupon[]> {
  const res = await fetchClient(`${COUPONS_API}/my`)
  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new Error(`Error al obtener los cupones (${res.status})${detail ? `: ${detail}` : ""}`)
  }
  return res.json()
}

/** Cupones asignados al cliente autenticado (requiere token CLIENT). */
export async function fetchMyCouponAssignments(): Promise<CouponAssignment[]> {
  const res = await fetchClient(`${COUPONS_API}/assignments/my`)
  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new Error(`Error al obtener tus cupones (${res.status})${detail ? `: ${detail}` : ""}`)
  }
  return res.json()
}

export async function createProductCoupon(
  payload: ProductCouponRequest,
): Promise<ProductCoupon> {
  const res = await fetchClient(COUPONS_API, {
    method: "POST",
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new Error(detail || "Error al crear el cupón")
  }
  return res.json()
}

export async function deleteProductCoupon(id: number): Promise<void> {
  const res = await fetchClient(`${COUPONS_API}/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Error al eliminar el cupón")
}

export async function assignProductCoupon(payload: CouponAssignmentRequest): Promise<unknown> {
  const res = await fetchClient(`${COUPONS_API}/assign`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new Error(`Error al asignar el cupón (${res.status})${detail ? `: ${detail}` : ""}`)
  }
  return res.json()
}
