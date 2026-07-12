"use client"

import { cn } from "@/lib/utils"
import type { LinkedCard } from "@/lib/portal-store"

const brandLabel: Record<LinkedCard["brand"], string> = {
  visa: "VISA",
  mastercard: "Mastercard",
  amex: "AMEX",
}

interface CreditCardVisualProps {
  card: LinkedCard
  className?: string
}

export function CreditCardVisual({ card, className }: CreditCardVisualProps) {
  return (
    <div
      className={cn(
        "relative aspect-[1.586/1] w-full max-w-sm overflow-hidden rounded-2xl p-5 text-white shadow-xl",
        "bg-gradient-to-br from-slate-900 via-slate-800 to-primary/80",
        className
      )}
    >
      <div className="absolute -right-8 -top-8 size-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-10 -left-6 size-40 rounded-full bg-primary/30 blur-2xl" />

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <span className="text-[10px] font-medium uppercase tracking-widest text-white/70">
            BizShop Pay
          </span>
          <span className="text-sm font-bold tracking-wide">{brandLabel[card.brand]}</span>
        </div>

        <p className="font-mono text-lg tracking-[0.2em] sm:text-xl">
          •••• •••• •••• {card.last4}
        </p>

        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-wider text-white/60">Titular</p>
            <p className="truncate text-sm font-semibold uppercase">{card.holderName}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[9px] uppercase tracking-wider text-white/60">Vence</p>
            <p className="font-mono text-sm font-semibold">
              {card.expiryMonth}/{card.expiryYear}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
