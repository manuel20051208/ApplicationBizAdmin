"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Package, DollarSign, Receipt, Clock, CheckCircle2,
  XCircle, Truck, CreditCard, ShoppingBag, Tag,
  CalendarDays, Hash, RotateCcw,
} from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  fetchClientHistory,
  type ClientHistoryProjection,
} from "@/lib/services/clientService"
import { getPortalCart, savePortalCart, type CartItem } from "@/lib/portal-store"
import { formatCurrency as fmtMoney } from "@/lib/format"

// ── Tipos internos ──────────────────────────────────────────────
interface SaleGroup {
  id: string
  saleIds: number[]
  occurredAt: string
  state: string
  items: ClientHistoryProjection[]
  grandTotal: number
  totalQuantity: number
}

// ── Mapa de estados ─────────────────────────────────────────────
const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  completed:   { label: "Completado",  className: "status-completed",  icon: CheckCircle2 },
  completado:  { label: "Completado",  className: "status-completed",  icon: CheckCircle2 },
  entregado:   { label: "Entregado",   className: "status-completed",  icon: CheckCircle2 },
  en_camino:   { label: "En Camino",   className: "bg-blue-500/10 text-blue-500 border-blue-500/20",     icon: Truck        },
  procesando:  { label: "Procesando",  className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: Clock      },
  cancelled:   { label: "Cancelado",   className: "bg-red-500/10 text-red-500 border-red-500/20",        icon: XCircle     },
  cancelado:   { label: "Cancelado",   className: "bg-red-500/10 text-red-500 border-red-500/20",        icon: XCircle     },
}

function getStatusCfg(state: string) {
  return statusConfig[state?.toLowerCase()] ?? statusConfig.procesando
}

// ── Helpers ─────────────────────────────────────────────────────
function parseDate(iso: string): Date {
  // "2026-06-10T19:09:29.861132" → Date local (sin shift de zona)
  const d = new Date(iso)
  return isNaN(d.getTime()) ? new Date() : d
}

function fmtDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  return parseDate(iso).toLocaleDateString("es-ES", opts ?? {
    day: "numeric", month: "short", year: "numeric",
  })
}

// Agrupa items por fecha (para agrupar las compras simultáneas)
function groupBySale(items: ClientHistoryProjection[]): SaleGroup[] {
  const map = new Map<string, SaleGroup>()
  for (const item of items) {
    // Usamos los primeros 16 chars de ISO para agrupar (hasta los minutos)
    // Ej: 2026-06-10T19:09
    const key = item.occurredAt.substring(0, 16)
    
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        saleIds: [],
        occurredAt: item.occurredAt,
        state: item.state, // Mostramos el estado del primer item
        items: [],
        grandTotal: 0,
        totalQuantity: 0,
      })
    }
    const group = map.get(key)!
    if (!group.saleIds.includes(item.saleId)) {
      group.saleIds.push(item.saleId)
    }
    group.items.push(item)
    group.grandTotal += item.totalAmount
    group.totalQuantity += item.quantity
  }
  // Ordenar por fecha descendente
  return Array.from(map.values()).sort(
    (a, b) => parseDate(b.occurredAt).getTime() - parseDate(a.occurredAt).getTime()
  )
}

