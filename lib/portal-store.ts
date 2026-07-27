import { getStoredUser } from "@/lib/services/authService"

export interface CartItem {
  productId: number
  quantity: number
}

export interface LinkedCard {
  id?: number
  holderName: string
  last4: string
  brand: "visa" | "mastercard" | "amex"
  expiryMonth: string
  expiryYear: string
  active: boolean
  linkedAt: string
}



function getUserStorageKey(): string | null {
  const user = getStoredUser()
  if (!user) return null
  const key = user.email || user.fullName || String(user.id ?? "")
  return key ? String(key) : null
}

function scopedKey(suffix: string): string | null {
  const userKey = getUserStorageKey()
  if (!userKey) return null
  return `biz-portal-${suffix}-${userKey}`
}

export function getPortalCart(): CartItem[] {
  const key = scopedKey("cart")
  if (!key) return []
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function savePortalCart(items: CartItem[]): void {
  const key = scopedKey("cart")
  if (!key) return
  localStorage.setItem(key, JSON.stringify(items))
}

export function getLinkedCard(): LinkedCard | null {
  const key = scopedKey("card")
  if (!key) return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const card = JSON.parse(raw) as LinkedCard
    return card?.active ? card : null
  } catch {
    return null
  }
}

export function getLinkedCardRaw(): LinkedCard | null {
  const key = scopedKey("card")
  if (!key) return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as LinkedCard
  } catch {
    return null
  }
}

export function saveLinkedCard(card: LinkedCard): void {
  const key = scopedKey("card")
  if (!key) return
  localStorage.setItem(key, JSON.stringify(card))
}

export function removeLinkedCard(): void {
  const key = scopedKey("card")
  if (!key) return
  localStorage.removeItem(key)
}



export function detectCardBrand(digits: string): LinkedCard["brand"] {
  if (digits.startsWith("34") || digits.startsWith("37")) return "amex"
  if (digits.startsWith("4")) return "visa"
  if (digits.startsWith("5")) return "mastercard"
  return "visa"
}

export function isCardExpired(month: string, year: string): boolean {
  const m = parseInt(month, 10)
  const y = parseInt(year.length === 2 ? `20${year}` : year, 10)
  if (!m || !y) return true
  const now = new Date()
  const expEnd = new Date(y, m, 0, 23, 59, 59)
  return expEnd < now
}

export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16)
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim()
}

export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}
