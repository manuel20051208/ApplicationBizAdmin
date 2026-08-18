"use client"

import Image from "next/image"
import { ImageIcon, FileText, Store, Phone, Mail, ShoppingCart } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { getImageUrl, type ProductImage } from "@/lib/services/productService"
import { formatCurrency } from "@/lib/format"

export type StorePreviewPayload = {
  name: string
  category: string
  price: number
  stock: number
  description: string | null
  images: ProductImage[]
}

export function StorePreviewDialog({
  open,
  onOpenChange,
  storePreview,
  user,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  storePreview: StorePreviewPayload | null
  user: any
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(92vw,40rem)] w-full gap-0 overflow-hidden p-0 sm:max-w-[min(92vw,40rem)]">
        <DialogHeader className="sr-only">
          <DialogTitle>Vista previa en la tienda</DialogTitle>
          <DialogDescription>
            Previsualiza cómo se verá el producto en el portal del cliente.
          </DialogDescription>
        </DialogHeader>
        {storePreview && (
          <div className="grid max-h-[min(88vh,36rem)] grid-cols-1 overflow-y-auto sm:grid-cols-[minmax(0,11rem)_1fr] md:grid-cols-[minmax(0,13rem)_1fr]">
            <div className="relative flex min-h-[200px] flex-col items-center justify-center bg-muted p-4 sm:max-h-[min(88vh,36rem)] sm:min-h-0 sm:p-5">
              {storePreview.images.length > 0 && storePreview.images.some((img) => img?.url || img?.filePath) ? (
                <div className="relative mx-auto aspect-square w-full max-w-[220px] md:max-w-[13rem]">
                  {(() => {
                    const previewImage = storePreview.images.find((img) => Boolean(img?.url || img?.filePath))
                    return previewImage ? (
                      <Image
                        src={getImageUrl(previewImage, 400)}
                        alt={storePreview.name}
                        fill
                        className="object-contain p-1"
                        sizes="208px"
                        priority
                      />
                    ) : null
                  })()}
                  {storePreview.images.length > 1 && (
                    <span className="absolute bottom-1 right-1 rounded-md bg-background/90 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      +{storePreview.images.length - 1} en la tienda
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImageIcon className="size-14 opacity-50" />
                  <span className="text-xs">Sin imagen</span>
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Vista previa — portal cliente</p>
              <div>
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-primary">
                  {storePreview.category}
                </span>
                <h2 className="text-lg font-bold leading-snug text-foreground sm:text-xl">{storePreview.name}</h2>
                <p className="mt-1.5 text-xl font-bold text-primary">{formatCurrency(storePreview.price)}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {storePreview.stock > 0 ? `En stock (${storePreview.stock} disponibles)` : "Sin stock"}
                </p>
              </div>
              {storePreview.description?.trim() ? (
                <div className="min-w-0">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <FileText className="size-4 shrink-0 text-primary" />
                    Descripción
                  </h3>
                  <ScrollArea className="max-h-36 rounded-lg border border-border bg-muted/20">
                    <p className="whitespace-pre-wrap p-3 pr-6 text-sm leading-relaxed text-muted-foreground">
                      {storePreview.description}
                    </p>
                  </ScrollArea>
                </div>
              ) : null}
              <div className="h-px w-full shrink-0 bg-border" />
              <div className="min-w-0">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Store className="size-4 shrink-0 text-primary" />
                  Información del Proveedor
                </h3>
                <div className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/30 p-3 text-sm text-muted-foreground">
                  <div className="flex min-w-0 gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Store className="size-4" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Tienda</span>
                      <span className="break-words text-sm font-medium text-foreground">{user?.businessName || user?.fullName || "Distribuidor Autorizado BizShop"}</span>
                    </div>
                  </div>
                  <div className="flex min-w-0 gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Phone className="size-4" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Teléfono</span>
                      <span className="break-all text-sm font-medium text-foreground">{user?.phone || "+52 555 123 4567"}</span>
                    </div>
                  </div>
                  <div className="flex min-w-0 gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Mail className="size-4" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Contacto</span>
                      <span className="break-all text-sm font-medium text-foreground">{user?.email || "ventas@bizshop.com"}</span>
                    </div>
                  </div>
                </div>
              </div>
              <Button disabled className="h-10 gap-2 opacity-80">
                <ShoppingCart className="size-4" />
                Agregar al carrito
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
