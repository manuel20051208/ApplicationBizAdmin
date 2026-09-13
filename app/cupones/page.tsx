"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  CalendarClock,
  CheckCircle2,
  Copy,
  Loader2,
  Package,
  Plus,
  Tag,
  Trash2,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CouponCountdown } from "@/components/portal/coupon-countdown"
import { fetchAllProducts, type Product } from "@/lib/services/productService"
import { fetchClientsSummary, type ClientsSummaryView } from "@/lib/services/clientService"
import { getStoredUser } from "@/lib/auth/session"
import {
  assignProductCoupon,
  createProductCoupon,
  deleteProductCoupon,
  fetchMyCoupons,
  type ProductCoupon,
} from "@/lib/services/couponService"

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })
}

function isExpired(value: string) {
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now()
}

function formatDateTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "Selecciona una fecha y hora"
    : date.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })
}

export default function CuponesPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [clients, setClients] = useState<ClientsSummaryView[]>([])
  const [coupons, setCoupons] = useState<ProductCoupon[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [allProducts, setAllProducts] = useState(true)
  const [productLimit, setProductLimit] = useState("")
  const [code, setCode] = useState("")
  const [discount, setDiscount] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [expiresAt, setExpiresAt] = useState("")
  const [allClients, setAllClients] = useState(true)
  const [selectedClients, setSelectedClients] = useState<number[]>([])

  const loadData = useCallback(async () => {
    setLoading(true)
    const adminId = getStoredUser("admin")?.id
    const [productsResult, couponsResult, clientsResult] = await Promise.allSettled([
      fetchAllProducts(100),
      fetchMyCoupons(),
      adminId ? fetchClientsSummary(Number(adminId)) : Promise.reject(new Error("No hay sesión de administrador")),
    ])

    if (productsResult.status === "fulfilled") {
      setProducts(productsResult.value.filter((product) => product.active !== false))
    } else {
      console.error("Error al cargar productos para cupones:", productsResult.reason)
      toast.error("No se pudieron cargar los productos aplicables")
    }

    if (couponsResult.status === "fulfilled") {
      setCoupons(couponsResult.value)
    } else {
      console.error("Error al cargar cupones:", couponsResult.reason)
      toast.error(couponsResult.reason instanceof Error ? couponsResult.reason.message : "No se pudieron cargar los cupones")
    }

    if (clientsResult.status === "fulfilled") {
      setClients(clientsResult.value)
    } else {
      console.error("Error al cargar clientes para asignar cupones:", clientsResult.reason)
      toast.error("No se pudieron cargar los clientes para asignar el cupón")
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const baseProducts = useMemo(() => {
    if (allProducts) return products
    const selectedIds = new Set(selectedProducts)
    return products.filter((product) => selectedIds.has(product.id))
  }, [allProducts, products, selectedProducts])

  // Límite "a cuántos productos se aplica": 0/vacío = todos los elegibles.
  const limit = Number(productLimit)
  const effectiveCount = useMemo(() => {
    const cap = Number.isFinite(limit) && limit > 0 ? limit : baseProducts.length
    return Math.min(cap, baseProducts.length)
  }, [limit, baseProducts.length])
  const effectiveProductIds = useMemo(
    () => baseProducts.slice(0, Number.isFinite(limit) && limit > 0 ? limit : baseProducts.length).map((product) => product.id),
    [baseProducts, limit],
  )

  const canSubmit = useMemo(() => {
    const value = Number(discount)
    const uses = Number(quantity)
    return Boolean(code.trim() && expiresAt && value > 0 && value <= 100 && uses > 0 && effectiveCount > 0 && (allClients || selectedClients.length > 0))
  }, [code, discount, quantity, expiresAt, effectiveCount, allClients, selectedClients.length])

  const resetForm = () => {
    setCode("")
    setDiscount("")
    setQuantity("1")
    setExpiresAt("")
    setSelectedProducts([])
    setAllProducts(true)
    setProductLimit("")
    setAllClients(true)
    setSelectedClients([])
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = Number(discount)
    const uses = Number(quantity)
    if (!canSubmit) {
      toast.error("Completa el código, descuento, vigencia, productos cubiertos y productos aplicables")
      return
    }

    setSaving(true)
    try {
      const createdCoupon = await createProductCoupon({
        cuponCode: code.trim().toUpperCase(),
        // LocalDateTime de Spring espera la fecha sin zona horaria ni sufijo Z.
        cuponDateLimit: expiresAt,
        discount: value,
        quantity: uses,
        productIds: effectiveProductIds,
      })
      await assignProductCoupon({
        cuponId: createdCoupon.id,
        clientIds: allClients ? [] : selectedClients,
        assignToAll: allClients,
      })
      toast.success("Cupón creado correctamente")
      resetForm()
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el cupón")
    } finally {
      setSaving(false)
    }
  }

  const toggleProduct = (id: number) => {
    setAllProducts(false)
    setSelectedProducts((current) => current.includes(id)
      ? current.filter((productId) => productId !== id)
      : [...current, id])
  }

  const toggleClient = (id: number) => {
    setAllClients(false)
    setSelectedClients((current) => current.includes(id)
      ? current.filter((clientId) => clientId !== id)
      : [...current, id])
  }

  const handleDelete = async (coupon: ProductCoupon) => {
    try {
      await deleteProductCoupon(coupon.id)
      setCoupons((current) => current.filter((item) => item.id !== coupon.id))
      toast.success("Cupón eliminado")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el cupón")
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-3 sm:h-16 sm:px-4">
          <SidebarTrigger className="-ml-1 hidden md:inline-flex" />
          <Separator orientation="vertical" className="mr-2 hidden h-4 md:block" />
          <Breadcrumb className="hidden md:block">
            <BreadcrumbList><BreadcrumbItem><BreadcrumbPage>Cupones</BreadcrumbPage></BreadcrumbItem></BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex-1 space-y-6 p-3 pb-24 sm:p-6 sm:pb-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Promociones</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Cupones</h1>
            <p className="mt-1 text-muted-foreground">Crea descuentos para tus productos y controla su vigencia.</p>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Plus className="size-5 text-primary" /> Crear cupón</CardTitle>
                <CardDescription>Define el código, descuento y a cuántos productos aplica. El backend valida la cobertura.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="grid gap-2">
                    <Label htmlFor="coupon-code">Código del cupón</Label>
                    <Input id="coupon-code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="VERDE20" maxLength={30} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="coupon-discount">Descuento (%)</Label>
                      <Input id="coupon-discount" type="number" min="1" max="100" value={discount} onChange={(event) => setDiscount(event.target.value)} placeholder="20" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="coupon-quantity">Nº de productos cubiertos</Label>
                      <Input id="coupon-quantity" type="number" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="coupon-expires">Fecha de expiración</Label>
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <CalendarClock className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-muted-foreground">El cupón estará disponible hasta</p>
                          <p className="truncate text-sm font-semibold text-foreground">{formatDateTime(expiresAt)}</p>
                        </div>
                      </div>
                      <Input
                        id="coupon-expires"
                        type="datetime-local"
                        value={expiresAt}
                        min={new Date().toISOString().slice(0, 16)}
                        onChange={(event) => setExpiresAt(event.target.value)}
                        className="mt-3 h-10 bg-background/70 [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Label>Productos aplicables</Label>
                        <p className="text-xs text-muted-foreground">{allProducts ? "Todos los productos activos" : `${selectedProducts.length} seleccionados`}</p>
                      </div>
                      <Button type="button" size="sm" variant={allProducts ? "default" : "outline"} onClick={() => { setAllProducts(true); setSelectedProducts([]) }}>Todos</Button>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="coupon-product-limit">Aplicar a cuántos productos</Label>
                      <div className="flex items-center gap-2">
                        <Input id="coupon-product-limit" type="number" min="0" value={productLimit} onChange={(event) => setProductLimit(event.target.value)} placeholder={allProducts ? String(products.length || 0) : String(selectedProducts.length || 0)} className="h-9 w-32" />
                        <p className="text-xs text-muted-foreground">0 = todos los {allProducts ? products.length : selectedProducts.length} elegibles. Se aplicará a{" "}
                          <span className="font-semibold text-foreground">{effectiveCount} de {baseProducts.length}</span>.</p>
                      </div>
                    </div>
                    <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                      {products.length === 0 ? <p className="text-sm text-muted-foreground">No hay productos activos.</p> : products.map((product) => (
                        <label key={product.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50">
                          <input
                            type="checkbox"
                            checked={allProducts || selectedProducts.includes(product.id)}
                            onChange={() => toggleProduct(product.id)}
                            className="size-4 accent-[var(--primary)]"
                          />
                          <span className="min-w-0 flex-1 truncate text-sm">{product.name}</span>
                          <span className="text-xs text-muted-foreground">{product.stock} disponibles</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Label>Clientes que recibirán el cupón</Label>
                        <p className="text-xs text-muted-foreground">{allClients ? "Todos los clientes registrados" : `${selectedClients.length} seleccionados`}</p>
                      </div>
                      <Button type="button" size="sm" variant={allClients ? "default" : "outline"} onClick={() => { setAllClients(true); setSelectedClients([]) }}>Todos</Button>
                    </div>
                    <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                      {clients.length === 0 ? <p className="text-sm text-muted-foreground">No hay clientes disponibles.</p> : clients.map((client) => {
                        const id = Number(client.id)
                        return <label key={id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50">
                          <input type="checkbox" checked={allClients || selectedClients.includes(id)} onChange={() => toggleClient(id)} className="size-4 accent-[var(--primary)]" />
                          <span className="min-w-0 flex-1 truncate text-sm">{client.fullName || client.clientName || client.name || "Cliente"}</span>
                          <span className="max-w-[10rem] truncate text-xs text-muted-foreground">{client.email || ""}</span>
                        </label>
                      })}
                    </div>
                  </div>

                  <Button type="submit" className="w-full gap-2" disabled={saving || loading || !canSubmit}>
                    {saving ? <Loader2 className="size-4 animate-spin" /> : <Tag className="size-4" />}
                    {saving ? "Creando..." : "Crear cupón"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><TicketIcon /> Mis cupones</CardTitle>
                <CardDescription>Cupones de productos creados por tu negocio.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? <div className="flex items-center justify-center py-14 text-muted-foreground"><Loader2 className="mr-2 size-5 animate-spin" /> Cargando...</div> : coupons.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center"><Tag className="mx-auto mb-3 size-8 text-muted-foreground" /><p className="font-medium">Aún no tienes cupones</p><p className="mt-1 text-sm text-muted-foreground">Crea el primero desde este panel.</p></div>
                ) : <div className="space-y-3">{coupons.map((coupon) => {
                  const expired = isExpired(coupon.cuponDateLimit)
                  const active = coupon.active !== false && !expired
                  return <div key={coupon.id} className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-lg font-bold tracking-wide">{coupon.cuponCode}</span><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{active ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}{active ? "Activo" : "Expirado"}</span></div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground"><span className="font-semibold text-foreground">{coupon.discount}% OFF</span><span><CalendarClock className="mr-1 inline size-3.5" /> hasta {formatDate(coupon.cuponDateLimit)}</span><span><Package className="mr-1 inline size-3.5" /> {coupon.productIds?.length || 0} productos</span><span>{coupon.quantity} productos cubiertos</span><CouponCountdown dateLimit={coupon.cuponDateLimit} /></div>
                    </div>
                    <div className="flex shrink-0 gap-2"><Button type="button" variant="outline" size="icon" title="Copiar código" onClick={() => { void navigator.clipboard?.writeText(coupon.cuponCode); toast.success("Código copiado") }}><Copy className="size-4" /></Button><Button type="button" variant="outline" size="icon" title="Eliminar cupón" onClick={() => void handleDelete(coupon)}><Trash2 className="size-4 text-destructive" /></Button></div>
                  </div>
                })}</div>}
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function TicketIcon() {
  return <Tag className="size-5 text-primary" />
}
