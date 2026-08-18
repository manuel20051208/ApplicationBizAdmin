"use client"

import { useEffect, useState } from "react"

// Cuenta regresiva de la oferta (ventana rodante de 3h)
export function OfferCountdown({ deadline }: { deadline: number }) {
  const [, force] = useState(0)
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const remaining = Math.max(0, deadline - Date.now())
  const h = Math.floor(remaining / 3600000)
  const m = Math.floor((remaining % 3600000) / 60000)
  const s = Math.floor((remaining % 60000) / 1000)
  const pad = (n: number) => String(n).padStart(2, "0")

  return <span className="tabular-nums">{pad(h)}:{pad(m)}:{pad(s)}</span>
}
