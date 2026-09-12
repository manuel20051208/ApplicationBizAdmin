"use client"

import { useState } from "react"
import Image from "next/image"
import {
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  CheckCircle2,
  CreditCard,
  Lock,
  ShoppingCart,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getImageUrl, type Product, type ProductImage } from "@/lib/services/productService"
import type { CartItem, LinkedCard } from "@/lib/portal-store"
import { computeOrderTotals, couponsFromAssignments, validateCoupon, type Coupon } from "@/lib/coupons"
import type { CouponAssignment } from "@/lib/services/couponService"
import { ClientCouponList } from "@/components/portal/client-coupon-list"

interface CheckoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cart: CartItem[]
  products: Product[]
  getProductImages: (productId: number) => ProductImage[]
  formatCurrency: (amount: number) => string
  linkedCard: LinkedCard | null
  coupon: Coupon | null
  onCouponChange: (coupon: Coupon | null) => void
  onLinkCard: () => void
  onPurchase: (card: LinkedCard) => Promise<void>
  clientCoupons: CouponAssignment[]
  cartProductIds?: Set<number>
}

export function CheckoutDialog({
  open,
  onOpenChange,
  cart,
  products,
  getProductImages,
  formatCurrency,
  linkedCard,
  coupon,
  onCouponChange,
  onLinkCard,
  onPurchase,
  clientCoupons,
  cartProductIds,
}: CheckoutDialogProps) {
  const [step, setStep] = useState<0 | 1>(0)
  const [couponInput, setCouponInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const lines = cart
    .map((item) => {
      const product = products.find((p) => p.id === item.productId)
      if (!product) return null
      return { item, product }
    })
    .filter(Boolean) as { item: CartItem; product: Product }[]

  const subtotal = lines.reduce((s, { item, product }) => s + product.price * item.quantity, 0)
  const totals = computeOrderTotals(
    subtotal,
    coupon,
    lines.map(({ item, product }) => ({ price: product.price, quantity: item.quantity, productId: product.id })),
  )

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) {
      setStep(0)
      setCouponInput("")
    }
  }

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

  const confirmPurchase = async () => {
    if (!linkedCard) {
      onLinkCard()
      return
    }
    setIsSubmitting(true)
    try {
      await onPurchase(linkedCard)
    } catch {
      setStep(1)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            {step === 0 && (
              <>
                <ShoppingCart className="size-4 text-primary" />
                Tu pedido
              </>
            )}
            {step === 1 && (
              <>
                <Lock className="size-4 text-primary" />
                Pago
              </>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Flujo de pago en pasos: resumen, método de pago y confirmación.
          </DialogDescription>
        </DialogHeader>

        {/* Paso 0: Resumen + cupón + totales */}
        {step === 0 && (
          <div className="px-6 py-4">
            <ScrollArea className="max-h-[38vh] pr-3">
              <ul className="space-y-3">
                {lines.map(({ item, product }) => {
                  const images = getProductImages(product.id)
                  const thumb = images[0]
                  const itemDiscount = totals.itemDiscounts[product.id] ?? 0
                  return (
                    <li key={product.id} className="flex items-center gap-3">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {thumb && (thumb.url || thumb.filePath) ? (
                          <Image
                            src={getImageUrl(thumb)}
                            alt={product.name}
                            fill
                            className="object-contain p-1"
                            sizes="48px"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × {formatCurrency(product.price)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={`text-sm font-bold ${itemDiscount > 0 ? "text-green-600 line-through decoration-muted-foreground/40" : "text-foreground"}`}>
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
            </ScrollArea>

            {/* Cupón */}
            <div className="mt-4">
              {coupon ? (
                <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5">
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

            <Separator className="my-4" />

            {/* Desglose */}
            <div className="space-y-1.5 text-sm">
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
                <span className="text-lg font-bold text-primary">{formatCurrency(totals.total)}</span>
              </div>
            </div>

            <Button className="mt-4 w-full gap-2" onClick={() => setStep(1)}>
              Continuar al pago
              <ArrowRight className="size-4" />
            </Button>
          </div>
        )}

        {/* Paso 1: Pago */}
        {step === 1 && (
          <div className="px-6 py-4">
            <p className="mb-3 text-sm text-muted-foreground">Método de pago</p>
            {linkedCard ? (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                <CreditCard className="size-6 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold capitalize text-foreground">
                    {linkedCard.brand} •••• {linkedCard.last4}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {linkedCard.holderName} · expira {linkedCard.expiryMonth}/{linkedCard.expiryYear}
                  </p>
                </div>
                <CheckCircle2 className="size-5 shrink-0 text-green-500" />
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border p-4">
                <p className="text-sm text-muted-foreground">No tienes una tarjeta vinculada</p>
                <Button variant="secondary" size="sm" onClick={onLinkCard}>
                  Vincular tarjeta
                </Button>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between rounded-xl border border-primary/10 bg-primary/5 p-3">
              <span className="text-sm font-semibold">Total a pagar</span>
              <span className="text-lg font-bold text-foreground">{formatCurrency(totals.total)}</span>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="gap-1.5" onClick={() => setStep(0)}>
                <ArrowLeft className="size-4" />
                Atrás
              </Button>
              <Button className="flex-1 gap-2" disabled={!linkedCard || isSubmitting} onClick={() => void confirmPurchase()}>
                <Lock className="size-4" />
                Confirmar y pagar
              </Button>
            </div>
          </div>
        )}

      </DialogContent>
    </Dialog>
  )
}
