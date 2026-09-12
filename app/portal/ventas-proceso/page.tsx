"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  Clock3,
  Package,
  Route,
  Truck,
  XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchClientHistory, type ClientHistoryProjection } from "@/lib/services/clientService"
import { formatCurrency } from "@/lib/format"

type ProcessedSale = {
  saleId: number
  state: string
  occurredAt: string
  items: ClientHistoryProjection[]
  total: number
}

const completedStates = new Set(["completed", "completado", "entregado", "cancelled", "cancelado"])

function normalizeState(state?: string) {
  return (state ?? "procesando")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_")
}

function stateConfig(state: string) {
  switch (normalizeState(state)) {
    case "en_camino":
    case "enviado":
    case "en_entrega":
      return { label: "En camino", icon: Truck, className: "text-primary bg-primary/10 border-primary/20" }
    case "cancelled":
    case "cancelado":
      return { label: "Cancelado", icon: XCircle, className: "text-destructive bg-destructive/10 border-destructive/20" }
    case "completado":
    case "completed":
    case "entregado":
      return { label: "Completado", icon: CheckCircle2, className: "status-completed" }
    default:
      return { label: "Procesando", icon: Clock3, className: "text-amber-500 bg-amber-500/10 border-amber-500/20" }
  }
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "Fecha pendiente"
    : date.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })
}

export default function VentasEnProcesoPage() {
  const [sales, setSales] = useState<ProcessedSale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    fetchClientHistory()
      .then((items) => {
        if (!active) return

        const grouped = new Map<number, ProcessedSale>()
        items
          .filter((item) => !completedStates.has(normalizeState(item.state)))
          .forEach((item) => {
            const current = grouped.get(item.saleId)
            if (current) {
              current.items.push(item)
              current.total += item.totalAmount
            } else {
              grouped.set(item.saleId, {
                saleId: item.saleId,
                state: item.state,
                occurredAt: item.occurredAt,
                items: [item],
                total: item.totalAmount,
              })
            }
          })

        setSales(Array.from(grouped.values()).sort(
          (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
        ))
      })
      .catch((err: any) => setError(err?.message ?? "No se pudieron cargar las ventas en proceso"))
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const activeCount = useMemo(() => sales.length, [sales])

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-sm font-medium text-primary">SEGUIMIENTO</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Ventas en proceso</h1>
        <p className="mt-1 text-muted-foreground">
          Consulta el estado de tus pedidos sin mezclarlo con el historial completado.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card className="border border-border bg-card">
          <CardHeader className="flex-row items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Truck className="size-5 text-primary" />
              Pedidos activos
            </CardTitle>
            <Badge variant="secondary" className="rounded-full px-3">
              {activeCount} activos
            </Badge>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl bg-muted" />)}
              </div>
            ) : error ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
                {error}
              </div>
            ) : sales.length === 0 ? (
              <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center">
                <Package className="mb-3 size-10 text-muted-foreground" />
                <p className="font-semibold text-foreground">No tienes ventas en proceso</p>
                <p className="mt-1 text-sm text-muted-foreground">Tus pedidos completados siguen disponibles en Mis Compras.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sales.map((sale) => {
                  const config = stateConfig(sale.state)
                  const StatusIcon = config.icon
                  return (
                    <div key={sale.saleId} className="rounded-xl border border-border bg-muted/20 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-sm font-bold text-primary">VEN-{String(sale.saleId).padStart(3, "0")}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{formatDate(sale.occurredAt)} · {sale.items.length} producto(s)</p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.className}`}>
                          <StatusIcon className="size-3.5" />
                          {config.label}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
                        <p className="truncate text-sm text-muted-foreground">
                          {sale.items.map((item) => `${item.productName} × ${item.quantity}`).join(", ")}
                        </p>
                        <p className="shrink-0 text-sm font-bold text-foreground">{formatCurrency(sale.total)}</p>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                        <Route className="size-4 text-primary" />
                        La ruta estará disponible cuando el vendedor comparta su ubicación.
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
