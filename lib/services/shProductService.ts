import { fetchClient } from "@/lib/api/httpClient"
import { getImageUrl, type ProductImage } from "@/lib/services/productService"

const API_BASE = "api/sh-product"
const IMAGE_API = "api/sh-product-images"

export interface ShProduct extends Omit<ProductImage, "id"> {
  id: number
  name: string
  price: number
  stock: number
  category: string
  description?: string | null
  active?: boolean
  timeOfUse?: string | number | null
  levelOfSecondHandProduct?: string | null
  ownerName?: string | null
  userAdminId?: number | null
  imageUrl?: string | null
  images?: ShProductImage[]
}

export interface ShProductImage {
  id: number
  fileName?: string | null
  displayOrder: number
  url?: string | null
}

export interface ShProductPayload {
  name: string
  price: number
  stock: number
  category: string
  description: string | null
  timeOfUse: string | null
  levelOfSecondHandProduct: string
  active?: boolean
}

export function normalizeShProduct(product: Partial<ShProduct>): ShProduct {
  return {
    id: Number(product.id),
    name: product.name || "Producto de segunda mano",
    price: Number(product.price) || 0,
    stock: Number(product.stock) || 0,
    category: product.category || "General",
    description: product.description ?? null,
    active: product.active !== false,
    timeOfUse: product.timeOfUse ?? null,
    levelOfSecondHandProduct: product.levelOfSecondHandProduct || "Bueno",
    ownerName: product.ownerName ?? null,
    userAdminId: product.userAdminId ?? null,
    imageUrl: product.imageUrl ?? null,
    images: Array.isArray(product.images) ? product.images : [],
    fileName: "",
    displayOrder: 0,
  }
}

function unwrapList(data: unknown): ShProduct[] {
  const list = Array.isArray(data)
    ? data
    : (data as { content?: unknown[] })?.content || []
  return list.map((item) => normalizeShProduct(item as Partial<ShProduct>))
}

export async function fetchShProducts(search = ""): Promise<ShProduct[]> {
  const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ""
  const response = await fetchClient(`${API_BASE}/my${query}`)
  if (!response.ok) throw new Error("No se pudieron cargar los productos de segunda mano")
  return unwrapList(await response.json())
}

export async function fetchActiveShProducts(filters?: {
  search?: string
  category?: string
}): Promise<ShProduct[]> {
  const params = new URLSearchParams()
  if (filters?.category && filters.category !== "all") params.set("category", filters.category)
  if (filters?.search?.trim()) params.set("search", filters.search.trim())
  const suffix = params.toString() ? `?${params.toString()}` : ""
  const response = await fetchClient(`${API_BASE}/search/active${suffix}`, { requireAuth: false })
  if (!response.ok) throw new Error("No se pudieron cargar los productos de segunda mano")
  return unwrapList(await response.json())
}

export async function fetchShProduct(id: number): Promise<ShProduct> {
  const response = await fetchClient(`${API_BASE}/${id}`)
  if (!response.ok) throw new Error("No se pudo cargar el producto")
  return normalizeShProduct(await response.json())
}

export async function saveShProduct(payload: ShProductPayload): Promise<ShProduct> {
  const response = await fetchClient(`${API_BASE}/saveShProduct`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error("No se pudo guardar el producto")
  return normalizeShProduct(await response.json())
}

export async function updateShProduct(id: number, payload: ShProductPayload): Promise<ShProduct> {
  const response = await fetchClient(`${API_BASE}/update/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error("No se pudo actualizar el producto")
  return normalizeShProduct(await response.json())
}

export async function deactivateShProduct(product: ShProduct): Promise<ShProduct> {
  const params = new URLSearchParams({
    id: String(product.id),
    name: product.name,
    price: String(product.price),
    stock: String(product.stock),
    category: product.category,
    description: product.description || "",
    timeOfUse: String(product.timeOfUse || ""),
    levelOfSecondHandProduct: product.levelOfSecondHandProduct || "Bueno",
  })
  const response = await fetchClient(`${API_BASE}/deleteSafe?${params.toString()}`, { method: "POST" })
  if (!response.ok) throw new Error("No se pudo desactivar el producto")
  return normalizeShProduct(await response.json())
}

export async function fetchShProductImages(productId: number): Promise<ShProductImage[]> {
  const response = await fetchClient(`${IMAGE_API}/${productId}`, { requireAuth: false })
  if (!response.ok) throw new Error("No se pudieron cargar las imágenes")
  return response.json()
}

export async function uploadShProductImage(productId: number, file: File): Promise<ShProductImage> {
  const body = new FormData()
  body.append("file", file)
  const response = await fetchClient(`${IMAGE_API}/upload/${productId}`, { method: "POST", body })
  if (!response.ok) throw new Error("No se pudo subir la imagen")
  return response.json()
}

export async function deleteShProductImage(imageId: number): Promise<void> {
  const response = await fetchClient(`${IMAGE_API}/${imageId}`, { method: "DELETE" })
  if (!response.ok) throw new Error("No se pudo eliminar la imagen")
}

export function getShImageUrl(image: ShProductImage | string): string {
  return getImageUrl(image as ProductImage | string)
}
