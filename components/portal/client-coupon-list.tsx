"use client"

import { useMemo } from "react"
import { BadgePercent, CalendarClock, Check, Package, ShoppingCart } from "lucide-react"
import type { CouponAssignment } from "@/lib/services/couponService"
import { isCouponExpired } from "@/lib/coupons"

interface ClientCouponListProps {
  coupons: CouponAssignment[]
  activeCode: string | null
  cartProductIds?: Set<number>
  onApply: (code: string) => void
}

interface CouponGroup {
  code: string
  discount: number
  dateLimit: string
  products: { id: number; name?: string }[]
}

function formatDate(value?: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })
}

export function ClientCouponList({
  coupons,
  activeCode,
  cartProductIds,
  onApply,
}: ClientCouponListProps) {
  const groups = useMemo(() => {
    const byCode = new Map<string, CouponGroup>()
    for (const assignment of coupons) {
      if (isCouponExpired(assignment.cuponDateLimit)) continue
      const code = assignment.cuponCode.toUpperCase()
      const existing = byCode.get(code)
      if (existing) {
        if (assignment.productId && !existing.products.some((p) => p.id === assignment.productId)) {
          existing.products.push({ id: assignment.productId, name: assignment.productName })
        }
      } else {
        byCode.set(code, {
          code,
          discount: assignment.discount,
          dateLimit: assignment.cuponDateLimit,
          products: assignment.productId
            ? [{ id: assignment.productId, name: assignment.productName }]
            : [],
        })
      }
    }
    return Array.from(byCode.values())
  }, [coupons])

  if (groups.length === 0) return null

  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Tus cupones
      </p>
      {groups.map((coupon) => {
        const isActive = activeCode?.toUpperCase() === coupon.code.toUpperCase()
        const applicable =
          !cartProductIds ||
          coupon.products.length === 0 ||
          coupon.products.some((product) => cartProductIds.has(product.id))
        const expiresAt = formatDate(coupon.dateLimit)
        const productLabel =
          coupon.products.length === 0
            ? "Todos los productos"
            : coupon.products.length <= 2
              ? coupon.products.map((p) => p.name).filter(Boolean).join(", ")
              : `${coupon.products.length} productos`

        return (
          <button
            key={coupon.code}
            type="button"
            disabled={isActive || !applicable}
            onClick={() => onApply(coupon.code)}
            title={!applicable ? "Este cupón no aplica a los productos de tu carrito" : undefined}
            className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-all ${
              isActive
                ? "border-primary/40 bg-primary/10"
                : applicable
                  ? "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                  : "cursor-not-allowed border-border bg-muted/40 opacity-60"
            }`}
          >
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                isActive ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
              }`}
            >
              <BadgePercent className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate font-mono text-sm font-bold tracking-wide text-foreground">
                  {coupon.code}
                </span>
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                  {coupon.discount}% OFF
                </span>
              </span>
              <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                {expiresAt && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="size-3" /> hasta {expiresAt}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Package className="size-3" /> {productLabel}
                </span>
              </span>
            </span>
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
                isActive
                  ? "text-primary"
                  : applicable
                    ? "text-muted-foreground"
                    : "text-muted-foreground/70"
              }`}
            >
              {isActive ? (
                <>
                  <Check className="size-3.5" /> Aplicado
                </>
              ) : applicable ? (
                "Usar"
              ) : (
                <>
                  <ShoppingCart className="size-3" /> No aplica
                </>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}