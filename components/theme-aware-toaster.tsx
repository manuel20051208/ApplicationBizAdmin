"use client"

import { Toaster } from "sileo"
import { useTheme } from "next-themes"

/**
 * Toaster de sileo que sigue el tema activo de la app (oscuro/claro).
 *
 * sileo pinta el fondo del toast con el `fill` de un <rect> SVG. Sus temas
 * integrados están invertidos respecto a la app (theme="dark" dibuja un toast
 * claro y viceversa), así que aquí pasamos un color CONCRETO por `options.fill`
 * (el equivalente al --card de cada tema) para que el toast sea oscuro en modo
 * oscuro y claro en modo claro. Los mismos colores se refuerzan en
 * app/globals.css como fallback.
 */
export function ThemeAwareToaster() {
  const { resolvedTheme } = useTheme()
  const fill = resolvedTheme === "dark" ? "oklch(0.17 0.005 260)" : "oklch(1 0 0)"

  return (
    <Toaster
      position="top-right"
      options={{ fill }}
    />
  )
}
