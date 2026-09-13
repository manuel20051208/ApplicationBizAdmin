import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/portal-store"
import type { CouponAssignment } from "@/lib/services/couponService"

export interface Coupon {
  code: string
  label: string
  kind: "percent" | "shipping"
  value?: number
  productIds?: number[]
}

/** True si la fecha límite del cupón ya pasó. */
export function isCouponExpired(dateLimit?: string | null): boolean {
  if (!dateLimit) return false
  const date = new Date(dateLimit)
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now()
}

export interface CouponTimeRemaining {
  totalMs: number
  days: number
  hours: number
  minutes: number
  seconds: number
}

/** Calcula el tiempo restante sin depender de una zona horaria adicional. */
export function getCouponTimeRemaining(
  dateLimit?: string | null,
  now = Date.now(),
): CouponTimeRemaining | null {
  if (!dateLimit) return null
  const expiresAt = new Date(dateLimit).getTime()
  if (Number.isNaN(expiresAt)) return null

  const totalMs = Math.max(0, expiresAt - now)
  const totalSeconds = Math.floor(totalMs / 1000)
  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3_600)
  const minutes = Math.floor((totalSeconds % 3_600) / 60)
  const seconds = totalSeconds % 60

  return { totalMs, days, hours, minutes, seconds }
}

/**
 * Convierte las asignaciones del cliente en cupones aplicables, agrupando por
 * código (un cupón puede tener varias filas, una por producto). Si se pasa
 * `cartProductIds`, solo devuelve cupones cuyos productos estén en el carrito.
 */
export function couponsFromAssignments(
  list: CouponAssignment[],
  cartProductIds?: Set<number>,
): Coupon[] {
  const byCode = new Map<string, { discount: number; products: number[] }>()

  for (const assignment of list) {
    if (isCouponExpired(assignment.cuponDateLimit)) continue
    const code = assignment.cuponCode.toUpperCase()
    const existing = byCode.get(code)
    if (existing) {
      if (assignment.productId && !existing.products.includes(assignment.productId)) {
        existing.products.push(assignment.productId)
      }
    } else {
      byCode.set(code, {
        discount: assignment.discount,
        products: assignment.productId ? [assignment.productId] : [],
      })
    }
  }

  const result: Coupon[] = []
  for (const [code, info] of byCode) {
    if (
      cartProductIds &&
      info.products.length > 0 &&
      !info.products.some((productId) => cartProductIds.has(productId))
    ) {
      continue
    }
    result.push({
      code,
      label: `${info.discount}% de descuento`,
      kind: "percent",
      value: info.discount,
      productIds: info.products,
    })
  }
  return result
}

/** Valida un código contra la lista de cupones disponibles (del backend). */
export function validateCoupon(raw: string, coupons: Coupon[] = []): Coupon | null {
  const code = raw.trim().toUpperCase()
  return coupons.find((c) => c.code === code) ?? null
}

export interface OrderTotals {
  subtotal: number
  shipping: number
  discount: number
  total: number
}

export interface OrderItem {
  price: number
  quantity: number
  productId?: number
}

export interface OrderTotals {
  subtotal: number
  shipping: number
  discount: number
  total: number
  /** Descuento aplicado a cada ítem elegible (por productId). */
  itemDiscounts: Record<number, number>
}

export function computeOrderTotals(subtotal: number, coupon: Coupon | null, items?: OrderItem[]): OrderTotals {
  const shipping =
    subtotal >= FREE_SHIPPING_THRESHOLD || coupon?.kind === "shipping"
      ? 0
      : SHIPPING_FEE

  if (coupon?.kind !== "percent" || !coupon.value || !items || items.length === 0) {
    const discount =
      coupon?.kind === "percent" && coupon.value
        ? Math.round(subtotal * coupon.value) / 100
        : 0
    const total = Math.max(0, subtotal + shipping - discount)
    return { subtotal, shipping, discount, total, itemDiscounts: {} }
  }

  // Promoción por ítem: el descuento solo se aplica sobre los ítems elegibles
  // (los marcados en el cupón). Si el cupón no lista productos, aplica a todos.
  const eligible = coupon.productIds && coupon.productIds.length > 0
    ? new Set(coupon.productIds)
    : null

  const itemDiscounts: Record<number, number> = {}
  let discount = 0
  for (const item of items) {
    if (eligible && item.productId != null && !eligible.has(item.productId)) continue
    const itemDiscount = (item.price * item.quantity * coupon.value) / 100
    if (itemDiscount <= 0) continue
    discount += itemDiscount
    if (item.productId != null) {
      itemDiscounts[item.productId] = (itemDiscounts[item.productId] ?? 0) + itemDiscount
    }
  }
  discount = Math.round(discount)
  for (const key of Object.keys(itemDiscounts)) {
    itemDiscounts[Number(key)] = Math.round(itemDiscounts[Number(key)])
  }

  const total = Math.max(0, subtotal + shipping - discount)
  return { subtotal, shipping, discount, total, itemDiscounts }
}
