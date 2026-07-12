"use client"

import { useState, useEffect, useCallback } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { toast } from "sonner"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { getStoredUser } from "@/lib/auth/session"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ShoppingCart, Search, TrendingUp, DollarSign, Package, Loader2, RefreshCw } from "lucide-react"
import { fetchSalesItems, type SaleItemView } from "@/lib/services/saleService"

export default function VentasPage() {
  const [sales, setSales] = useState<SaleItemView[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  // Limite de registros a traer (usado para el Endpoint con paginación)
  const [sizeLimit, setSizeLimit] = useState(50)

  const loadSales = useCallback(async () => {
    try {
      setLoading(true)
      const user = getStoredUser()
      const adminId = user?.id

      if (!adminId) {
        throw new Error("No hay usuario logueado")
      }

      const data = await fetchSalesItems(adminId, sizeLimit)
      console.log("Datos recibidos de la API (Ventas):", data)

      setSales(data)
    } catch (err) {
      toast.error("No se pudo conectar con el servidor. ¿Está corriendo Spring Boot en el puerto 8080?", {
        action: {
          label: "Reintentar",
          onClick: () => loadSales()
        }
      })
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [sizeLimit])

  useEffect(() => {
    loadSales()
  }, [loadSales])

  const filteredSales = sales.filter(sale => {
    const cliente = sale.client_name || sale.full_name || sale.clientName || ""
    const producto = sale.product_name || sale.name || sale.productName || ""
    return cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(sale.id).includes(searchTerm)
  })

  const totalRevenue = sales.reduce((sum, s) => sum + (s.total_calculated ?? s.totalCalculated ?? s.totalPrice ?? 0), 0)
  const totalItems = sales.reduce((sum, s) => sum + (s.quantity || 0), 0)
  const uniqueClients = new Set(sales.map(s => (s.client_name || s.full_name || s.clientName || "").toLowerCase())).size

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount)
  }

  const formatDate = (dateValue: any) => {
    if (!dateValue) return "—"
    try {
      let dateObj: Date

      // Spring Boot a veces manda los LocalDate como arreglos [yyyy, m, d]
      if (Array.isArray(dateValue)) {
        const [year, month, day] = dateValue
        dateObj = new Date(year, month - 1, day || 1)
      } else {
        const dateStr = String(dateValue)
        // If it's a date-only string (e.g. "2026-06-12") parse it as local time
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          const [year, month, day] = dateStr.split("-")
          dateObj = new Date(Number(year), Number(month) - 1, Number(day))
        } else {
          dateObj = new Date(dateValue)
        }
      }

      // Si la fecha es inválida, devolvemos el texto puro
      if (isNaN(dateObj.getTime())) return String(dateValue)

      const dd = String(dateObj.getDate()).padStart(2, '0')
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0')
      const yyyy = dateObj.getFullYear()

      return `${yyyy}-${mm}-${dd}`
    } catch {
      return String(dateValue)
    }
  }

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return <Badge variant="outline">Desconocido</Badge>
    const normalizedStatus = status.toLowerCase()
    const styles: Record<string, string> = {
      completada: "bg-primary/20 text-primary border-primary/30",
      pendiente: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
      cancelada: "bg-destructive/20 text-destructive border-destructive/30",
    }
    const style = styles[normalizedStatus] || "bg-secondary text-secondary-foreground"
    return (
      <Badge variant="outline" className={`${style} capitalize`}>
        {status}
      </Badge>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-card px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Ventas</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex-1 p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Ventas</h1>
              <p className="text-muted-foreground">Registro de todas las ventas realizadas</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={String(sizeLimit)} onValueChange={(val) => setSizeLimit(Number(val))}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Mostrar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Mostrar 10</SelectItem>
                  <SelectItem value="20">Mostrar 20</SelectItem>
                  <SelectItem value="50">Mostrar 50</SelectItem>
                  <SelectItem value="100">Mostrar 100</SelectItem>
                  <SelectItem value="200">Mostrar 200</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="gap-2"
                onClick={loadSales}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
            </div>
          </div>



          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Ingresos</p>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? "—" : formatCurrency(totalRevenue)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Items Vendidos</p>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? "—" : totalItems}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/20">
                  <Package className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Clientes Únicos</p>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? "—" : uniqueClients}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Historial de Ventas ({filteredSales.length})
                </CardTitle>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por cliente o producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-3" />
                    <p className="text-sm">Cargando ventas...</p>
                  </div>
                ) : filteredSales.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <ShoppingCart className="h-10 w-10 mb-3 opacity-50" />
                    <p className="text-sm">
                      {searchTerm
                        ? "No se encontraron ventas con ese criterio"
                        : "No hay ventas registradas aún"}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="w-[100px] text-muted-foreground">ID</TableHead>
                        <TableHead className="min-w-[180px] text-muted-foreground">Cliente</TableHead>
                        <TableHead className="min-w-[180px] text-muted-foreground">Producto</TableHead>
                        <TableHead className="w-[100px] text-center text-muted-foreground">Cantidad</TableHead>
                        <TableHead className="w-[120px] text-right text-muted-foreground">Total</TableHead>
                        <TableHead className="w-[130px] text-center text-muted-foreground">Estado</TableHead>
                        <TableHead className="w-[120px] text-right text-muted-foreground">Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSales.map((sale, idx) => {
                        const cliente = sale.client_name || sale.full_name || sale.clientName || "—"
                        const producto = sale.product_name || sale.name || sale.productName || "—"
                        const total = sale.total_calculated ?? sale.totalCalculated ?? sale.totalPrice ?? 0
                        const estado = sale.state || sale.status
                        const fecha = sale.date || sale.saleDate || ""

                        return (
                          <TableRow key={sale.id ?? idx} className="border-border">
                            <TableCell>
                              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold font-mono text-primary">
                                {String(sale.id).startsWith("ORD") ? sale.id : `VEN-${String(sale.id).padStart(3, '0')}`}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium">{cliente}</TableCell>
                            <TableCell className="text-muted-foreground">{producto}</TableCell>
                            <TableCell className="text-center">{sale.quantity}</TableCell>
                            <TableCell className="text-right font-semibold text-primary">
                              {formatCurrency(total)}
                            </TableCell>
                            <TableCell className="text-center">
                              {getStatusBadge(estado)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground whitespace-nowrap">
                              {formatDate(fecha)}
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
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
