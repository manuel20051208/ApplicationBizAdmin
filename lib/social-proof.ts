/**
 * Social proof simulado, 100% determinístico por `productId`.
 * Los mismos valores se repiten en cada render (estable), sin depender de
 * APIs ni de estado aleatorio que provoque saltos de UI.
 */

const OFFER_WINDOW_MS = 3 * 60 * 60 * 1000 // ventana rodante de 3h

function hash(n: number): number {
  let h = n * 2654435761
  h = (h ^ (h >>> 13)) >>> 0
  return h
}

export interface OfferInfo {
  discountPct: number
  originalPrice: number
  price: number
}

/** ~30% de los productos tienen una oferta activa (badge + precio tachado). */
export function getOfferForProduct(id: number, price: number): OfferInfo | null {
  const h = hash(id)
  if (h % 10 >= 3) return null

  const discountPct = [10, 15, 20, 25][h % 4]
  const originalPrice = Math.round((price / (1 - discountPct / 100)) * 100) / 100
  return { discountPct, originalPrice, price }
}

/** Fin de la ventana de oferta actual (siguiente múltiplo de 3h). */
export function getOfferDeadline(now = Date.now()): number {
  return Math.floor((now + OFFER_WINDOW_MS) / OFFER_WINDOW_MS) * OFFER_WINDOW_MS
}

/** "N personas compraron esto" — estable, entre 17 y 99. */
export function getBuyersCount(id: number): number {
  return 17 + (hash(id) % 83)
}

const AVATAR_PALETTE = [
  { bg: "bg-primary/20", text: "text-primary" },
  { bg: "bg-blue-500/20", text: "text-blue-500" },
  { bg: "bg-amber-500/20", text: "text-amber-600" },
  { bg: "bg-purple-500/20", text: "text-purple-500" },
  { bg: "bg-rose-500/20", text: "text-rose-500" },
]

/** Avatar determinístico para el stack de "compradores". */
export function getAvatarForProduct(id: number, index: number) {
  const h = hash(id + index * 101)
  const palette = AVATAR_PALETTE[h % AVATAR_PALETTE.length]
  const initials = String.fromCharCode(65 + (h % 26)) + String.fromCharCode(65 + ((h >> 3) % 26))
  return { ...palette, initials }
}
