"use client"

import Image from "next/image"
import { useState } from "react"
import { ZoomIn } from "lucide-react"

interface ImageZoomProps {
  src: string
  alt: string
  sizes?: string
  priority?: boolean
}

export function ImageZoom({ src, alt, sizes, priority }: ImageZoomProps) {
  const [zoomed, setZoomed] = useState(false)
  const [origin, setOrigin] = useState({ x: 50, y: 50 })

  return (
    <div
      className="group relative h-full w-full cursor-zoom-in overflow-hidden"
      onMouseEnter={() => setZoomed(true)}
      onMouseLeave={() => setZoomed(false)}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        setOrigin({
          x: Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)),
          y: Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100)),
        })
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-contain p-2 transition-transform duration-200 ease-out will-change-transform"
        style={{
          transformOrigin: `${origin.x}% ${origin.y}%`,
          transform: zoomed ? "scale(1.9)" : "scale(1)",
        }}
      />
      <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-background/70 p-1.5 text-muted-foreground opacity-0 transition-opacity backdrop-blur-sm group-hover:opacity-100">
        <ZoomIn className="size-4" />
      </div>
    </div>
  )
}
