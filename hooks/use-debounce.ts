"use client"

import { useState, useEffect } from "react"

/**
 * Hook de debounce para búsquedas.
 * Retrasa el valor de salida `delay` ms después de que el usuario deje de escribir.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
