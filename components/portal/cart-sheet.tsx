"use client"

import { useState } from "react"
import Image from "next/image"
import { BadgePercent, Minus, Plus, ShoppingCart, Trash2, ImageIcon, Truck, X } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { getImageUrl, type Product, type ProductImage } from "@/lib/services/productService"
import { FREE_SHIPPING_THRESHOLD } from "@/lib/portal-store"
import type { CartItem } from "@/lib/portal-store"
import { computeOrderTotals, couponsFromAssignments, validateCoupon, type Coupon } from "@/lib/coupons"
import type { CouponAssignment } from "@/lib/services/couponService"
import { ClientCouponList } from "@/components/portal/client-coupon-list"
import { toast } from "sonner"

interface CartSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cart: CartItem[]
  products: Product[]
  getProductImages: (productId: number) => ProductImage[]
  onUpdateQuantity: (productId: number, quantity: number) => void
  onRemove: (productId: number) => void
  formatCurrency: (amount: number) => string
  coupon: Coupon | null
  onCouponChange: (coupon: Coupon | null) => void
  clientCoupons: CouponAssignment[]
  cartProductIds?: Set<number>
}

export function CartSheet({
  open,
  onOpenChange,
  cart,
  products,
  getProductImages,
  onUpdateQuantity,
  onRemove,
  formatCurrency,
  coupon,
  onCouponChange,
  clientCoupons,
  cartProductIds,
}: CartSheetProps) {
  const [couponInput, setCouponInput] = useState("")
  const lines = cart
    .map((item) => {
      const product = products.find((p) => p.id === item.productId)
      if (!product) return null
      return { item, product }
    })
    .filter(Boolean) as { item: CartItem; product: Product }[]

  const total = lines.reduce((sum, { item, product }) => sum + product.price * item.quantity, 0)
  const totalItems = lines.reduce((sum, { item }) => sum + item.quantity, 0)
  const totals = computeOrderTotals(
    total,
    coupon,
    lines.map(({ item, product }) => ({ price: product.price, quantity: item.quantity, productId: product.id })),
  )

const applyCoupon = (raw?: string) => {
    const found = validateCoupon(raw ?? couponInput, couponsFromAssignments(clientCoupons, cartProductIds))
    if (!found) {
      toast.error("Cupón no válido o no aplica a tu carrito.")
      return
    }
    onCouponChange(found)
    setCouponInput("")
    toast.success(`Cupón ${found.code} aplicado: ${found.label}`)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[85vh] max-w-lg rounded-t-2xl px-0">
        <SheetHeader className="px-6 pb-2 text-left">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="size-5 text-primary" />
            Tu carrito
          </SheetTitle>
          <SheetDescription>
            {totalItems === 0
              ? "Agrega productos desde la tienda"
              : `${totalItems} artículo${totalItems !== 1 ? "s" : ""} · ${formatCurrency(total)}`}
          </SheetDescription>
        </SheetHeader>

        {lines.length > 0 && (
          <div className="border-b border-border px-6 py-3">
            {total >= FREE_SHIPPING_THRESHOLD ? (
              <p className="flex items-center gap-2 text-xs font-semibold text-green-600">
                <Truck className="size-4" />
                ¡Envío gratis aplicado!
              </p>
            ) : (
              <>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Truck className="size-4 shrink-0 text-primary" />
                  <span>
                    Te faltan{" "}
                    <span className="font-bold text-foreground">
                      {formatCurrency(FREE_SHIPPING_THRESHOLD - total)}
                    </span>{" "}
                    para envío gratis
                  </span>
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                  />
                </div>
              </>
            )}
          </div>
        )}

        <ScrollArea className="max-h-[50vh] px-6">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-border bg-card py-10 text-center text-muted-foreground">
              <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-muted">
                <ShoppingCart className="size-7 opacity-40" />
              </div>
              <p className="text-sm font-medium text-foreground">Carrito vacío</p>
              <p className="mt-1 text-xs">Los productos que agregues aparecerán aquí.</p>
            </div>
          ) : (
            <ul className="space-y-4 pb-4">
              {lines.map(({ item, product }) => {
                const images = getProductImages(product.id)
                const thumb = images[0]
                const itemDiscount = totals.itemDiscounts[product.id] ?? 0
                return (
                  <li key={product.id} className="flex gap-3">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {thumb && (thumb.url || thumb.filePath) ? (
                        <Image
                          src={getImageUrl(thumb)}
                          alt={product.name}
                          fill
                          className="object-contain p-1"
                          sizes="64px"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <ImageIcon className="size-6 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-foreground">
                        {product.name}
                      </p>
                      <p className="text-sm font-bold text-primary">
                        {formatCurrency(product.price)}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-7"
                          onClick={() =>
                            onUpdateQuantity(product.id, Math.max(0, item.quantity - 1))
                          }
                        >
                          <Minus className="size-3" />
                        </Button>
                        <span className="min-w-[1.5rem] text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-7"
                          disabled={item.quantity >= product.stock}
                          onClick={() => onUpdateQuantity(product.id, item.quantity + 1)}
                        >
                          <Plus className="size-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive hover:text-destructive"
                          onClick={() => onRemove(product.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`text-sm font-semibold ${itemDiscount > 0 ? "text-green-600 line-through decoration-muted-foreground/40" : "text-foreground"}`}>
                        {formatCurrency(product.price * item.quantity)}
                      </p>
                      {itemDiscount > 0 && (
                        <p className="text-xs font-bold text-green-600">
                          {formatCurrency((product.price * item.quantity) - itemDiscount)}
                        </p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </ScrollArea>

        {lines.length > 0 && (
          <>
            <div className="border-t border-border px-6 py-3">
              {coupon ? (
                <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <BadgePercent className="size-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-xs font-bold text-foreground">{coupon.code}</p>
                      <p className="text-[10px] text-muted-foreground">{coupon.label}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Quitar cupón"
                    className="rounded-full p-1 text-muted-foreground hover:text-destructive"
                    onClick={() => onCouponChange(null)}
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                      placeholder="Escribe un código de cupón"
                      className="h-9 flex-1 text-xs"
                    />
                    <Button variant="secondary" size="sm" className="h-9" onClick={() => applyCoupon()}>
                      Aplicar
                    </Button>
                  </div>
                  <ClientCouponList
                    coupons={clientCoupons}
                    activeCode={null}
                    cartProductIds={cartProductIds}
                    onApply={(code) => applyCoupon(code)}
                  />
                </>
              )}
            </div>

            <Separator />
            <div className="space-y-1.5 px-6 py-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Envío</span>
                <span className={totals.shipping === 0 ? "font-medium text-green-600" : "font-medium"}>
                  {totals.shipping === 0 ? "Gratis" : formatCurrency(totals.shipping)}
                </span>
              </div>
              {totals.discount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Descuento</span>
                  <span className="font-medium text-green-600">
                    -{formatCurrency(totals.discount)}
                  </span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold text-foreground">{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
