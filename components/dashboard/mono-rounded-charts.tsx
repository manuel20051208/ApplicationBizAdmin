"use client"

import { useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useIsMobile } from "@/hooks/use-mobile"

type ChartTheme = "dark" | "light"

interface Point {
  label: string
  value: number
  secondary?: number
}

interface MonoChartProps {
  data?: Point[]
  theme?: ChartTheme
  compact?: boolean
}

const defaultData: Point[] = [
  { label: "Ene", value: 24, secondary: 18 },
  { label: "Feb", value: 45, secondary: 32 },
  { label: "Mar", value: 38, secondary: 29 },
  { label: "Abr", value: 65, secondary: 48 },
  { label: "May", value: 52, secondary: 41 },
  { label: "Jun", value: 84, secondary: 62 },
]

function formatAxisValue(value: number) {
  const absolute = Math.abs(value)
  if (absolute >= 1_000_000) return `${(value / 1_000_000).toFixed(absolute >= 10_000_000 ? 0 : 1)}M`
  if (absolute >= 1_000) return `${(value / 1_000).toFixed(absolute >= 10_000 ? 0 : 1)}k`
  return value.toLocaleString("es-CO")
}

function ChartShell({
  children,
  title,
  theme,
  compact,
  control,
  footer,
}: {
  children: React.ReactNode
  title: string
  theme: ChartTheme
  compact: boolean
  control: React.ReactNode
  footer: React.ReactNode
}) {
  const dark = theme === "dark"
  return (
    <div className={`relative flex w-full flex-col justify-between overflow-hidden rounded-[24px] p-4 transition-all sm:p-5 ${compact ? "h-[220px] sm:h-[268px]" : "min-h-[290px]"} ${dark ? "bg-[#181818] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]" : "border border-neutral-200 bg-white text-black shadow-[0_4px_20px_rgba(0,0,0,0.04)]"}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold tracking-wide text-primary">{title}</span>
        {control}
      </div>
      <div className={`relative min-h-0 w-full flex-1 overflow-hidden rounded-[14px] p-2 ${dark ? "bg-[#131313]" : "bg-[#f4f4f6]"}`}>
        {children}
      </div>
      <div className={`mt-3 flex items-center justify-between border-t pt-1 text-xs font-mono ${dark ? "border-white/10 text-neutral-400" : "border-neutral-200 text-neutral-600"}`}>
        {footer}
      </div>
    </div>
  )
}

function chartTheme(theme: ChartTheme) {
  const dark = theme === "dark"
  return {
    dark,
    grid: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)",
    tick: dark ? "#71717A" : "#71717A",
    primary: "var(--primary)",
    secondary: "var(--muted-foreground)",
  }
}

export function MonoRoundedLineChart({ data = defaultData, theme = "dark", compact = true }: MonoChartProps) {
  const [dual, setDual] = useState(true)
  const mobile = useIsMobile()
  const colors = chartTheme(theme)
  return (
    <ChartShell title="INGRESOS MENSUALES" theme={theme} compact={compact}
      control={<button type="button" onClick={() => setDual(value => !value)} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${colors.dark ? "border-white/10 bg-white/5 text-white" : "border-neutral-200 bg-neutral-100 text-black"}`}>{dual ? "Dual" : "Simple"}</button>}
      footer={<><span>Tendencia mensual</span><span className="font-medium">{data.at(-1)?.value ?? 0}k</span></>}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart data={data} margin={{ top: 12, right: 8, left: 2, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: colors.tick }} />
          <YAxis width={42} tickFormatter={formatAxisValue} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: colors.tick }} />
          <Tooltip
            cursor={{ fill: "var(--primary)", fillOpacity: 0.045 }}
            contentStyle={{
              borderRadius: 16,
              border: "1px solid color-mix(in oklab, var(--primary) 18%, var(--border))",
              background: "color-mix(in oklab, var(--card) 94%, var(--primary))",
              color: "var(--primary)",
              boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
              backdropFilter: "blur(12px)",
            }}
            labelStyle={{ color: "var(--primary)", fontWeight: 600 }}
          />
          {dual && <Line type="monotone" dataKey="secondary" name="Referencia" stroke={colors.secondary} strokeWidth={2} strokeDasharray="4 4" dot={false} isAnimationActive={!mobile} />}
          <Line type="monotone" dataKey="value" name="Ingresos" stroke={colors.primary} strokeWidth={3} strokeLinecap="round" dot={{ r: 3, fill: colors.primary, stroke: colors.dark ? "#181818" : "#fff", strokeWidth: 2 }} isAnimationActive={!mobile} />
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  )
}