// ── Componente principal ────────────────────────────────────────
export default function ComprasPage() {
  const router = useRouter()
  const [sales, setSales]           = useState<SaleGroup[]>([])
  const [selected, setSelected]     = useState<SaleGroup | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const data = await fetchClientHistory()
        const grouped = groupBySale(data)
        setSales(grouped)
        setSelected(grouped[0] ?? null)
      } catch (err: any) {
        console.error("Error al cargar historial:", err)
        setError(err?.message ?? "Error desconocido")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalSpent  = useMemo(() => sales.reduce((s, g) => s + g.grandTotal, 0), [sales])
  const totalOrders = sales.length
  const completed   = useMemo(
    () => sales.filter(g => ["completed", "completado", "entregado"].includes(g.state.toLowerCase())).length,
    [sales]
  )

  // Comprar de nuevo: agrega 1 unidad de cada producto del pedido al carrito
  const handleReorder = (sale: SaleGroup) => {
    if (!sale || sale.items.length === 0) return
    const prev = getPortalCart()
    const merged: CartItem[] = [...prev]
    for (const item of sale.items) {
      const existing = merged.find(i => i.productId === item.productId)
      if (existing) existing.quantity += 1
      else merged.push({ productId: item.productId, quantity: 1 })
    }
    savePortalCart(merged)
    const count = merged.reduce((s, i) => s + i.quantity, 0)
    window.dispatchEvent(new CustomEvent("biz-cart-updated", { detail: { count } }))
    toast.success("Productos agregados al carrito")
    router.push("/portal")
  }

  if (loading) return <LoadingSkeleton />
  if (error)   return <ErrorState message={error} />

  const empty = sales.length === 0

  return (
    <>
      {/* ── KPI cards ── */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard icon={Receipt}      iconBg="bg-primary/10"      iconColor="text-primary"
          label="Total de Pedidos"  value={String(totalOrders)} />
        <KpiCard icon={CheckCircle2} iconBg="bg-emerald-500/10" iconColor="!text-emerald-500"
          label="Completados"       value={String(completed)} />
        <KpiCard icon={DollarSign}   iconBg="bg-primary/10"      iconColor="text-primary"
          label="Total Gastado"     value={fmtMoney(totalSpent)} />
      </div>

      {empty ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:items-stretch lg:grid-cols-[1fr_400px]">
          {/* ── Tabla de pedidos ── */}
          <Card className="flex h-auto flex-col overflow-hidden border border-border bg-card lg:h-[620px]">
            <CardHeader className="shrink-0 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                <Package className="size-5 text-primary" />
                Mis Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-y-auto p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border bg-muted/30">
                      <TableHead className="pl-6 font-semibold">Pedido</TableHead>
                      <TableHead className="font-semibold">Fecha</TableHead>
                      <TableHead className="font-semibold text-center">Productos</TableHead>
                      <TableHead className="font-semibold text-right">Total</TableHead>
                      <TableHead className="font-semibold text-center pr-6">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => {
                      const cfg = getStatusCfg(sale.state)
                      const Icon = cfg.icon
                      const isSelected = selected?.id === sale.id
                      return (
                        <TableRow
                          key={sale.id}
                          onClick={() => setSelected(sale)}
                          className={`cursor-pointer transition-colors border-border ${
                            isSelected ? "bg-primary/5" : "hover:bg-muted/50"
                          }`}
                        >
                          <TableCell className="pl-6">
                            <span className="font-mono text-sm font-bold text-primary truncate max-w-[120px] inline-block" title={sale.saleIds.join(", ")}>
                              #{sale.saleIds.join(", ")}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {fmtDate(sale.occurredAt)}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex h-6 min-w-[2rem] items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-bold text-primary ring-1 ring-primary/20">
                              {sale.totalQuantity}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-sm font-bold text-foreground">
                            {fmtMoney(sale.grandTotal)}
                          </TableCell>
                          <TableCell className="pr-6 text-center">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.className}`}>
                              <Icon className="size-3" />
                              {cfg.label}
                            </span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* ── Panel de detalle ── */}
          {selected && (
            <Card className="flex h-auto flex-col border border-border bg-card lg:sticky lg:top-[88px] lg:h-[620px]">
              <CardHeader className="shrink-0 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-foreground">Detalle del Pedido</CardTitle>
                  <span className="font-mono text-sm font-bold text-primary truncate max-w-[150px]" title={selected.saleIds.join(", ")}>#{selected.saleIds.join(", ")}</span>
                </div>
              </CardHeader>
              <CardContent className="min-h-0 flex-1 space-y-5 overflow-y-auto">
                {/* Estado: timeline animado (o cancelado) */}
                {(() => {
                  const cancelled = ["cancelled", "cancelado"].includes(selected.state.toLowerCase())
                  if (cancelled) {
                    return (
                      <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-500">
                        <XCircle className="size-5 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold">Cancelado</p>
                          <p className="text-xs opacity-70">
                            {fmtDate(selected.occurredAt, {
                              weekday: "long", day: "numeric", month: "long", year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    )
                  }
                  return <OrderTimeline state={selected.state} date={selected.occurredAt} />
                })()}

                {/* Info rápida */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-2.5">
                    <Hash className="size-4 shrink-0 text-muted-foreground" />
                    <div className="overflow-hidden">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Pedido</p>
                      <p className="text-xs font-bold font-mono text-foreground truncate" title={selected.saleIds.join(", ")}>#{selected.saleIds.join(", ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-2.5">
                    <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Fecha</p>
                      <p className="text-xs font-semibold text-foreground">
                        {fmtDate(selected.occurredAt, { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Productos */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Productos <span className="text-primary">({selected.totalQuantity})</span>
                  </p>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {selected.items.map((item) => (
                      <div
                        key={item.saleItemId || item.productId}
                        className="flex items-start justify-between rounded-xl border border-border bg-muted/30 p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{item.productName}</p>
                          <div className="mt-1 flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-[10px] h-5 gap-1 px-1.5">
                              <Tag className="size-2.5" />
                              {item.productCategory}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              <span className="inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-bold text-primary ring-1 ring-primary/20">
                                {item.quantity}
                              </span>{" "}
                              × {fmtMoney(item.unitPrice)}
                            </span>
                          </div>
                        </div>
                        <p className="ml-3 text-sm font-bold text-foreground shrink-0">
                          {fmtMoney(item.totalAmount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Pago */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard className="size-4" />
                    Método de pago
                  </div>
                  <span className="font-medium text-foreground">Tarjeta vinculada</span>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/10 p-4">
                  <span className="text-sm font-semibold text-primary">Total del pedido</span>
                  <span className="text-xl font-bold text-foreground">{fmtMoney(selected.grandTotal)}</span>
                </div>

                {/* Comprar de nuevo */}
                {["completed", "completado", "entregado"].includes(selected.state.toLowerCase()) && (
                  <Button
                    className="w-full gap-2"
                    onClick={() => handleReorder(selected)}
                  >
                    <RotateCcw className="size-4" />
                    Comprar de nuevo
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </>
  )
}

// ── Subcomponentes ──────────────────────────────────────────────

// Timeline animado del estado del pedido
function OrderTimeline({ state, date }: { state: string; date: string }) {
  const raw = state.toLowerCase()
  const steps = [
    { label: "Procesando", icon: Clock },
    { label: "En Camino", icon: Truck },
    { label: "Entregado", icon: CheckCircle2 },
  ]
  const current =
    raw === "en_camino" ? 1
      : ["completed", "completado", "entregado"].includes(raw) ? 2
        : 0

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <div className="mb-3 flex items-center">
        {steps.map((step, i) => {
          const Icon = step.icon
          const active = i <= current
          const done = i < current
          return (
            <div key={step.label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex size-8 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted text-muted-foreground"
                  } ${done ? "animate-pop" : ""}`}
                >
                  <Icon className="size-4" />
                </div>
                <span
                  className={`whitespace-nowrap text-[9px] font-medium ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="relative mx-1 mb-4 h-0.5 flex-1 overflow-hidden rounded-full bg-border">
                  <div
                    className={`absolute inset-y-0 left-0 bg-primary transition-all duration-700 ${
                      i < current ? "w-full" : i === current ? "w-1/2" : "w-0"
                    }`}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
      <p className="text-center text-[10px] text-muted-foreground">
        Actualizado:{" "}
        {fmtDate(date, {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
        })}
      </p>
    </div>
  )
}

function KpiCard({
  icon: Icon, iconBg, iconColor, label, value,
}: {
  icon: React.ElementType; iconBg: string; iconColor: string
  label: string; value: string
}) {
  return (
    <Card className="border border-border bg-card">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`size-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card className="border border-border bg-card">
      <CardContent className="flex flex-col items-center py-20 text-center">
        <div className="mb-4 flex size-20 items-center justify-center rounded-2xl bg-muted">
          <ShoppingBag className="size-10 text-muted-foreground/40" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Aún no tienes pedidos</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Explora la tienda, agrega productos al carrito y completa tu primera compra.
        </p>
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1,2,3].map(i => (
          <Card key={i} className="border border-border bg-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="size-11 rounded-xl bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                  <div className="h-6 w-16 rounded bg-muted animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border border-border bg-card">
        <CardContent className="p-6 space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <Card className="border border-destructive/30 bg-card">
      <CardContent className="flex flex-col items-center py-16 text-center">
        <XCircle className="mb-3 size-12 text-destructive/60" />
        <h3 className="text-base font-semibold text-foreground">Error al cargar pedidos</h3>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )
}
