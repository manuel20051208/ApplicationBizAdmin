"use client"

import { createContext, useContext, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Palette } from "lucide-react"
import { getStoredUser } from "@/lib/auth/session"

export const ACCENT_OPTIONS = [
  { id: "green", label: "Verde", swatch: "#22c55e", light: "oklch(0.55 0.18 145)", dark: "oklch(0.75 0.18 145)" },
  { id: "blue", label: "Azul", swatch: "#3b82f6", light: "oklch(0.55 0.18 250)", dark: "oklch(0.75 0.18 250)" },
  { id: "violet", label: "Violeta", swatch: "#8b5cf6", light: "oklch(0.55 0.18 300)", dark: "oklch(0.75 0.18 300)" },
  { id: "amber", label: "Ámbar", swatch: "#f59e0b", light: "oklch(0.62 0.17 75)", dark: "oklch(0.78 0.18 75)" },
  { id: "rose", label: "Rosa", swatch: "#f43f5e", light: "oklch(0.58 0.18 15)", dark: "oklch(0.75 0.18 15)" },
] as const

type AccentId = (typeof ACCENT_OPTIONS)[number]["id"]
export type { AccentId }

// Mapeo entre ids locales (green/blue/...) y el enum ColorTypes del backend (VERDE/AZUL/...)
export type ColorTypes = "VERDE" | "AZUL" | "VIOLETA" | "AMBAR" | "ROSA"

export const ACCENT_TO_COLOR_TYPE: Record<AccentId, ColorTypes> = {
  green: "VERDE",
  blue: "AZUL",
  violet: "VIOLETA",
  amber: "AMBAR",
  rose: "ROSA",
}

export const COLOR_TYPE_TO_ACCENT: Record<ColorTypes, AccentId> = {
  VERDE: "green",
  AZUL: "blue",
  VIOLETA: "violet",
  AMBAR: "amber",
  ROSA: "rose",
}

/** Convierte un valor del enum ColorTypes (o string) a un id de acento local. */
export function accentIdFromColorType(value?: string | null): AccentId {
  const key = (value || "").toUpperCase() as ColorTypes
  return COLOR_TYPE_TO_ACCENT[key] ?? "green"
}

/** Convierte un id de acento local al valor del enum ColorTypes del backend. */
export function colorTypeFromAccent(accent: AccentId): ColorTypes {
  return ACCENT_TO_COLOR_TYPE[accent] ?? "VERDE"
}

const AccentContext = createContext<{
  accent: AccentId
  setAccent: (accent: AccentId) => void
}>({ accent: "green", setAccent: () => undefined })

function applyAccent(accentId: AccentId) {
  const option = ACCENT_OPTIONS.find(item => item.id === accentId) ?? ACCENT_OPTIONS[0]
  const root = document.documentElement
  root.dataset.accent = option.id
  const color = root.classList.contains("dark") ? option.dark : option.light
  root.style.setProperty("--primary", color)
  root.style.setProperty("--accent", color)
  root.style.setProperty("--ring", color)
  root.style.setProperty("--chart-1", color)
  root.style.setProperty("--sidebar-primary", color)
  root.style.setProperty("--sidebar-ring", color)
  root.style.setProperty("--accent-light", option.light)
  root.style.setProperty("--accent-dark", option.dark)
}

export function AccentColorProvider({ children }: { children: ReactNode }) {
  const [accent, setAccentState] = useState<AccentId>("green")
  const accentRef = useRef<AccentId>("green")
  const pathname = usePathname()
  const isLogin = pathname === "/login"

  useLayoutEffect(() => {
    const sessionColorType = getStoredUser()?.colorTypes
    const initial = isLogin ? "green" : accentIdFromColorType(sessionColorType)
    accentRef.current = initial
    setAccentState(initial)
    applyAccent(initial)

    const themeObserver = new MutationObserver(() => {
      applyAccent(isLogin ? "green" : accentRef.current)
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })

    return () => themeObserver.disconnect()
  }, [isLogin])

  const setAccent = (next: AccentId) => {
    accentRef.current = next
    setAccentState(next)
    applyAccent(next)
  }

  return <AccentContext.Provider value={{ accent, setAccent }}>{children}</AccentContext.Provider>
}

export function useAccentColor() {
  return useContext(AccentContext)
}

export function AccentColorPicker({ onChange }: { onChange?: (accent: AccentId) => void }) {
  const { accent, setAccent } = useAccentColor()
  return (
    <div className="flex flex-wrap gap-2">
      {ACCENT_OPTIONS.map(option => (
        <button
          key={option.id}
          type="button"
          onClick={() => {
            setAccent(option.id)
            onChange?.(option.id)
          }}
          aria-label={`Usar color ${option.label}`}
          aria-pressed={accent === option.id}
          style={{ "--option-color": option.swatch } as CSSProperties}
          className={`group flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${accent === option.id ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border text-muted-foreground hover:border-[var(--option-color)] hover:text-[var(--option-color)]"}`}
        >
          <span className="size-3 rounded-full ring-1 ring-black/10" style={{ backgroundColor: option.swatch }} />
          {option.label}
          {accent === option.id && <Palette className="size-3.5" />}
        </button>
      ))}
    </div>
  )
}
