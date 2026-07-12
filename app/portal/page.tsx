"use client"

import React, { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import {
  Search, ShoppingCart, Heart,
  Package, Zap, Truck, Shield as ShieldIcon,
  Star, ImageIcon, Loader2, RefreshCw,
  Store, Phone, Mail, FileText, User
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { fetchProducts, fetchProductImages, getImageUrl, type Product, type ProductImage } from "@/lib/services/productService"
import { fetchStoreDescription, getProfilePhotoUrl, type StoreDescription } from "@/lib/services/adminService"
import {
  getPortalCart,
  savePortalCart,
  type CartItem,
} from "@/lib/portal-store"
import { StoreCheckoutBar } from "@/components/portal/store-checkout-bar"

// Producto con imágenes cargadas para la tienda
interface StoreProduct extends Product {
  loadedImages: ProductImage[];
  imageLoading: boolean;
  provider?: any;
}

export default function TiendaPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [cart, setCart] = useState<CartItem[]>([])
  const [favorites, setFavorites] = useState<number[]>([])
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null)
  const [storeInfo, setStoreInfo] = useState<StoreDescription | null>(null)
  const [detailCarouselApi, setDetailCarouselApi] = useState<CarouselApi | null>(null)

  // Embla mide mal el ancho si el carrusel estaba oculto (diálogo cerrado); reInit al abrir
  useEffect(() => {
    if (!selectedProduct || !detailCarouselApi) return
    const id = requestAnimationFrame(() => detailCarouselApi.reInit())
    return () => cancelAnimationFrame(id)
  }, [selectedProduct?.id, detailCarouselApi])

  // Cargar productos reales de la API
  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true)

      // API antigua: trae todos los activos (sin importar si tienen imagen) y busca imágenes manual
      const data = await fetchProducts(100)

      // Intentar obtener el adminId real a partir de los productos devueltos
      const firstProductWithAdmin = data.find(p => p.userAdminId != null)
      const adminId = firstProductWithAdmin?.userAdminId

      // Cargar información del vendedor/tienda
      if (adminId) {
        try {
          const info = await fetchStoreDescription(adminId)
          setStoreInfo(info)
        } catch (profileErr) {
          console.error("Error al cargar perfil de la tienda:", profileErr)
          setStoreInfo(null)
        }
      }

      // Inicializar productos con imágenes vacías
      const storeProducts: StoreProduct[] = data.map((p: Product) => ({
        ...p,
        loadedImages: p.images || [],
        imageLoading: true,
      }))
      setProducts(storeProducts)

      // Cargar imágenes de cada producto en paralelo
      const imagePromises = storeProducts.map(async (product) => {
        // Si el JSON ya incluyó imágenes, no volvemos a pedirlas
        if (product.loadedImages.length > 0) return { id: product.id, images: product.loadedImages }
        try {
          const images = await fetchProductImages(product.id)
          return { id: product.id, images }
        } catch {
          return { id: product.id, images: [] }
        }
      })

      const results = await Promise.allSettled(imagePromises)

      setProducts(prev =>
        prev.map(p => {
          const result = results.find((r): r is PromiseFulfilledResult<{ id: number; images: ProductImage[] }> =>
            r.status === "fulfilled" && r.value.id === p.id
          )
          return {
            ...p,
            loadedImages: result?.value.images || p.loadedImages,
            imageLoading: false,
          }
        })
      )
    } catch (err) {
      console.error("Error al cargar productos:", err)
      toast.error("No se pudieron cargar los productos. Verifica que el servidor esté activo.", {
        action: {
          label: "Reintentar",
          onClick: () => loadProducts()
        }
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  useEffect(() => {
    setCart(getPortalCart())
  }, [])

  // Extraer categorías dinámicamente de los productos
  const dynamicCategories = React.useMemo(() => Array.from(
    new Set(products.map(p => p.category).filter(Boolean))
  ).sort(), [products])

  const allCategories = React.useMemo(() => [
    { id: "all", label: "Todos" },
    ...dynamicCategories.map(cat => ({ id: cat.toLowerCase(), label: cat }))
  ], [dynamicCategories])

  // Filtrado optimizado
  const filteredProducts = React.useMemo(() => {
    const q = searchQuery.toLowerCase()
    return products.filter(p => {
      // Filtrar productos inactivos (eliminados lógicamente)
      if (p.active === false) return false

      const desc = (p.description ?? "").toLowerCase()
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        desc.includes(q)
      const matchesCategory =
        selectedCategory === "all" ||
        p.category.toLowerCase() === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, selectedCategory])

  const toggleFavorite = (id: number) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

  const getCartQuantity = (productId: number) =>
    cart.find((i) => i.productId === productId)?.quantity ?? 0

  const addToCart = (id: number) => {
    const product = products.find((p) => p.id === id)
    if (!product || product.stock <= 0) return

    setCart((prev) => {
      const existing = prev.find((i) => i.productId === id)
      let next: CartItem[]
      if (existing) {
        if (existing.quantity >= product.stock) return prev
        next = prev.map((i) =>
          i.productId === id ? { ...i, quantity: i.quantity + 1 } : i
        )
      } else {
        next = [...prev, { productId: id, quantity: 1 }]
      }
      savePortalCart(next)
      return next
    })
  }

  const getProductImages = (productId: number) =>
    products.find((p) => p.id === productId)?.loadedImages ?? []

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount)
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <>
        {/* Hero skeleton */}
        <div className="mb-8 rounded-2xl p-8 bg-card border border-border">
          <div className="flex items-center justify-center gap-3 py-12">
            <Loader2 className="size-6 animate-spin text-primary" />
            <span className="text-muted-foreground font-medium">Cargando productos...</span>
          </div>
        </div>
        {/* Grid skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border border-border bg-card">
              <CardContent className="p-4">
                <div className="mb-4 h-48 rounded-xl bg-muted animate-pulse" />
                <div className="h-3 w-16 rounded bg-muted animate-pulse mb-2" />
                <div className="h-4 w-3/4 rounded bg-muted animate-pulse mb-1" />
                <div className="h-3 w-1/2 rounded bg-muted animate-pulse mb-4" />
                <div className="h-6 w-24 rounded bg-muted animate-pulse mb-3" />
                <div className="h-10 w-full rounded-lg bg-muted animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </>
    )
  }



  return (
    <>
      {/* Hero / Search Section */}
      <div className="mb-8 rounded-2xl p-8 relative overflow-hidden bg-card border border-border">
        <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-primary to-transparent" />
        <div className="relative">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground">Explora nuestra tienda</h1>
            <p className="text-sm mt-1 text-muted-foreground">
              Encuentra los mejores productos al mejor precio
            </p>
          </div>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-3xl items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar productos, categorías..."
                className="h-12 pl-12 pr-4 rounded-xl text-base bg-input border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Truck, label: "Envío Gratis", sub: "En pedidos +$99" },
          { icon: ShieldIcon, label: "Compra Segura", sub: "100% protegido" },
          { icon: Zap, label: "Envío Express", sub: "24-48 horas" },
          { icon: Star, label: "Garantía", sub: "Satisfacción total" },
        ].map((badge, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl p-3 bg-card border border-border">
            <badge.icon className="size-5 shrink-0 text-primary" />
            <div>
              <p className="text-xs font-semibold text-foreground">{badge.label}</p>
              <p className="text-[10px] text-muted-foreground">{badge.sub}</p>
            </div>
          </div>
        ))}
      </div>


      {/* Categories - Dinámicas de los productos */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {allCategories.map((cat) => {
          const isActive = selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border ${isActive
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-card text-muted-foreground border-transparent hover:text-foreground hover:bg-muted"
                }`}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Results count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filteredProducts.length}</span> productos encontrados
        </p>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product) => {
          const isFav = favorites.includes(product.id)
          const cartQty = getCartQuantity(product.id)
          const inCart = cartQty > 0
          const inStock = product.stock > 0
          const sortedImages = product.loadedImages.length > 0
            ? [...product.loadedImages].sort((a, b) => a.displayOrder - b.displayOrder)
            : []

          return (
            <Card
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="group relative overflow-hidden border border-border bg-card transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-primary/30 cursor-pointer"
            >
              {/* Low stock badge */}
              {inStock && product.stock < 10 && (
                <div className="absolute top-3 left-3 z-10 rounded-lg bg-amber-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  ¡Últimas {product.stock}!
                </div>
              )}

              {/* Out of stock badge */}
              {!inStock && (
                <div className="absolute top-3 left-3 z-10 rounded-lg bg-destructive px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-destructive-foreground">
                  Agotado
                </div>
              )}

              {/* Favorite button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFavorite(product.id)
                }}
                className={`absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full transition-all ${isFav ? "bg-destructive/20" : "bg-muted/80 backdrop-blur-sm"
                  }`}
              >
                <Heart
                  className={`size-4 transition-colors ${isFav ? "" : "text-muted-foreground"}`}
                  style={{
                    color: isFav ? "hsl(0, 70%, 55%)" : undefined,
                    fill: isFav ? "hsl(0, 70%, 55%)" : "none"
                  }}
                />
              </button>

              <CardContent className="p-4">
                {/* Product Images Carousel */}
                <div className="mb-4 flex h-56 items-center justify-center rounded-xl bg-muted overflow-hidden relative">
                  {product.imageLoading ? (
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  ) : sortedImages.length > 0 ? (
                    <Carousel
                      className="w-full h-full group/carousel"
                      opts={{ loop: sortedImages.length > 1 }}
                    >
                      <CarouselContent className="h-full">
                        {sortedImages.map((img) => (
                          <CarouselItem key={img.id} className="relative h-56 w-full">
                            {img?.url || img?.filePath ? (
                              <Image
                                src={getImageUrl(img)}
                                alt={`${product.name} - ${img.displayOrder}`}
                                fill
                                className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                              />
                            ) : null}
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      {sortedImages.length > 1 && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <CarouselPrevious className="absolute left-1 top-1/2 z-10 h-8 w-8 opacity-0 transition-opacity group-hover/carousel:opacity-100 shadow-md bg-background/90 hover:bg-background border-border" />
                          <CarouselNext className="absolute right-1 top-1/2 z-10 h-8 w-8 opacity-0 transition-opacity group-hover/carousel:opacity-100 shadow-md bg-background/90 hover:bg-background border-border" />
                        </div>
                      )}
                    </Carousel>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ImageIcon className="size-10" />
                      <span className="text-xs">Sin imagen</span>
                    </div>
                  )}
                </div>

                {/* Category */}
                <p className="text-[11px] font-medium mb-1 text-primary">
                  {product.category}
                </p>

                {/* Product name */}
                <h3 className="text-sm font-semibold text-foreground leading-tight mb-1 line-clamp-2">
                  {product.name}
                </h3>

                {/* Stock info */}
                <div className="flex items-center gap-1.5 mb-3">
                  {inStock ? (
                    <span className="text-[11px] font-medium" style={{ color: "hsl(145, 60%, 45%)" }}>
                      En stock ({product.stock} disponibles)
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-destructive">
                      Sin stock
                    </span>
                  )}
                </div>

                {/* Image thumbnails (if more than 1) */}
                {product.loadedImages.length > 1 && (
                  <div className="flex gap-1.5 mb-3 overflow-x-auto">
                    {product.loadedImages
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .slice(0, 4)
                      .map((img, idx) => (
                        <div
                          key={img.id}
                          className={`relative h-10 w-10 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${idx === 0 ? "border-primary" : "border-border hover:border-primary/50"
                            }`}
                        >
                          {img?.url || img?.filePath ? (
                            <Image
                              src={getImageUrl(img)}
                              alt={`${product.name} ${idx + 1}`}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : null}
                        </div>
                      ))}
                    {product.loadedImages.length > 4 && (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-border bg-muted">
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          +{product.loadedImages.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Price */}
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-xl font-bold text-foreground">
                    {formatCurrency(product.price)}
                  </span>
                </div>

                {/* Free shipping badge */}
                <div className="flex items-center gap-1 mb-3">
                  <Truck className="size-3" style={{ color: "hsl(145, 60%, 45%)" }} />
                  <span className="text-[11px] font-medium" style={{ color: "hsl(145, 60%, 50%)" }}>Envío disponible</span>
                </div>

                {/* Add to cart button */}
                <Button
                  className={`w-full gap-2 font-semibold text-sm ${!inStock
                    ? "bg-muted text-muted-foreground"
                    : inCart
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  disabled={!inStock}
                  onClick={(e) => {
                    e.stopPropagation()
                    addToCart(product.id)
                  }}
                >
                  {!inStock ? "Agotado" : inCart ? (
                    <><ShoppingCart className="size-4" /> En carrito ({cartQty})</>
                  ) : (
                    <><ShoppingCart className="size-4" /> Agregar al carrito</>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty state */}
      {filteredProducts.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Package className="size-16 mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No se encontraron productos</h3>
          <p className="text-sm text-muted-foreground">
            Intenta con otros filtros o términos de búsqueda
          </p>
        </div>
      )}

      {/* Product Details Dialog */}
      <Dialog
        open={!!selectedProduct}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProduct(null)
            setDetailCarouselApi(null)
          }
        }}
      >
        <DialogContent className="max-w-[min(96vw,52rem)] w-full p-0 overflow-hidden bg-card border-border sm:rounded-xl gap-0">
          {selectedProduct && (
            <>
              <DialogTitle className="sr-only">{selectedProduct.name}</DialogTitle>
              <DialogDescription className="sr-only">Detalles del producto {selectedProduct.name}</DialogDescription>
              <div className="grid max-h-[min(92vh,40rem)] grid-cols-1 overflow-y-auto md:grid-cols-[minmax(17rem,46%)_minmax(0,1fr)] md:overflow-y-hidden">
                {/* Left: Images — más grande; flechas con centrado estable (carousel.tsx) */}
                <div className="relative flex min-h-[min(52vw,280px)] flex-col items-stretch justify-center bg-muted p-3 sm:p-4 md:min-h-[min(72vh,26rem)] md:max-h-[min(92vh,40rem)]">
                  {selectedProduct.loadedImages.length > 0 ? (
                    <Carousel
                      key={`detail-${selectedProduct.id}`}
                      setApi={(api) => setDetailCarouselApi(api ?? null)}
                      className="w-full min-h-0 flex-1"
                      opts={{ loop: selectedProduct.loadedImages.length > 1 }}
                    >
                      <CarouselContent className="h-full">
                        {[...selectedProduct.loadedImages]
                          .sort((a, b) => a.displayOrder - b.displayOrder)
                          .map((img) => (
                            <CarouselItem key={img.id} className="relative min-h-[min(52vw,260px)] w-full basis-full md:min-h-[min(68vh,22rem)]">
                              <Image
                                src={getImageUrl(img)}
                                alt={`${selectedProduct.name} - ${img.displayOrder}`}
                                fill
                                className="object-contain p-2"
                                sizes="(max-width: 768px) 96vw, 45vw"
                                priority
                              />
                            </CarouselItem>
                          ))}
                      </CarouselContent>
                      {selectedProduct.loadedImages.length > 1 && (
                        <>
                          <CarouselPrevious className="left-2 top-1/2 z-20 size-9 border-border bg-background/95 shadow-md hover:bg-background disabled:opacity-40" />
                          <CarouselNext className="right-2 top-1/2 z-20 size-9 border-border bg-background/95 shadow-md hover:bg-background disabled:opacity-40" />
                        </>
                      )}
                    </Carousel>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                      <ImageIcon className="size-16 opacity-50" />
                      <span className="text-xs">Sin imagen disponible</span>
                    </div>
                  )}
                </div>

                {/* Right: Info — compacto */}
                <div className="flex min-w-0 flex-col gap-2.5 overflow-y-auto p-3 sm:p-4 md:max-h-[min(92vh,40rem)]">
                  <div>
                    <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-primary">
                      {selectedProduct.category}
                    </span>
                    <h2 className="line-clamp-2 text-base font-bold leading-snug text-foreground">
                      {selectedProduct.name}
                    </h2>
                    <p className="mt-1 text-lg font-bold text-primary">
                      {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(selectedProduct.price)}
                    </p>
                  </div>

                  {selectedProduct.description?.trim() ? (
                    <div className="min-w-0">
                      <h3 className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <FileText className="size-3.5 shrink-0 text-primary" />
                        Descripción
                      </h3>
                      <ScrollArea className="max-h-28 rounded-md border border-border bg-muted/20">
                        <p className="whitespace-pre-wrap p-2 pr-5 text-xs leading-relaxed text-muted-foreground">
                          {selectedProduct.description}
                        </p>
                      </ScrollArea>
                    </div>
                  ) : null}

                  <div className="h-px w-full shrink-0 bg-border" />

                  <div className="min-w-0">
                    <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Store className="size-3.5 shrink-0 text-primary" />
                      Proveedor
                    </h3>
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-2.5 text-xs text-muted-foreground">
                      {storeInfo?.photo ? (
                        <div className="relative size-9 shrink-0 overflow-hidden rounded-full border border-border">
                          <Image
                            src={getProfilePhotoUrl(storeInfo.photo)}
                            alt={storeInfo.businessName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Store className="size-4" />
                        </div>
                      )}
                      <div className="flex min-w-0 flex-col justify-center">
                        <span className="truncate font-semibold text-foreground">
                          {storeInfo?.businessName || "Distribuidor Autorizado"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px]">
                          <span className="size-1.5 rounded-full bg-green-500" />
                          Vendedor verificado
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-2 pt-1 sm:flex-row">
                    <Button
                      className="flex-1 gap-2 h-9 text-xs shadow-md shadow-primary/15"
                      disabled={selectedProduct.stock <= 0}
                      onClick={() => {
                        addToCart(selectedProduct.id)
                        setSelectedProduct(null)
                      }}
                    >
                      <ShoppingCart className="size-4" />
                      {selectedProduct.stock <= 0 ? "Agotado" : "Agregar al carrito"}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {!isLoading && (
        <StoreCheckoutBar
          cart={cart}
          products={products}
          getProductImages={getProductImages}
          onCartChange={(next) => {
            setCart(next)
            savePortalCart(next)
          }}
          formatCurrency={formatCurrency}
          onPurchaseComplete={loadProducts}
        />
      )}
    </>
  )
}
