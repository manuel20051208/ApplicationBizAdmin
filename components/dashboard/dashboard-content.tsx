"use client"

import { useEffect, useState, useCallback } from "react"
import { DollarSign, Package, Users } from "lucide-react"
import { toast } from "sonner"
import { StatCard } from "./stat-card"
import { RecentSalesTable } from "./recent-sales-table"
import { RevenueChart } from "./revenue-chart"
import {
  fetchDashboardData,
  type RevenueDataPoint,
} from "@/lib/services/adminService"
import { type SaleItemView } from "@/lib/services/saleService"

export function DashboardContent() {
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null)
  const [totalStock, setTotalStock] = useState<number | null>(null)
  const [totalClients, setTotalClients] = useState<number | null>(null)
  const [graphicData, setGraphicData] = useState<RevenueDataPoint[]>([])
  const [latestSales, setLatestSales] = useState<SaleItemView[]>([])
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

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value)

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido de nuevo. Aquí está el resumen de tu negocio.
        </p>
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
        <RevenueChart data={graphicData} loading={loading} />
        <RecentSalesTable sales={latestSales} loading={loading} />
      </div>
    </div>
  )
}
