"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { SaleItemView } from "@/lib/services/saleService"
import { formatCurrency } from "@/lib/format"

interface RecentSalesTableProps {
  sales: SaleItemView[]
  loading?: boolean
  totalElements?: number
}

function getStatusVariant(status: string): "default" | "secondary" | "outline" {
  const s = status?.toLowerCase() || ""
  switch (s) {
    case "completado":
    case "completed":
      return "default"
    case "pendiente":
    case "pending":
      return "secondary"
    case "procesando":
    case "processing":
      return "outline"
    default:
      return "secondary"
  }
}

function getStatusClass(status: string): string {
  const s = status?.toLowerCase() || ""
  if (s === "completado" || s === "completed") return "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
  if (s === "pendiente" || s === "pending") return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
  if (s === "procesando" || s === "processing") return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
  return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
}

export function RecentSalesTable({ sales, loading, totalElements }: RecentSalesTableProps) {
  return (
    <Card className="border-white/20 bg-card/60 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Ventas Recientes
        </CardTitle>
        <CardDescription>
          {typeof totalElements === "number" && totalElements > 0
            ? `Mostrando ${Array.isArray(sales) ? sales.length : 0} de ${totalElements} transacciones`
            : "Últimas transacciones de tu negocio"}
        </CardDescription>
      </CardHeader>
      <CardContent className="min-w-0 px-3 sm:px-6">
        <div className="min-w-0 overflow-x-auto">
        {loading ? (
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground">ID</TableHead>
                <TableHead className="text-muted-foreground">Cliente</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Producto</TableHead>
                <TableHead className="text-muted-foreground">Monto</TableHead>
                <TableHead className="text-muted-foreground">Estado</TableHead>
                <TableHead className="text-muted-foreground text-right hidden sm:table-cell">Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border/50">
                  <TableCell><div className="h-6 w-16 animate-pulse rounded-full bg-muted/50" /></TableCell>
                  <TableCell><div className="h-4 w-28 animate-pulse rounded-md bg-muted/50" /></TableCell>
                  <TableCell className="hidden md:table-cell"><div className="h-4 w-24 animate-pulse rounded-md bg-muted/40" /></TableCell>
                  <TableCell><div className="h-4 w-16 animate-pulse rounded-md bg-muted/50" /></TableCell>
                  <TableCell><div className="h-5 w-20 animate-pulse rounded-full bg-muted/40" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><div className="ml-auto h-4 w-20 animate-pulse rounded-md bg-muted/40" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : !Array.isArray(sales) || sales.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            No hay ventas recientes
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground">ID</TableHead>
                <TableHead className="text-muted-foreground">Cliente</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Producto</TableHead>
                <TableHead className="text-muted-foreground">Monto</TableHead>
                <TableHead className="text-muted-foreground">Estado</TableHead>
                <TableHead className="text-muted-foreground text-right hidden sm:table-cell">Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => {
                const clientName = sale.full_name || sale.clientName || "—"
                const productName = sale.name || sale.productName || "—"
                const amount = sale.totalCalculated ?? sale.total_calculated ?? sale.totalPrice ?? 0
                const status = sale.state || sale.status || "pendiente"
                const date = sale.date || sale.saleDate || ""

                return (
                  <TableRow key={sale.id} className="border-border/50">
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold font-mono text-primary">
                        VEN-{String(sale.id).padStart(3, "0")}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {clientName}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">
                      {productName}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {formatCurrency(amount)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={getStatusVariant(status)}
                        className={getStatusClass(status)}
                      >
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground hidden sm:table-cell">
                      {date}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
        </div>
      </CardContent>
    </Card>
  )
}
