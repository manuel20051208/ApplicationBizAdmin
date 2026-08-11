"use client"

import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { fetchClientsSummary } from "@/lib/services/clientService"
import { getStoredUser } from "@/lib/auth/session"
import { formatCurrency, formatRelativeDate } from "@/lib/format"
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

import { useDebounce } from "@/hooks/use-debounce"
import { cachedFetch, CACHE_KEYS, CACHE_TTL } from "@/lib/api/apiCache"

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
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
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

        const data = await cachedFetch(
          CACHE_KEYS.CLIENTES(adminId),
          () => fetchClientsSummary(adminId),
          CACHE_TTL.CLIENTES
        )

        let clientArray = []
        if (Array.isArray(data)) {
          clientArray = data
        } else if (data && typeof data === 'object') {
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

  const filteredCustomers = useMemo(() => customers.filter(customer => {
    const query = debouncedSearchTerm.toLowerCase()
    return customer.name.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query)
  }), [customers, debouncedSearchTerm])

  const totalCustomers = customers.length
  const totalRevenue = useMemo(() => customers.reduce((sum, c) => sum + c.totalSpent, 0), [customers])
  const avgPurchases = useMemo(() => customers.length > 0
    ? Math.round(customers.reduce((sum, c) => sum + c.totalPurchases, 0) / customers.length)
    : 0, [customers])



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
                    {isLoading && customers.length === 0 ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i} className="border-border">
                          <TableCell>
                            <div className="space-y-1">
                              <div className="h-4 w-32 animate-pulse rounded-md bg-muted/50" />
                              <div className="h-4 w-16 animate-pulse rounded-full bg-muted/40" />
                            </div>
                          </TableCell>
                          <TableCell><div className="h-4 w-40 animate-pulse rounded-md bg-muted/40" /></TableCell>
                          <TableCell><div className="mx-auto h-5 w-12 animate-pulse rounded-full bg-muted/50" /></TableCell>
                          <TableCell><div className="ml-auto h-4 w-20 animate-pulse rounded-md bg-muted/50" /></TableCell>
                          <TableCell><div className="h-4 w-24 animate-pulse rounded-md bg-muted/40" /></TableCell>
                        </TableRow>
                      ))
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
                            {formatRelativeDate(customer.lastPurchase)}
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
