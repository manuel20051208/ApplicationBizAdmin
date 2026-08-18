"use client"

import { useEffect, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import { Download, DollarSign, FileText, Package, Trophy, Users } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "./stat-card"
import { RecentSalesTable } from "./recent-sales-table"
import { formatCurrency } from "@/lib/format"
import {
  fetchDashboardData,
  fetchDashboardExcel,
  fetchDashboardPdf,
  type RevenueDataPoint,
} from "@/lib/services/adminService"
import { type SaleItemView } from "@/lib/services/saleService"
import { cachedFetch, CACHE_KEYS, CACHE_TTL } from "@/lib/api/apiCache"

const RevenueChart = dynamic(
  () => import("./revenue-chart").then((m) => m.RevenueChart),
  {
    ssr: false,
    loading: () => <RevenueChartSkeleton />,
  }
)

function RevenueChartSkeleton() {
  return (
    <Card className="h-full min-h-[160px] border-white/20 bg-card/60 py-4 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Resumen de Ingresos
        </CardTitle>
        <CardDescription>
          Ingresos mensuales por mes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full animate-pulse rounded-md bg-muted/50" />
      </CardContent>
    </Card>
  )
}

interface TopSeller {
  id: string
  name: string
  sales: number
  amount: number
}

function TopSellersCard({ sellers, loading }: { sellers: TopSeller[]; loading: boolean }) {
  return (
    <Card className="border-white/20 bg-card/60 backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Trophy className="size-5 text-amber-400" />
          3 mejores vendedores
        </CardTitle>
        <CardDescription>Ranking de rendimiento comercial</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((rank) => (
              <div key={rank} className="flex items-center gap-3">
                <div className="size-8 animate-pulse rounded-full bg-muted/60" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-28 animate-pulse rounded bg-muted/60" />
                  <div className="h-2 w-20 animate-pulse rounded bg-muted/40" />
                </div>
                <div className="h-3 w-12 animate-pulse rounded bg-muted/50" />
              </div>
            ))}
          </div>
        ) : sellers.length === 0 ? (
          <div className="flex min-h-32 flex-col items-center justify-center text-center">
            <Trophy className="mb-2 size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">Sin datos de ranking</p>
            <p className="mt-1 max-w-52 text-xs text-muted-foreground">
              El ranking aparecerá cuando el backend entregue los mejores vendedores.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sellers.slice(0, 3).map((seller, index) => (
              <div key={seller.id} className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{seller.name}</p>
                  <p className="text-xs text-muted-foreground">{seller.sales} ventas</p>
                </div>
                <span className="text-xs font-semibold text-primary">{formatCurrency(seller.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function DashboardContent() {
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null)
  const [totalStock, setTotalStock] = useState<number | null>(null)
  const [totalClients, setTotalClients] = useState<number | null>(null)
  const [graphicData, setGraphicData] = useState<RevenueDataPoint[]>([])
  const [latestSales, setLatestSales] = useState<SaleItemView[]>([])
  const [latestSalesTotal, setLatestSalesTotal] = useState(0)
  const [topSellers, setTopSellers] = useState<TopSeller[]>([])
  const [exporting, setExporting] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [loading, setLoading] = useState(true)

  const processDashboardData = useCallback((dashboardData: any) => {
    setTotalRevenue(dashboardData?.totalSales ?? 0);
    setTotalStock(dashboardData?.totalProducts ?? 0);
    setTotalClients(dashboardData?.totalClients ?? 0);

    const SPANISH_MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    
    const currentMonthIndex = new Date().getMonth();
    const graphicPoints: RevenueDataPoint[] = [];
    const monthlyData = Array.isArray(dashboardData?.monthlyData) ? dashboardData.monthlyData : [];

    for (let i = 0; i <= currentMonthIndex; i++) {
      const monthNameFull = SPANISH_MONTHS[i];
      const monthLabel = MONTH_LABELS[i];
      
      const found = monthlyData.find((m: any) => {
        const monthName = typeof m?.monthName === "string" ? m.monthName : "";
        return monthName.toLowerCase() === monthNameFull.toLowerCase() ||
          monthName.toLowerCase().startsWith(monthLabel.toLowerCase());
      });

      graphicPoints.push({
        month: monthLabel,
        ingresos: found?.monthlyTotal ?? 0
      });
    }
    setGraphicData(graphicPoints);

    const salesArr = dashboardData?.showLatestSales?.content || [];
    const mappedSales = salesArr.map((item: any) => {
      let dateStr = "—";
      if (item.latestSale) {
        const d = new Date(item.latestSale);
        if (!isNaN(d.getTime())) {
          dateStr = d.toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" });
        }
      }

      return {
        id: item.id,
        full_name: item.fullName || "Cliente Desconocido",
        quantity: item.totalQuantity || 0,
        totalPrice: item.totalSpent || 0,
        status: "completado",
        date: dateStr,
        productName: `${item.totalQuantity || 1} producto(s)`
      };
    });
    setLatestSales(mappedSales);
    setLatestSalesTotal(dashboardData?.showLatestSales?.totalElements ?? 0);

    const ranking = dashboardData?.topSellers ?? dashboardData?.bestSellers ?? dashboardData?.topSellingUsers ?? [];
    setTopSellers(Array.isArray(ranking) ? ranking.map((seller: any, index: number) => ({
      id: String(seller.id ?? seller.userId ?? seller.sellerId ?? index),
      name: seller.name || seller.fullName || seller.sellerName || "Vendedor sin nombre",
      sales: Number(seller.sales ?? seller.totalSales ?? seller.salesCount ?? seller.count ?? 0),
      amount: Number(seller.amount ?? seller.totalAmount ?? seller.totalSpent ?? 0),
    })) : []);
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)

      const dashboardData = await cachedFetch(
        CACHE_KEYS.DASHBOARD,
        () => fetchDashboardData(),
        CACHE_TTL.DASHBOARD
      );

      processDashboardData(dashboardData);

    } catch (err) {
      console.error("Error al cargar dashboard:", err)
      import("@/lib/api-errors").then(({ triggerOfflineNotification }) => {
        triggerOfflineNotification(() => loadDashboard())
      })
    } finally {
      setLoading(false)
    }
  }, [processDashboardData])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const handleExportExcel = useCallback(async () => {
    const toastId = toast.loading("Generando reporte Excel...")
    try {
      setExporting(true)
      const blob = await fetchDashboardExcel()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `reporte-dashboard-${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success("Reporte Excel descargado correctamente", { id: toastId })
    } catch (err) {
      console.error("Error al exportar Excel:", err)
      toast.error("No se pudo descargar el reporte Excel", { id: toastId })
    } finally {
      setExporting(false)
    }
  }, [])

  const handleExportPdf = useCallback(async () => {
    const toastId = toast.loading("Generando reporte PDF...")
    try {
      setExportingPdf(true)
      const blob = await fetchDashboardPdf()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `reporte-dashboard-${new Date().toISOString().slice(0, 10)}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success("Reporte PDF descargado correctamente", { id: toastId })
    } catch (err) {
      console.error("Error al exportar PDF:", err)
      toast.error("No se pudo descargar el reporte PDF", { id: toastId })
    } finally {
      setExportingPdf(false)
    }
  }, [])

  return (
    <div className="relative isolate flex flex-1 flex-col gap-5 overflow-hidden p-3 pb-24 sm:gap-6 sm:p-6 sm:pb-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[560px] overflow-hidden">
        <Image
          src="/dashboard-bg.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-background/75 to-background" />
      </div>

      <div className="relative z-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido de nuevo. Aquí está el resumen de tu negocio.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            variant="outline"
            className="h-9 flex-1 gap-2 border-white/20 bg-card/60 px-3 text-xs backdrop-blur-md transition-all hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 hover:shadow-[0_0_18px_rgba(239,68,68,0.18)] sm:flex-none"
          >
            <FileText className="h-4 w-4 text-red-500" />
            {exportingPdf ? "Exportando..." : "Exportar PDF"}
          </Button>
          <Button
            onClick={handleExportExcel}
            disabled={exporting}
            variant="outline"
            className="h-9 flex-1 gap-2 border-white/20 bg-card/60 px-3 text-xs backdrop-blur-md transition-all hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400 hover:shadow-[0_0_18px_rgba(16,185,129,0.18)] sm:flex-none"
          >
            <Download className="h-4 w-4 text-emerald-500" />
            {exporting ? "Exportando..." : "Exportar Excel"}
          </Button>
        </div>
      </div>

      <div className="relative z-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Ingresos Totales"
          value={totalRevenue !== null ? formatCurrency(totalRevenue) : "$0.00"}
          change="Suma total de ventas"
          changeType="positive"
          icon={DollarSign}
          loading={loading && totalRevenue === null}
        />
        <StatCard
          title="Productos en Stock"
          value={totalStock !== null ? totalStock.toLocaleString() : "0"}
          change="Productos activos"
          changeType="neutral"
          icon={Package}
          loading={loading && totalStock === null}
        />
        <StatCard
          title="Clientes Registrados"
          value={totalClients !== null ? totalClients.toLocaleString() : "0"}
          change="Total de clientes"
          changeType="positive"
          icon={Users}
          loading={loading && totalClients === null}
        />
        <TopSellersCard sellers={topSellers} loading={loading} />
      </div>

      <div className="relative z-10 grid w-full min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        {loading && graphicData.length === 0 ? (
          <RevenueChartSkeleton />
        ) : (
          <RevenueChart data={graphicData} loading={false} />
        )}
        <div className="min-w-0">
          <RecentSalesTable sales={latestSales} loading={loading && latestSales.length === 0} totalElements={latestSalesTotal} />
        </div>
      </div>
    </div>
  )
}

