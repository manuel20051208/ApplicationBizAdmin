"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { RevenueDataPoint } from "@/lib/services/adminService"

interface RevenueChartProps {
  data: RevenueDataPoint[]
  loading?: boolean
}

export function RevenueChart({ data, loading }: RevenueChartProps) {
  return (
    <Card className="mx-auto min-w-0 w-full max-w-full overflow-hidden border-white/20 bg-card/60 backdrop-blur-md">
      <CardHeader className="px-3 pb-2 sm:px-6 sm:pb-6">
        <CardTitle className="text-base font-semibold text-foreground sm:text-lg">
          Resumen de Ingresos
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Ingresos mensuales por mes
        </CardDescription>
      </CardHeader>
      <CardContent className="min-w-0 px-3 pb-4 sm:px-6 sm:pb-6">
        <div className="h-[160px] min-w-0 w-full sm:h-[300px]">
          {loading ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Cargando gráfica...
            </div>
          ) : data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Sin datos de ingresos
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart
                data={data}
                margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.75 0.18 165)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.75 0.18 165)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="oklch(0.28 0.005 260)" 
                  vertical={false}
                />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  tick={{ fill: "oklch(0.65 0 0)", fontSize: 10 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  width={42}
                  tick={{ fill: "oklch(0.65 0 0)", fontSize: 10 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(0.17 0.005 260)",
                    border: "1px solid oklch(0.28 0.005 260)",
                    borderRadius: "8px",
                    color: "oklch(0.95 0 0)",
                  }}
                  labelStyle={{ color: "oklch(0.65 0 0)" }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Ingresos"]}
                />
                <Area
                  type="monotone"
                  dataKey="ingresos"
                  stroke="oklch(0.75 0.18 165)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorIngresos)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
