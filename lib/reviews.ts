import { getStoredUser } from "@/lib/services/authService"

export interface Review {
  id: string
  author: string
  rating: number
  date: string // ISO
  text: string
  initials: string
  avatarBg: string
  mine?: boolean
}

const NAMES = [
  "Laura G.", "Marco P.", "Sofía R.", "Andrés M.", "Valentina C.",
  "Julián T.", "Camila F.", "Mateo H.", "Lucía B.", "Diego N.",
]

const TEXTS = [
  "Excelente producto, llegó rápido y tal cual la foto.",
  "Muy buena calidad, volvería a comprar sin dudas.",
  "Cumple con lo prometido. La atención fue genial.",
  "Buen precio y entrega puntual. Recomendado.",
  "Me encantó, superó mis expectativas.",
  "Buen producto, aunque tardó un poco el envío.",
  "Justo lo que buscaba, muy satisfecho con la compra.",
]

const BGS = [
  "bg-pink-500/20 text-pink-600",
  "bg-sky-500/20 text-sky-600",
  "bg-amber-500/20 text-amber-600",
  "bg-violet-500/20 text-violet-600",
  "bg-emerald-500/20 text-emerald-600",
  "bg-rose-500/20 text-rose-600",
  "bg-indigo-500/20 text-indigo-600",
  "bg-teal-500/20 text-teal-600",
]

function seeded(n: number): () => number {
  let seed = n
  return () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

/** Reseñas simuladas determinísticas por producto */
export function getMockReviews(productId: number): Review[] {
  const rnd = seeded(productId * 7919 + 13)
  const count = 2 + Math.floor(rnd() * 3) // 2 a 4 reseñas
  const reviews: Review[] = []
  for (let i = 0; i < count; i++) {
    const name = NAMES[Math.floor(rnd() * NAMES.length)]
    const rating = 3 + Math.floor(rnd() * 3) // 3 a 5 estrellas
    const daysAgo = 1 + Math.floor(rnd() * 60)
    const date = new Date(Date.now() - daysAgo * 24 * 3600 * 1000)
    reviews.push({
      id: `mock-${productId}-${i}`,
      author: name,
      rating,
      date: date.toISOString(),
      text: TEXTS[Math.floor(rnd() * TEXTS.length)],
      initials: initialsOf(name),
      avatarBg: BGS[Math.floor(rnd() * BGS.length)],
    })
  }
  return reviews.sort((a, b) => parseDate(b.date) - parseDate(a.date))
}

// ── Reseñas del usuario (localStorage scoped por producto) ──────
const REVIEWS_KEY = "biz-portal-reviews"

interface StoredReview {
  productId: number
  rating: number
  text: string
  date: string
}

function getStoredReviews(): StoredReview[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(REVIEWS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveStoredReviews(reviews: StoredReview[]): void {
  try {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews))
  } catch {
    // ignorar
  }
}

export function addUserReview(productId: number, rating: number, text: string): Review {
  const user = getStoredUser()
  const author = user?.fullName?.trim() || "Tú"
  const review: Review = {
    id: `user-${productId}-${Date.now()}`,
    author,
    rating,
    date: new Date().toISOString(),
    text: text.trim(),
    initials: initialsOf(author),
    avatarBg: "bg-primary/15 text-primary",
    mine: true,
  }
  saveStoredReviews([
    { productId, rating, text: text.trim(), date: review.date },
    ...getStoredReviews(),
  ])
  return review
}

export function getReviewsForProduct(productId: number): Review[] {
  const stored = getStoredReviews()
    .filter((r) => r.productId === productId)
    .map<Review>((r) => {
      const user = getStoredUser()
      const author = user?.fullName?.trim() || "Tú"
      return {
        id: `user-${r.date}`,
        author,
        rating: r.rating,
        date: r.date,
        text: r.text,
        initials: initialsOf(author),
        avatarBg: "bg-primary/15 text-primary",
        mine: true,
      }
    })
  return [...stored, ...getMockReviews(productId)].sort(
    (a, b) => parseDate(b.date) - parseDate(a.date)
  )
}

function parseDate(iso: string): number {
  const t = new Date(iso).getTime()
  return isNaN(t) ? 0 : t
}

export function getAverageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0
  const sum = reviews.reduce((s, r) => s + r.rating, 0)
  return Math.round((sum / reviews.length) * 10) / 10
}

export function formatReviewDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
}
