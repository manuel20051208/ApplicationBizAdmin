"use client"

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import dynamic from "next/dynamic"
import { CheckCircle2, ChevronUp, CreditCard, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { getStoredUser } from "@/lib/services/authService"
import { type Product, type ProductImage } from "@/lib/services/productService"
import { purchase, type PurchaseRequestDTO, type PurchaseResponseDTO } from "@/lib/services/saleService"
import {
  getLinkedCard,
  getPortalCoupon,
  savePortalCart,
  savePortalCoupon,
  type CartItem,
  type LinkedCard,
} from "@/lib/portal-store"
import { couponsFromAssignments, computeOrderTotals, validateCoupon, type Coupon } from "@/lib/coupons"
import { fetchMyCouponAssignments, type CouponAssignment } from "@/lib/services/couponService"

const CartSheet = dynamic(
  () => import("@/components/portal/cart-sheet").then((m) => m.CartSheet),
  { ssr: false }
)
const LinkCardDialog = dynamic(
  () => import("@/components/portal/link-card-dialog").then((m) => m.LinkCardDialog),
  { ssr: false }
)
const CheckoutDialog = dynamic(
  () => import("@/components/portal/checkout-dialog").then((m) => m.CheckoutDialog),
  { ssr: false }
)

interface StoreCheckoutBarProps {
  cart: CartItem[]
  products: Product[]
  getProductImages: (productId: number) => ProductImage[]
  onCartChange: (cart: CartItem[]) => void
  formatCurrency: (amount: number) => string
  onPurchaseComplete?: () => void | Promise<void>
}

export function StoreCheckoutBar({
  cart,
  products,
  getProductImages,
  onCartChange,
  formatCurrency,
  onPurchaseComplete,
}: StoreCheckoutBarProps) {
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [linkCardOpen, setLinkCardOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [barCollapsed, setBarCollapsed] = useState(false)
  const [portalMounted, setPortalMounted] = useState(false)
  const stockRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [linkedCard, setLinkedCard] = useState<LinkedCard | null>(null)
  const [lastOrderId, setLastOrderId] = useState<string | null>(null)
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [clientCoupons, setClientCoupons] = useState<CouponAssignment[]>([])
  const [lastPurchase, setLastPurchase] = useState<PurchaseResponseDTO | null>(null)

  useEffect(() => {
    setPortalMounted(true)
  }, [])

  // Cargar los cupones asignados al cliente (backend) y restaurar el código
  // guardado en la sesión, solo si sigue vigente.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const raw = await fetchMyCouponAssignments()
        if (cancelled) return
        setClientCoupons(raw)
        setCoupon((current) =>
          current ??
          (() => {
            const savedCode = getPortalCoupon()
            return savedCode ? validateCoupon(savedCode, couponsFromAssignments(raw)) : null
          })(),
        )
      } catch {
        if (!cancelled) setClientCoupons([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = cart.reduce((sum, i) => {
    const product = products.find((p) => p.id === i.productId)
    return sum + (product?.price ?? 0) * i.quantity
  }, 0)
  const totals = computeOrderTotals(
    subtotal,
    coupon,
    cart
      .map((i) => {
        const product = products.find((p) => p.id === i.productId)
        return product ? { price: product.price, quantity: i.quantity, productId: i.productId } : null
      })
      .filter(Boolean) as { price: number; quantity: number; productId: number }[],
  )
  const cartProductIds = useMemo(() => new Set(cart.map((i) => i.productId)), [cart])

  const handleCouponChange = (next: Coupon | null) => {
    setCoupon(next)
    savePortalCoupon(next?.code ?? null)
  }

  // Bump del badge cuando aumenta el contador (complementa el fly-to-cart)
  const [bumping, setBumping] = useState(false)
  const prevTotalRef = useRef(totalItems)
  useEffect(() => {
    if (totalItems > prevTotalRef.current) {
      setBumping(true)
      const t = setTimeout(() => setBumping(false), 350)
      prevTotalRef.current = totalItems
      return () => clearTimeout(t)
    }
    prevTotalRef.current = totalItems
  }, [totalItems])

  // La barra permanece visible al principio y se oculta hacia abajo después
  // de 30 segundos. Si el carrito cambia, vuelve a mostrarse automáticamente.
  useEffect(() => {
    setBarCollapsed(false)
  }, [totalItems])

  useEffect(() => {
    if (barCollapsed) return
    const timer = window.setTimeout(() => setBarCollapsed(true), 30_000)
    return () => window.clearTimeout(timer)
  }, [barCollapsed, totalItems])

  useEffect(() => {
    return () => {
      if (stockRefreshTimerRef.current) {
        clearTimeout(stockRefreshTimerRef.current)
      }
    }
  }, [])

  const productsById = useMemo(
    () => new Map(products.map(p => [p.id, p])),
    [products]
  )

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      const next = cart.filter((i) => i.productId !== productId)
      onCartChange(next)
      savePortalCart(next)
      return
    }
    const next = cart.map((i) =>
      i.productId === productId ? { ...i, quantity } : i
    )
    onCartChange(next)
    savePortalCart(next)
  }, [cart, onCartChange])

  const removeFromCart = useCallback((productId: number) => {
    const next = cart.filter((i) => i.productId !== productId)
    onCartChange(next)
    savePortalCart(next)
  }, [cart, onCartChange])

  const handleBuy = async () => {
    if (totalItems === 0) {
      setCartOpen(true)
      return
    }
    setLinkedCard(getLinkedCard())
    setCheckoutOpen(true)
  }

  const simulatePurchase = async (_card: LinkedCard) => {
    const user = getStoredUser()
    const clientId = Number(user?.id)

    if (!Number.isFinite(clientId) || clientId <= 0) {
      toast.error("No se encontró un ID de cliente válido. Por favor, inicia sesión nuevamente.")
      return
    }

    const purchaseLines = cart
      .map((item) => {
        const product = productsById.get(item.productId)
        if (!product) return null
        return {
          product,
          line: {
            productId: product.id,
            name: product.name,
            quantity: item.quantity,
            unitPrice: product.price,
          },
        }
      })
      .filter(Boolean) as ({ product: Product; line: { productId: number; name: string; quantity: number; unitPrice: number } })[]

    const itemsForApi = purchaseLines.map(pl => ({
      productId: Number(pl.product.id),
      quantity: Number(pl.line.quantity),
    }))

    if (!itemsForApi.length) {
      toast.error("El carrito está vacío. Agrega productos antes de comprar.")
      return
    }

    const userIds = Array.from(new Set(purchaseLines.map(pl => pl.product.userAdminId).filter(id => id != null))) as number[];

    const request: PurchaseRequestDTO = {
      clientId,
      userId: userIds,
      items: itemsForApi,
      cuponCode: coupon?.code ?? null,
    }

    try {
      const response = await purchase(request)

      const orderId = response.saleId ?? response.saleIds?.[0] ?? response.id ?? `ORD-${Date.now().toString(36).toUpperCase()}`

      onCartChange([])
      savePortalCart([])

      setLastPurchase(response)
      setLastOrderId(String(orderId))
      setCartOpen(false)
      setCheckoutOpen(false)

      // No consultamos dos veces: esperamos a que el backend termine de
      // actualizar el stock y refrescamos una sola vez después de 20 segundos.
      if (stockRefreshTimerRef.current) clearTimeout(stockRefreshTimerRef.current)
      stockRefreshTimerRef.current = setTimeout(() => {
        stockRefreshTimerRef.current = null
        void onPurchaseComplete?.()
      }, 20_000)

      // Mostrar primero la información de la compra realizada.
      setSuccessOpen(true)
      return

    } catch (err: any) {
      console.error("Error al ejecutar compra:", err)
      
      try {
        // Intentar parsear el error JSON del backend
        const errorString = err.message.replace("Error al procesar la compra: ", "")
        const errorJson = JSON.parse(errorString)
        
        if (errorJson.status === 402 || errorJson.message?.includes("tarjeta activa")) {
          // El cliente no tiene una tarjeta activa o el pago es requerido.
          // Forzamos a que vuelva a vincular/crear una tarjeta.
          setLinkCardOpen(true)
          return
        }
      } catch (e) {
        // Si falla el parseo, continuamos con el alert normal
      }

      toast.error(`Hubo un error al procesar la compra: ${err.message}`)
      throw err
    }
  }

  const handleCardLinked = (card: LinkedCard) => {
    setLinkedCard(card)
  }

  const handleSuccessClose = () => {
    setSuccessOpen(false)
  }

  return (
    <>
      {portalMounted && createPortal(
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[120] flex justify-center px-2 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:px-3">
        {barCollapsed ? (
          <Button
            type="button"
            aria-label="Mostrar carrito"
            title="Mostrar carrito"
            className="pointer-events-auto size-11 rounded-full border border-primary/40 bg-card/95 p-0 text-primary shadow-2xl backdrop-blur-md hover:bg-primary/10"
            onClick={() => setBarCollapsed(false)}
          >
            <ChevronUp className="size-5" />
          </Button>
        ) : <div className="pointer-events-auto flex w-full max-w-md items-center justify-center gap-2 rounded-2xl border border-border bg-card/95 p-2 shadow-2xl backdrop-blur-md">
          <Button
            id="store-cart-button"
            size="lg"
            variant="secondary"
            className="relative h-12 min-w-0 flex-1 gap-2 rounded-xl px-3 font-semibold shadow-sm sm:min-w-[10rem] sm:flex-none sm:px-5"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="size-5" />
            Carrito
            {totalItems > 0 && (
              <span className={`absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground ${bumping ? "animate-pop" : ""}`}>
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Button>

          {totalItems > 0 && (
            <div className="hidden pl-1 pr-2 text-right sm:block">
              <p className="text-[10px] leading-tight text-muted-foreground">Total</p>
              <p className="text-sm font-bold leading-tight text-foreground">
                {formatCurrency(totals.total)}
              </p>
            </div>
          )}

          <Button
            size="lg"
            className="h-12 min-w-0 flex-1 gap-2 rounded-xl px-3 font-semibold shadow-md shadow-primary/20 sm:min-w-[8.5rem] sm:flex-none sm:px-6"
            onClick={() => void handleBuy()}
          >
            <CreditCard className="size-4" />
            Comprar
          </Button>
        </div>}
        </div>,
        document.body
      )}

      <CartSheet
        open={cartOpen}
        onOpenChange={setCartOpen}
        cart={cart}
        products={products}
        getProductImages={getProductImages}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        formatCurrency={formatCurrency}
        coupon={coupon}
        onCouponChange={handleCouponChange}
        clientCoupons={clientCoupons}
        cartProductIds={cartProductIds}
      />

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        cart={cart}
        products={products}
        getProductImages={getProductImages}
        formatCurrency={formatCurrency}
        linkedCard={linkedCard}
        coupon={coupon}
        onCouponChange={handleCouponChange}
        onLinkCard={() => setLinkCardOpen(true)}
        onPurchase={(card) => simulatePurchase(card)}
        clientCoupons={clientCoupons}
        cartProductIds={cartProductIds}
      />

      <LinkCardDialog
        open={linkCardOpen}
        onOpenChange={setLinkCardOpen}
        onLinked={handleCardLinked}
      />

      <Dialog open={successOpen} onOpenChange={(open) => {
        if (!open) handleSuccessClose()
      }}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader className="items-center">
            <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-green-500/15">
              <CheckCircle2 className="size-8 text-green-600" />
            </div>
            <DialogTitle>¡Compra simulada!</DialogTitle>
            <DialogDescription className="text-center">
              {lastOrderId && (
                <>
                  Pedido <span className="font-mono font-semibold text-foreground">{lastOrderId}</span>
                  <br />
                </>
              )}
              {linkedCard && (
                <>
                  Cobrado a tarjeta •••• {linkedCard.last4}. Puedes ver el detalle en{" "}
                  <span className="font-medium text-foreground">Mis Compras</span>.
                </>
              )}
              {lastPurchase?.cupon && (
                <>
                  <br />
                  Cupón{" "}
                  <span className="font-mono font-semibold text-foreground">
                    {lastPurchase.cupon.code}
                  </span>{" "}
                  aplicado
                  {lastPurchase.discountApplied != null && (
                    <> · descuento {formatCurrency(-lastPurchase.discountApplied)}</>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <Button className="w-full" onClick={handleSuccessClose}>
            Seguir comprando
          </Button>
        </DialogContent>
      </Dialog>

    </>
  )
}
