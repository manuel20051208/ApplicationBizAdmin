"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { fetchClientsSummary } from "@/lib/services/clientService"
import { getStoredUser } from "@/lib/auth/session"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Users, Search, Mail, ShoppingBag } from "lucide-react"

interface Customer {
  id: string
  name: string
  email: string
  totalPurchases: number
  totalSpent: number
  lastPurchase: string
}

export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadCustomers() {
      try {
        setIsLoading(true)
        const user = getStoredUser()
        const adminId = user?.id

        if (!adminId) {
          throw new Error("No hay usuario logueado")
        }

        const data = await fetchClientsSummary(adminId)
        console.log("Datos recibidos de la API (Clientes):", data)

        let clientArray = []
        if (Array.isArray(data)) {
          clientArray = data
        } else if (data && typeof data === 'object') {
          // Soporte por si el backend devuelve un Page<T> u objeto envuelto
          const objData = data as any
          clientArray = objData.content || objData.data || objData.clients || []
        }

        const mappedData: Customer[] = clientArray.map((c: any) => ({
          id: String(c.clientId || c.id || "N/A"),
          name: c.fullName || c.clientName || c.name || "Sin nombre",
          email: c.email || "Sin correo",
          totalPurchases: Number(c.totalQuantity || c.totalPurchases || 0),
          totalSpent: Number(c.totalSpent || 0),
          lastPurchase: c.latestSale || null,
        }))
        setCustomers(mappedData)
      } catch (err) {
        console.error("Error al cargar clientes:", err)
        import("@/lib/api-errors").then(({ triggerOfflineNotification }) => {
          triggerOfflineNotification(() => loadCustomers())
        })
      } finally {
        setIsLoading(false)
      }
    }
    loadCustomers()
  }, [])

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalCustomers = customers.length
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)
  const avgPurchases = customers.length > 0
    ? Math.round(customers.reduce((sum, c) => sum + c.totalPurchases, 0) / customers.length)
    : 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount)
  }

  const formatDate = (dateValue: any) => {
    if (!dateValue || dateValue === "—") return "—"
    try {
      let dateObj: Date
      if (Array.isArray(dateValue)) {
        const [year, month, day, hour = 0, minute = 0, second = 0] = dateValue
        dateObj = new Date(year, month - 1, day || 1, hour, minute, second)
      } else {
        const dateStr = String(dateValue)
        // Parse date-only string (e.g. "2026-06-12") as local time
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          const [year, month, day] = dateStr.split("-")
          dateObj = new Date(Number(year), Number(month) - 1, Number(day))
        } else {
          dateObj = new Date(dateValue)
        }
      }
      if (isNaN(dateObj.getTime())) return String(dateValue)

      const now = new Date()
      // Diferencia en milisegundos
      const diffMs = now.getTime() - dateObj.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

      // Si fue en menos de 24 horas y no es fecha del futuro
      if (diffHours >= 0 && diffHours < 24) {
        if (diffHours === 0) {
          const diffMins = Math.floor(diffMs / (1000 * 60))
          if (diffMins <= 1) return "Hace un momento"
          return `Hace ${diffMins} minutos`
        }
        return diffHours === 1 ? "Hace 1 hora" : `Hace ${diffHours} horas`
      }

      const dd = String(dateObj.getDate()).padStart(2, '0')
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0')
      const yyyy = dateObj.getFullYear()
      return `${yyyy}-${mm}-${dd}`
    } catch {
      return String(dateValue)
    }
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
                <BreadcrumbPage>Clientes</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground">Gestiona la información de tus clientes</p>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Clientes</p>
                  <p className="text-2xl font-bold text-foreground">{totalCustomers}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Promedio Compras</p>
                  <p className="text-2xl font-bold text-foreground">{avgPurchases} / cliente</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Lista de Clientes
                </CardTitle>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar clientes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Cliente</TableHead>
                      <TableHead className="text-muted-foreground">Gmail</TableHead>
                      <TableHead className="text-center text-muted-foreground">Total Ventas</TableHead>
                      <TableHead className="text-right text-muted-foreground">Total Gastado</TableHead>
                      <TableHead className="text-muted-foreground">Última Compra</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                          Cargando clientes...
                        </TableCell>
                      </TableRow>

                    ) : filteredCustomers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                          No se encontraron clientes.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <TableRow key={customer.id} className="border-border">
                          <TableCell>
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold font-mono text-primary">
                                CLI-{String(customer.id).padStart(3, '0')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {customer.email}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex min-w-[3rem] justify-center rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">
                              {customer.totalPurchases}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-primary">
                            {formatCurrency(customer.totalSpent)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(customer.lastPurchase)}
                          </TableCell>
                        </TableRow>
                      )))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
