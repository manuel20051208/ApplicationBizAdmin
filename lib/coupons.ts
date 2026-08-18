import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/portal-store"

export interface Coupon {
  code: string
  label: string
  kind: "percent" | "shipping"
  value?: number
}

// Cupones de demostración (mock)
export const COUPONS: Record<string, Coupon> = {
  BIZ10: { code: "BIZ10", label: "10% de descuento", kind: "percent", value: 10 },
  BIENVENIDO15: { code: "BIENVENIDO15", label: "15% de descuento", kind: "percent", value: 15 },
  FREE: { code: "FREE", label: "Envío gratis", kind: "shipping" },
}

export function validateCoupon(raw: string): Coupon | null {
  const code = raw.trim().toUpperCase()
  return COUPONS[code] ?? null
}

export interface OrderTotals {
  subtotal: number
  shipping: number
  discount: number
  total: number
}

export function computeOrderTotals(subtotal: number, coupon: Coupon | null): OrderTotals {
  const shipping =
    subtotal >= FREE_SHIPPING_THRESHOLD || coupon?.kind === "shipping"
      ? 0
      : SHIPPING_FEE
  const discount =
    coupon?.kind === "percent" && coupon.value
      ? Math.round(subtotal * coupon.value) / 100
      : 0
  const total = Math.max(0, subtotal + shipping - discount)
  return { subtotal, shipping, discount, total }
}
