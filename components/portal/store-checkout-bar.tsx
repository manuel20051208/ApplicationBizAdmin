"use client"

import { useState } from "react"
import { CheckCircle2, CreditCard, Loader2, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CartSheet } from "@/components/portal/cart-sheet"
import { LinkCardDialog } from "@/components/portal/link-card-dialog"
import { toast } from "sonner"
import { getStoredUser } from "@/lib/services/authService"
import { type Product, type ProductImage } from "@/lib/services/productService"
import { purchase, type PurchaseRequestDTO } from "@/lib/services/saleService"
import {
  getLinkedCard,
  savePortalCart,
  type CartItem,
  type LinkedCard,
} from "@/lib/portal-store"

interface StoreCheckoutBarProps {
  cart: CartItem[]
  products: Product[]
  getProductImages: (productId: number) => ProductImage[]
  onCartChange: (cart: CartItem[]) => void
  formatCurrency: (amount: number) => string
  onPurchaseComplete?: () => void
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
  const [linkCardOpen, setLinkCardOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [linkedCard, setLinkedCard] = useState<LinkedCard | null>(null)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [lastOrderId, setLastOrderId] = useState<string | null>(null)
  const [isSimulatingLoading, setIsSimulatingLoading] = useState(false)

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0)

  const updateQuantity = (productId: number, quantity: number) => {
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
  }

  const removeFromCart = (productId: number) => {
    const next = cart.filter((i) => i.productId !== productId)
    onCartChange(next)
    savePortalCart(next)
  }

  const handleBuy = async () => {
    if (totalItems === 0) {
      setCartOpen(true)
      return
    }

    const card = getLinkedCard()
    setLinkedCard(card)

    if (!card) {
      setLinkCardOpen(true)
      return
    }

    await simulatePurchase(card)
  }

  const simulatePurchase = async (card: LinkedCard) => {
    setIsCheckingOut(true)

    const user = getStoredUser()
    const clientId = Number(user?.id)

    if (!Number.isFinite(clientId) || clientId <= 0) {
      toast.error("No se encontró un ID de cliente válido. Por favor, inicia sesión nuevamente.")
      setIsCheckingOut(false)
      return
    }

    const purchaseLines = cart
      .map((item) => {
        const product = products.find((p) => p.id === item.productId)
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
      setIsCheckingOut(false)
      return
    }

    const request: PurchaseRequestDTO = {
      clientId,
      items: itemsForApi,
    }

    try {
      const response = await purchase(request);
      
      const lines = purchaseLines.map((item) => item.line)
      const total = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0)
      const orderId = response.id || `ORD-${Date.now().toString(36).toUpperCase()}`


      onCartChange([])
      savePortalCart([])

      setLastOrderId(orderId.toString())
      setCartOpen(false)
      
      // Mostrar primero la información de la compra realizada
      setSuccessOpen(true)
      
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
    } finally {
      setIsCheckingOut(false)
    }
  }

  const handleCardLinked = (card: LinkedCard) => {
    setLinkedCard(card)
    if (totalItems > 0) {
      void simulatePurchase(card)
    }
  }

  const handleSuccessClose = () => {
    setSuccessOpen(false)
    setIsSimulatingLoading(true)
    
    // Iniciar la carga de datos en segundo plano
    onPurchaseComplete?.()

    // Mantener la animación de carga por 1.5s para que la API tenga tiempo
    setTimeout(() => {
      setIsSimulatingLoading(false)
    }, 1500)
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-4 pt-2">
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-border bg-card/95 p-2 shadow-2xl backdrop-blur-md">
          <Button
            size="lg"
            variant="secondary"
            className="relative h-12 min-w-[10rem] gap-2 rounded-xl px-5 font-semibold shadow-sm"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="size-5" />
            Carrito
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Button>

          <Button
            size="lg"
            className="h-12 min-w-[8.5rem] gap-2 rounded-xl px-6 font-semibold shadow-md shadow-primary/20"
            disabled={isCheckingOut}
            onClick={() => void handleBuy()}
          >
            {isCheckingOut ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <CreditCard className="size-4" />
                Comprar
              </>
            )}
          </Button>
        </div>
      </div>

      <CartSheet
        open={cartOpen}
        onOpenChange={setCartOpen}
        cart={cart}
        products={products}
        getProductImages={getProductImages}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        formatCurrency={formatCurrency}
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
            </DialogDescription>
          </DialogHeader>
          <Button className="w-full" onClick={handleSuccessClose}>
            Seguir comprando
          </Button>
        </DialogContent>
      </Dialog>

      {isSimulatingLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md transition-all duration-300">
          <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
            <Loader2 className="size-16 animate-spin text-primary" />
            <p className="text-xl font-medium text-foreground">Procesando tu compra...</p>
          </div>
        </div>
      )}
    </>
  )
}
