"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import Image from "next/image"
import { useRouter, useParams } from "next/navigation"
import {
  ArrowLeft, FileText, Heart, ImageIcon, Minus, Plus,
  ShoppingCart, Sparkles, Star, Store, TrendingDown, Truck,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { fetchActiveProductsWithImages, fetchProducts, fetchProductImages, getImageUrl, normalizeProduct, type Product, type ProductImage } from "@/lib/services/productService"
import { fetchStoreDescription, getProfilePhotoUrl, type StoreDescription } from "@/lib/services/adminService"
import {
  getPortalCart,
  savePortalCart,
  getPortalFavorites,
  savePortalFavorites,
  getCachedProducts,
  saveCachedProducts,
  type CartItem,
} from "@/lib/portal-store"
import { ImageZoom } from "@/components/portal/image-zoom"
import { OfferCountdown } from "@/components/portal/offer-countdown"
import {
  getOfferForProduct,
  getOfferDeadline,
  getBuyersCount,
  getAvatarForProduct,
} from "@/lib/social-proof"
import {
  addUserReview,
  formatReviewDate,
  getAverageRating,
  getReviewsForProduct,
  type Review,
} from "@/lib/reviews"
import { formatCurrency } from "@/lib/format"

interface ProductWithImages extends Product {
  loadedImages: ProductImage[]
}

export default function ProductoPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const productId = Number(params?.id)

  const [product, setProduct] = useState<ProductWithImages | null>(null)
  const [catalog, setCatalog] = useState<ProductWithImages[]>([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<number[]>(() => getPortalFavorites())
  const [cart, setCart] = useState<CartItem[]>(() => getPortalCart())
  const [qty, setQty] = useState(1)
  const [detailCarouselApi, setDetailCarouselApi] = useState<CarouselApi | null>(null)
  const [reviews, setReviews] = useState<Review[]>(() =>
    Number.isFinite(productId) ? getReviewsForProduct(productId) : []
  )
  const [storeInfo, setStoreInfo] = useState<StoreDescription | null>(null)

  const isFav = favorites.includes(productId)
  const cartQty = cart.find((i) => i.productId === productId)?.quantity ?? 0
  const offer = product ? (getOfferForProduct(product.id, product.price) ?? null) : null
  const buyers = product ? getBuyersCount(product.id) : 0
  const avgRating = getAverageRating(reviews)

  const loadProduct = useCallback(async () => {
    try {
      const cached = getCachedProducts<ProductWithImages>()
      const fromCache = cached?.find((p) => p.id === productId) ?? null
      if (fromCache) {
        setProduct({ ...normalizeProduct(fromCache), loadedImages: fromCache.loadedImages || fromCache.images || [] })
        setLoading(false)
      }

      let data: Product[] | null = null
      try {
        // Usar activeProducts para que el detalle muestre el stock real.
        data = await fetchProducts(100)
      } catch {
        data = null
      }
      if (!Array.isArray(data) || data.length === 0) {
        data = await fetchActiveProductsWithImages()
      }
      if (!data || data.length === 0) return

      const found = data.find((p) => p.id === productId)
      if (!found) {
        setProduct(null)
        setLoading(false)
        return
      }

      let loadedImages: ProductImage[] = found.images || []
      if (loadedImages.length === 0) {
        try {
          loadedImages = await fetchProductImages(productId)
        } catch {
          loadedImages = []
        }
      }
      setProduct({ ...found, loadedImages })

      setCatalog(
        data.map((p) => ({
          ...p,
          loadedImages: p.images || [],
        }))
      )
      saveCachedProducts(data.map((p) => ({ ...p, loadedImages: p.images || [] })))

      const adminId = found.userAdminId
      if (adminId) {
        fetchStoreDescription(adminId).then(setStoreInfo).catch(() => setStoreInfo(null))
      }
    } catch (err) {
      console.error("Error al cargar producto:", err)
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    if (Number.isFinite(productId)) loadProduct()
  }, [loadProduct, productId])

  useEffect(() => {
    if (product) {
      setCart(getPortalCart())
      setFavorites(getPortalFavorites())
    }
  }, [product])

  // Embla reInit al cargar el carrusel
  useEffect(() => {
    if (!product || !detailCarouselApi) return
    const id = requestAnimationFrame(() => detailCarouselApi.reInit())
    return () => cancelAnimationFrame(id)
  }, [product?.id, detailCarouselApi])

  const similarProducts = useMemo<ProductWithImages[]>(() => {
    if (!product) return []
    return catalog
      .filter((p) => p.id !== product.id && p.category === product.category)
      .slice(0, 4)
  }, [product, catalog])

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
      savePortalFavorites(next)
      return next
    })
  }

  const addToCart = () => {
    if (!product || product.stock <= 0) return
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      let next: CartItem[]
      if (existing) {
        const sum = Math.min(product.stock, existing.quantity + qty)
        next = prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: sum } : i
        )
      } else {
        next = [...prev, { productId: product.id, quantity: Math.min(product.stock, qty) }]
      }
      savePortalCart(next)
      return next
    })
    toast.success("Agregado al carrito", { description: `${product.name} × ${qty}` })
  }

  const submitReview = (rating: number, text: string) => {
    const review = addUserReview(productId, rating, text)
    setReviews((prev) =>
      [review, ...prev.filter((r) => !r.mine)].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    )
    toast.success("Gracias por tu reseña")
  }

  if (loading) return <DetailSkeleton />

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <PackageEmpty />
        <h2 className="mt-4 text-lg font-semibold text-foreground">Producto no encontrado</h2>
        <p className="mt-1 text-sm text-muted-foreground">Es posible que ya no esté disponible.</p>
        <Button className="mt-6 gap-2" onClick={() => router.push("/portal")}>
          <ArrowLeft className="size-4" />
          Volver a la tienda
        </Button>
      </div>
    )
  }

  const inStock = product.stock > 0
  const sortedImages = [...product.loadedImages].sort((a, b) => a.displayOrder - b.displayOrder)

  return (
    <div className="space-y-6">
      {/* Volver */}
      <button
        onClick={() => router.push("/portal")}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a la tienda
      </button>

      {/* Detalle principal */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(20rem,46%)_minmax(0,1fr)]">
        {/* Imágenes */}
        <Card className="border border-border bg-card overflow-hidden">
          <CardContent className="flex min-h-[min(60vw,26rem)] flex-col gap-3 bg-muted/40 p-3 sm:p-4">
            <div className="relative flex min-h-[min(52vw,22rem)] flex-1 items-center justify-center overflow-hidden rounded-xl bg-muted">
              {sortedImages.length > 0 ? (
                <Carousel
                  key={`detail-${product.id}`}
                  setApi={(api) => setDetailCarouselApi(api ?? null)}
                  className="h-full w-full"
                  opts={{ loop: sortedImages.length > 1 }}
                >
                  <CarouselContent className="h-full">
                    {sortedImages.map((img, idx) => (
                      <CarouselItem key={img.id} className="relative h-[min(52vw,22rem)] w-full basis-full">
                        {img?.url || img?.filePath ? (
                          <ImageZoom
                            src={getImageUrl(img, 1200)}
                            alt={`${product.name} - ${img.displayOrder}`}
                            sizes="(max-width: 1024px) 96vw, 46vw"
                            priority={idx === 0}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <ImageIcon className="size-14 text-muted-foreground/40" />
                          </div>
                        )}
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {sortedImages.length > 1 && (
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

              {/* Badge oferta */}
              {offer && (
                <div className="absolute left-3 top-3 z-20 rounded-lg bg-destructive px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-destructive-foreground shadow-sm">
                  <span className="inline-flex items-center gap-1">
                    <TrendingDown className="size-3" />
                    -{offer.discountPct}%
                  </span>
                </div>
              )}
            </div>

            {/* Miniaturas */}
            {sortedImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {sortedImages.slice(0, 5).map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => detailCarouselApi?.scrollTo(idx, true)}
                    className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 border-border transition-colors hover:border-primary/60"
                  >
                    {img?.url || img?.filePath ? (
                      <Image
                        src={getImageUrl(img, 160)}
                        alt={`${product.name} ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div>
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-primary">
              {product.category}
            </span>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold leading-snug text-foreground">{product.name}</h1>
              <button
                type="button"
                onClick={() => toggleFavorite(product.id)}
                aria-label="Agregar a favoritos"
                className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-all ${isFav ? "bg-destructive/20" : "bg-muted/80"}`}
              >
                <Heart
                  className={`size-4.5 ${isFav ? "" : "text-muted-foreground"}`}
                  style={{
                    color: isFav ? "var(--foreground)" : undefined,
                    fill: isFav ? "var(--foreground)" : "none",
                  }}
                />
              </button>
            </div>

            {/* Rating */}
            {avgRating > 0 && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`size-3.5 ${star <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`}
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold text-foreground">{avgRating}</span>
                <span className="text-xs text-muted-foreground">({reviews.length} reseñas)</span>
              </div>
            )}

            {/* Precio */}
            <div className="mt-2 flex items-end gap-2">
              <p className="text-3xl font-bold text-foreground">{formatCurrency(product.price)}</p>
              {offer && (
                <span className="text-sm font-medium text-muted-foreground line-through">
                  {formatCurrency(offer.originalPrice)}
                </span>
              )}
            </div>

            {/* Oferta + countdown */}
            {offer && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                <TrendingDown className="size-3.5" />
                Oferta -{offer.discountPct}% · Termina en{" "}
                <OfferCountdown deadline={getOfferDeadline()} />
              </div>
            )}

            {/* Stock */}
            <div className="mt-2 flex items-center gap-1.5">
              {inStock ? (
                <>
                  <CheckCircle2 className="size-4 text-green-500" />
                  <span className="text-sm font-medium text-primary">
                    En stock ({product.stock} disponibles)
                  </span>
                </>
              ) : (
                <span className="text-sm font-medium text-destructive">Sin stock</span>
              )}
            </div>

            {/* Social proof */}
            {buyers > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {[0, 1, 2].map((i) => {
                    const avatar = getAvatarForProduct(product.id, i)
                    return (
                      <div
                        key={i}
                        className={`flex size-5 items-center justify-center rounded-full border-2 border-background ${avatar.bg}`}
                      >
                        <span className={`text-[7px] font-bold ${avatar.text}`}>
                          {avatar.initials}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{buyers}</span> personas compraron esto
                </span>
              </div>
            )}
          </div>

          {/* Descripción */}
          {product.description?.trim() ? (
            <div>
              <h3 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <FileText className="size-4 shrink-0 text-primary" />
                Descripción
              </h3>
              <p className="whitespace-pre-wrap rounded-xl border border-border bg-muted/20 p-3 text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </div>
          ) : null}

          {/* Proveedor */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
            {storeInfo?.photo ? (
              <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-border">
                <Image
                  src={getProfilePhotoUrl(storeInfo.photo)}
                  alt={storeInfo.businessName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Store className="size-5" />
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

          {/* Acciones */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/20 p-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9"
                disabled={qty <= 1}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                <Minus className="size-4" />
              </Button>
              <span className="min-w-[2rem] text-center text-lg font-bold text-foreground">{qty}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9"
                disabled={!inStock || qty >= product.stock}
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
              >
                <Plus className="size-4" />
              </Button>
            </div>

            <Button
              className="flex-1 gap-2"
              disabled={!inStock}
              onClick={addToCart}
            >
              <ShoppingCart className="size-4" />
              {!inStock ? "Agotado" : cartQty > 0 ? `En carrito (${cartQty})` : "Agregar al carrito"}
            </Button>
          </div>

          {/* Envío */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <Truck className="size-4" />
            Envío disponible · gratis en pedidos +$99
          </div>
        </div>
      </div>

      {/* Productos similares */}
      {similarProducts.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Sparkles className="size-4 shrink-0 text-primary" />
            Productos similares
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {similarProducts.map((sp) => {
              const spImg = [...(sp.loadedImages || [])].sort((a, b) => a.displayOrder - b.displayOrder)[0]
              return (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => router.push(`/portal/producto/${sp.id}`)}
                  className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div className="relative h-28 w-full overflow-hidden rounded-lg bg-muted">
                    {spImg?.url || spImg?.filePath ? (
                      <Image
                        src={getImageUrl(spImg, 400)}
                        alt={sp.name}
                        fill
                        className="object-contain p-1 transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon className="size-6 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <span className="line-clamp-2 text-xs font-medium leading-tight text-foreground">
                    {sp.name}
                  </span>
                  <span className="text-sm font-bold text-primary">{formatCurrency(sp.price)}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Reseñas */}
      <ReviewsSection
        reviews={reviews}
        avgRating={avgRating}
        onSubmit={submitReview}
      />
    </div>
  )
}

// ── Subcomponentes ──────────────────────────────────────────────

function ReviewsSection({
  reviews,
  avgRating,
  onSubmit,
}: {
  reviews: Review[]
  avgRating: number
  onSubmit: (rating: number, text: string) => void
}) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [text, setText] = useState("")

  const submit = () => {
    if (rating < 1) {
      toast.error("Selecciona una calificación (1-5 estrellas)")
      return
    }
    if (text.trim().length < 3) {
      toast.error("Escribe un comentario")
      return
    }
    onSubmit(rating, text)
    setRating(0)
    setHover(0)
    setText("")
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-1.5 text-lg font-bold text-foreground">
          <Star className="size-5 text-amber-400" />
          Reseñas
          {avgRating > 0 && (
            <span className="text-sm font-semibold text-muted-foreground">
              · {avgRating} / 5 ({reviews.length})
            </span>
          )}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
        {/* Lista */}
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-border p-8 text-center">
              <Star className="mb-2 size-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">Aún no hay reseñas</p>
              <p className="mt-1 text-xs text-muted-foreground">Sé el primero en comentar este producto.</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div
                key={review.id}
                className={`rounded-xl border p-4 ${review.mine ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}
              >
                <div className="mb-2 flex items-center gap-3">
                  <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${review.avatarBg}`}>
                    <span className="text-xs font-bold">{review.initials}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      {review.author}
                      {review.mine && (
                        <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
                          Tú
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{formatReviewDate(review.date)}</p>
                  </div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`size-3.5 ${star <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-foreground">{review.text}</p>
              </div>
            ))
          )}
        </div>

        {/* Formulario */}
        <div className="h-fit rounded-xl border border-border bg-card p-4 lg:sticky lg:top-[88px]">
          <h3 className="text-sm font-bold text-foreground">Deja tu reseña</h3>
          <p className="mb-3 text-xs text-muted-foreground">Cuéntanos qué te pareció el producto.</p>

          <div className="mb-3 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(star)}
                aria-label={`${star} estrella${star !== 1 ? "s" : ""}`}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`size-6 ${
                    (hover || rating) >= star
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/40"
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-xs font-semibold text-foreground">{rating}/5</span>
            )}
          </div>

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe tu comentario..."
            rows={4}
            className="mb-3 text-sm"
          />
          <Button className="w-full gap-2" onClick={submit}>
            <Star className="size-4" />
            Publicar reseña
          </Button>
        </div>
      </div>
    </div>
  )
}

function PackageEmpty() {
  return (
    <div className="flex size-20 items-center justify-center rounded-2xl bg-muted">
      <ImageIcon className="size-10 text-muted-foreground/40" />
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-4 w-32 rounded bg-muted animate-pulse" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(20rem,46%)_minmax(0,1fr)]">
        <div className="h-[min(60vw,26rem)] rounded-2xl bg-muted animate-pulse" />
        <div className="space-y-3">
          <div className="h-3 w-24 rounded bg-muted animate-pulse" />
          <div className="h-6 w-3/4 rounded bg-muted animate-pulse" />
          <div className="h-9 w-40 rounded bg-muted animate-pulse" />
          <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
          <div className="h-28 w-full rounded-xl bg-muted animate-pulse" />
          <div className="h-12 w-full rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  )
}
