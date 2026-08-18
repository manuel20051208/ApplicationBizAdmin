"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import { Flame, X } from "lucide-react"
import { sileo } from "sileo"

export interface SocialPurchaseProduct {
  id: number
  name: string
  imageUrl?: string
}

/**
 * Muestra un toast de "alguien compró X" cada 20–45s (simulado).
 * Se pausa cuando la pestaña está oculta para no molestar.
 */
export function usePurchaseSocialToast(products: SocialPurchaseProduct[]) {
  const productsRef = useRef(products)
  productsRef.current = products

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    let active = true

    const schedule = () => {
      if (!active) return
      timer = setTimeout(
        () => {
          if (!active) return
          if (document.hidden) {
            schedule()
            return
          }
          const list = productsRef.current
          if (list.length > 0) {
            const p = list[Math.floor(Math.random() * list.length)]
            const minsAgo = 1 + Math.floor(Math.random() * 12)
            let toastId: string | null = null
            const description = (
              <div className="flex w-full items-center gap-3">
                <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  {p.imageUrl ? (
                    <Image src={p.imageUrl} alt={p.name} fill unoptimized className="object-contain" sizes="40px" />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <Flame className="size-4 text-primary" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">{p.name}</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    hace {minsAgo} min · {minsAgo === 1 ? "compra" : "compras"} reciente
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Cerrar notificación"
                  onClick={() => { if (toastId) sileo.dismiss(toastId) }}
                  className="shrink-0 rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )
            toastId = sileo.show({
              title: "Alguien acaba de comprar",
              description,
              icon: <Flame className="size-4 text-primary" />,
              duration: 6000,
            })
          }
          schedule()
        },
        20000 + Math.random() * 25000
      )
    }

    schedule()
    return () => {
      active = false
      if (timer) clearTimeout(timer)
    }
  }, [])
}
