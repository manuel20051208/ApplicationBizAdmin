"use client"

import { useEffect, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { Download, DollarSign, Package, Users } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "./stat-card"
import { RecentSalesTable } from "./recent-sales-table"
import { formatCurrency } from "@/lib/format"
import {
  fetchDashboardData,
  fetchDashboardExcel,
  type RevenueDataPoint,
} from "@/lib/services/adminService"
import { type SaleItemView } from "@/lib/services/saleService"

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
  const [loading, setLoading] = useState(true)


  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)

      const dashboardData = await fetchDashboardData();

      setTotalRevenue(dashboardData?.totalSales ?? 0);
      setTotalStock(dashboardData?.totalProducts ?? 0);
      setTotalClients(dashboardData?.totalClients ?? 0);

      // Process graphic data with 0 values for missing months
      const SPANISH_MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      
      const currentMonthIndex = new Date().getMonth(); // 0-indexed
      const graphicPoints: RevenueDataPoint[] = [];

      const monthlyData = Array.isArray(dashboardData?.monthlyData) ? dashboardData.monthlyData : [];

      for (let i = 0; i <= currentMonthIndex; i++) {
        const monthNameFull = SPANISH_MONTHS[i];
        const monthLabel = MONTH_LABELS[i];
        
        const found = monthlyData.find((m) => {
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

      // Process latest sales list
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
          id: item.id, // Using 'id' from the item directly as requested
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

    } catch (err) {
      console.error("Error al cargar dashboard:", err)
      import("@/lib/api-errors").then(({ triggerOfflineNotification }) => {
        triggerOfflineNotification(() => loadDashboard())
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const handleExportExcel = useCallback(async () => {
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
    } catch (err) {
      console.error("Error al exportar Excel:", err)
      toast.error("No se pudo descargar el reporte Excel")
    } finally {
      setExporting(false)
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
        <Button
          onClick={handleExportExcel}
          disabled={exporting}
          variant="outline"
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {exporting ? "Exportando..." : "Exportar Excel"}
        </Button>
      </div>



      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Ingresos Totales"
          value={loading ? "Cargando..." : totalRevenue !== null ? formatCurrency(totalRevenue) : "$0.00"}
          change={loading ? "" : "Suma total de ventas"}
          changeType="positive"
          icon={DollarSign}
        />
        <StatCard
          title="Productos en Stock"
          value={loading ? "Cargando..." : totalStock !== null ? totalStock.toLocaleString() : "0"}
          change={loading ? "" : "Productos activos"}
          changeType="neutral"
          icon={Package}
        />
        <StatCard
          title="Clientes Registrados"
          value={loading ? "Cargando..." : totalClients !== null ? totalClients.toLocaleString() : "0"}
          change={loading ? "" : "Total de clientes"}
          changeType="positive"
          icon={Users}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {loading ? <RevenueChartSkeleton /> : <RevenueChart data={graphicData} loading={false} />}
        <RecentSalesTable sales={latestSales} loading={loading} totalElements={latestSalesTotal} />
      </div>
    </div>
  )
}
