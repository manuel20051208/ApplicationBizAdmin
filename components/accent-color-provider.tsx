"use client"

import { createContext, useContext, useLayoutEffect, useState, type CSSProperties, type ReactNode } from "react"
import { Palette } from "lucide-react"

export const ACCENT_OPTIONS = [
  { id: "green", label: "Verde", swatch: "#22c55e", light: "oklch(0.55 0.18 145)", dark: "oklch(0.75 0.18 145)" },
  { id: "blue", label: "Azul", swatch: "#3b82f6", light: "oklch(0.55 0.18 250)", dark: "oklch(0.75 0.18 250)" },
  { id: "violet", label: "Violeta", swatch: "#8b5cf6", light: "oklch(0.55 0.18 300)", dark: "oklch(0.75 0.18 300)" },
  { id: "amber", label: "Ámbar", swatch: "#f59e0b", light: "oklch(0.62 0.17 75)", dark: "oklch(0.78 0.18 75)" },
  { id: "rose", label: "Rosa", swatch: "#f43f5e", light: "oklch(0.58 0.18 15)", dark: "oklch(0.75 0.18 15)" },
] as const

type AccentId = (typeof ACCENT_OPTIONS)[number]["id"]
const STORAGE_KEY = "biz-accent-color"

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

  useLayoutEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as AccentId | null
    const initial = ACCENT_OPTIONS.some(item => item.id === stored) ? stored! : "green"
    setAccentState(initial)
    applyAccent(initial)

    const themeObserver = new MutationObserver(() => {
      const current = window.localStorage.getItem(STORAGE_KEY) as AccentId | null
      applyAccent(ACCENT_OPTIONS.some(item => item.id === current) ? current! : initial)
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })

    const sync = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue && ACCENT_OPTIONS.some(item => item.id === event.newValue)) {
        setAccentState(event.newValue as AccentId)
        applyAccent(event.newValue as AccentId)
      }
    }
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener("storage", sync)
      themeObserver.disconnect()
    }
  }, [])

  const setAccent = (next: AccentId) => {
    setAccentState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
    applyAccent(next)
  }

  return <AccentContext.Provider value={{ accent, setAccent }}>{children}</AccentContext.Provider>
}

export function useAccentColor() {
  return useContext(AccentContext)
}

export function AccentColorPicker() {
  const { accent, setAccent } = useAccentColor()
  return (
    <div className="flex flex-wrap gap-2">
      {ACCENT_OPTIONS.map(option => (
        <button
          key={option.id}
          type="button"
          onClick={() => setAccent(option.id)}
          aria-label={`Usar color ${option.label}`}
          aria-pressed={accent === option.id}
          style={{ "--option-color": option.swatch } as CSSProperties}
          className={`group flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${accent === option.id ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border text-muted-foreground hover:border-[var(--option-color)] hover:text-[var(--option-color)] hover:shadow-[0_0_14px_var(--option-color)]"}`}
        >
          <span className="size-3 rounded-full ring-1 ring-black/10" style={{ backgroundColor: option.swatch }} />
          {option.label}
          {accent === option.id && <Palette className="size-3.5" />}
        </button>
      ))}
    </div>
  )
}
