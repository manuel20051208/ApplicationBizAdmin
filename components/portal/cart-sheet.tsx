"use client"

import Image from "next/image"
import { Minus, Plus, ShoppingCart, Trash2, ImageIcon } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { getImageUrl, type Product, type ProductImage } from "@/lib/services/productService"
import type { CartItem } from "@/lib/portal-store"

interface CartSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cart: CartItem[]
  products: Product[]
  getProductImages: (productId: number) => ProductImage[]
  onUpdateQuantity: (productId: number, quantity: number) => void
  onRemove: (productId: number) => void
  formatCurrency: (amount: number) => string
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
}: CartSheetProps) {
  const lines = cart
    .map((item) => {
      const product = products.find((p) => p.id === item.productId)
      if (!product) return null
      return { item, product }
    })
    .filter(Boolean) as { item: CartItem; product: Product }[]

  const total = lines.reduce((sum, { item, product }) => sum + product.price * item.quantity, 0)
  const totalItems = lines.reduce((sum, { item }) => sum + item.quantity, 0)

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

        <ScrollArea className="max-h-[50vh] px-6">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
              <ShoppingCart className="mb-3 size-12 opacity-30" />
              <p className="text-sm font-medium text-foreground">Carrito vacío</p>
              <p className="mt-1 text-xs">Los productos que agregues aparecerán aquí.</p>
            </div>
          ) : (
            <ul className="space-y-4 pb-4">
              {lines.map(({ item, product }) => {
                const images = getProductImages(product.id)
                const thumb = images[0]
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
                    <p className="shrink-0 text-sm font-semibold text-foreground">
                      {formatCurrency(product.price * item.quantity)}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </ScrollArea>

        {lines.length > 0 && (
          <>
            <Separator />
            <div className="flex items-center justify-between px-6 py-4">
              <span className="text-sm text-muted-foreground">Total estimado</span>
              <span className="text-lg font-bold text-foreground">{formatCurrency(total)}</span>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