export function MonoRoundedBarChart({ data = defaultData, theme = "dark", compact = true }: MonoChartProps) {
  const mobile = useIsMobile()
  const colors = chartTheme(theme)
  return (
    <ChartShell title="VENTAS POR PERIODO" theme={theme} compact={compact}
      control={<span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary/90 backdrop-blur-sm">Pill bars</span>}
      footer={<><span>Comparativa de ventas</span><span className="font-medium">{data.reduce((sum, item) => sum + item.value, 0).toLocaleString()}</span></>}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} margin={{ top: 12, right: 8, left: 2, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 2" vertical={false} stroke={colors.grid} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: colors.tick }} />
          <YAxis width={42} tickFormatter={formatAxisValue} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: colors.tick }} />
          <Tooltip
            cursor={{ fill: "var(--primary)", fillOpacity: 0.045 }}
            contentStyle={{
              borderRadius: 16,
              border: "1px solid color-mix(in oklab, var(--primary) 18%, var(--border))",
              background: "color-mix(in oklab, var(--card) 94%, var(--primary))",
              color: "var(--primary)",
              boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
              backdropFilter: "blur(12px)",
            }}
            labelStyle={{ color: "var(--primary)", fontWeight: 600 }}
          />
          <Bar dataKey="value" name="Ventas" fill={colors.primary} radius={[12, 12, 12, 12]} barSize={16} isAnimationActive={!mobile} />
          <Bar dataKey="secondary" name="Referencia" fill={colors.secondary} radius={[12, 12, 12, 12]} barSize={16} isAnimationActive={!mobile} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  )
}

export function MonoRoundedComposedChart({ data = defaultData, theme = "dark", compact = true }: MonoChartProps) {
  const [showLine, setShowLine] = useState(true)
  const mobile = useIsMobile()
  const colors = chartTheme(theme)
  return (
    <ChartShell title="VENTAS Y TENDENCIA" theme={theme} compact={compact}
      control={<button type="button" onClick={() => setShowLine(value => !value)} className={`rounded-full border px-3 py-1.5 text-xs ${showLine ? (colors.dark ? "border-white/20 bg-white/10 text-white" : "border-neutral-300 bg-neutral-100 text-black") : (colors.dark ? "border-white/10 text-neutral-500" : "border-neutral-200 text-neutral-400")}`}>{showLine ? "Línea on" : "Línea off"}</button>}
      footer={<><span>Capas monocromáticas</span><span className="font-medium">Comparativa</span></>}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <ComposedChart data={data} margin={{ top: 12, right: 8, left: 2, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 2" vertical={false} stroke={colors.grid} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: colors.tick }} />
          <YAxis width={42} tickFormatter={formatAxisValue} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: colors.tick }} />
          <Tooltip
            cursor={{ fill: "var(--primary)", fillOpacity: 0.045 }}
            contentStyle={{
              borderRadius: 16,
              border: "1px solid color-mix(in oklab, var(--primary) 18%, var(--border))",
              background: "color-mix(in oklab, var(--card) 94%, var(--primary))",
              color: "var(--primary)",
              boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
              backdropFilter: "blur(12px)",
            }}
            labelStyle={{ color: "var(--primary)", fontWeight: 600 }}
          />
          <Bar dataKey="value" name="Ventas" fill={colors.primary} fillOpacity={0.22} stroke={colors.primary} strokeOpacity={0.55} radius={[12, 12, 12, 12]} barSize={20} isAnimationActive={!mobile} />
          {showLine && <Line type="monotone" dataKey="secondary" name="Tendencia" stroke={colors.primary} strokeWidth={3} strokeLinecap="round" dot={{ r: 3, fill: colors.primary, stroke: colors.dark ? "#181818" : "#fff", strokeWidth: 2 }} isAnimationActive={!mobile} />}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartShell>
  )
}
