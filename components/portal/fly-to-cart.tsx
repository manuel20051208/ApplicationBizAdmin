"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"

const FLY_SIZE = 56
const FLY_DURATION = 650

interface Flight {
  id: number
  from: DOMRect
  imageUrl: string
}

export function useFlyToCart() {
  const [flight, setFlight] = useState<Flight | null>(null)

  const fly = useCallback((fromEl: HTMLElement, imageUrl: string) => {
    if (!document.getElementById("store-cart-button")) return
    setFlight({
      id: Date.now() + Math.random(),
      from: fromEl.getBoundingClientRect(),
      imageUrl,
    })
  }, [])

  const layer = flight ? (
    <FlyToCartItem key={flight.id} flight={flight} onDone={() => setFlight(null)} />
  ) : null

  return { fly, layer }
}

function FlyToCartItem({ flight, onDone }: { flight: Flight; onDone: () => void }) {
  const elRef = useRef<HTMLDivElement>(null)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    const el = elRef.current
    const targetEl = document.getElementById("store-cart-button")
    if (!el || !targetEl) {
      doneRef.current()
      return
    }

    const target = targetEl.getBoundingClientRect()
    const from = flight.from
    const startX = from.left + from.width / 2 - FLY_SIZE / 2
    const startY = from.top + from.height / 2 - FLY_SIZE / 2
    const endX = target.left + target.width / 2 - FLY_SIZE / 2
    const endY = target.top + target.height / 2 - FLY_SIZE / 2

    const anim = el.animate(
      [
        {
          transform: `translate(${startX}px, ${startY}px) scale(1)`,
          opacity: 1,
        },
        {
          transform: `translate(${endX}px, ${endY}px) scale(0.15)`,
          opacity: 0.75,
        },
      ],
      { duration: FLY_DURATION, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
    )
    anim.onfinish = () => doneRef.current()
    return () => anim.cancel()
  }, [flight])

  return (
    <div
      ref={elRef}
      className="pointer-events-none fixed left-0 top-0 z-[120]"
      style={{ width: FLY_SIZE, height: FLY_SIZE }}
    >
      {flight.imageUrl ? (
        <Image
          src={flight.imageUrl}
          alt=""
          fill
          unoptimized
          className="rounded-lg bg-background object-contain shadow-lg ring-1 ring-border"
          sizes="56px"
        />
      ) : null}
    </div>
  )
}
