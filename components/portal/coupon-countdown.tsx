"use client"

import { useEffect, useState } from "react"
import { Clock3 } from "lucide-react"
import { getCouponTimeRemaining, type CouponTimeRemaining } from "@/lib/coupons"

interface CouponCountdownProps {
  dateLimit?: string | null
  className?: string
}

function pad(value: number) {
  return String(value).padStart(2, "0")
}

export function CouponCountdown({ dateLimit, className = "" }: CouponCountdownProps) {
  const [remaining, setRemaining] = useState<CouponTimeRemaining | null>(null)

  useEffect(() => {
    const update = () => setRemaining(getCouponTimeRemaining(dateLimit))
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [dateLimit])

  if (!dateLimit || !remaining) return null

  if (remaining.totalMs <= 0) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground ${className}`}>
        <Clock3 className="size-3" /> Expirado
      </span>
    )
  }

  return (
    <span
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary ${className}`}
      title="Tiempo restante para usar este cupón"
    >
      <Clock3 className="size-3" />
      {remaining.days > 0 && `${remaining.days}d `}
      {pad(remaining.hours)}:{pad(remaining.minutes)}:{pad(remaining.seconds)} restantes
    </span>
  )
}
