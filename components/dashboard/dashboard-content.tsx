"use client"

import { useEffect, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { Download, DollarSign, FileText, Package, Users } from "lucide-react"
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
    <Card className="border-border/50 bg-card">
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

export function DashboardContent() {
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null)
  const [totalStock, setTotalStock] = useState<number | null>(null)
  const [totalClients, setTotalClients] = useState<number | null>(null)
  const [graphicData, setGraphicData] = useState<RevenueDataPoint[]>([])
  const [latestSales, setLatestSales] = useState<SaleItemView[]>([])
  const [latestSalesTotal, setLatestSalesTotal] = useState(0)
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
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido de nuevo. Aquí está el resumen de tu negocio.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            variant="outline"
            className="gap-2 transition-all hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500"
          >
            <FileText className="h-4 w-4 text-red-500" />
            {exportingPdf ? "Exportando..." : "Exportar PDF"}
          </Button>
          <Button
            onClick={handleExportExcel}
            disabled={exporting}
            variant="outline"
            className="gap-2 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/10"
          >
            <Download className="h-4 w-4 text-emerald-500" />
            {exporting ? "Exportando..." : "Exportar Excel"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {loading && graphicData.length === 0 ? (
          <RevenueChartSkeleton />
        ) : (
          <RevenueChart data={graphicData} loading={false} />
        )}
        <RecentSalesTable sales={latestSales} loading={loading && latestSales.length === 0} totalElements={latestSalesTotal} />
      </div>
    </div>
  )
}

