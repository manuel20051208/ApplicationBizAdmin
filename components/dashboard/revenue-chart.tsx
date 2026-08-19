"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { RevenueDataPoint } from "@/lib/services/adminService"
import {
  MonoRoundedBarChart,
  MonoRoundedComposedChart,
  MonoRoundedLineChart,
} from "@/components/dashboard/mono-rounded-charts"

type ChartVariant = "line" | "bar" | "composed"

export function RevenueChart({ data, loading }: { data: RevenueDataPoint[]; loading?: boolean }) {
  const [variant, setVariant] = useState<ChartVariant>("line")
  const { resolvedTheme } = useTheme()
  const chartData = data.map((point) => ({
    label: point.month,
    value: point.ingresos,
    secondary: point.ingresos * 0.76,
  }))
  const chartTheme = resolvedTheme === "light" ? "light" : "dark"

  return (
    <Card className="mx-auto h-full min-w-0 w-full max-w-full overflow-hidden border-border bg-card/60 backdrop-blur-md">
      <CardHeader className="px-3 pb-2 sm:px-6 sm:pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-foreground sm:text-lg">Resumen de Ingresos</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Cambia la visualización de la gráfica</CardDescription>
          </div>
          <div className="flex shrink-0 rounded-[999px] border border-border/70 bg-background/40 p-0.5 backdrop-blur-sm">
            {([["line", "Línea"], ["bar", "Barras"], ["composed", "Mixta"]] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setVariant(key)}
                className={`rounded-[999px] px-2.5 py-1 text-[10px] font-medium transition-all sm:px-3 sm:text-xs ${variant === key ? "bg-foreground/80 text-background" : "text-muted-foreground hover:text-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 px-3 pb-3 sm:px-6 sm:pb-5">
        {loading ? (
          <div className="flex h-[220px] items-center justify-center rounded-[24px] bg-neutral-200 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 sm:h-[268px]">Cargando gráfica...</div>
        ) : chartData.length === 0 ? (
          <div className="flex h-[220px] items-center justify-center rounded-[24px] bg-muted/20 text-sm text-muted-foreground sm:h-[268px]">Sin datos de ingresos</div>
        ) : variant === "line" ? (
          <MonoRoundedLineChart data={chartData} theme={chartTheme} compact />
        ) : variant === "bar" ? (
          <MonoRoundedBarChart data={chartData} theme={chartTheme} compact />
        ) : (
          <MonoRoundedComposedChart data={chartData} theme={chartTheme} compact />
        )}
      </CardContent>
    </Card>
  )
}
