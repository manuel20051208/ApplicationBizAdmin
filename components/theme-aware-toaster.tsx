"use client"

import { Toaster } from "@/components/ui/sonner"

/**
 * Compatibilidad para componentes que todavía importen este toaster.
 */
export function ThemeAwareToaster() {
  return <Toaster richColors closeButton position="top-right" />
}
