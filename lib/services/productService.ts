  import { fetchClient, API_BASE_URL } from "../api/httpClient";
  import { getStoredUser } from "./authService";

  const API_BASE = "api/product";
  const IMAGE_API = "api/product-images";

  export interface ProductImage {
    id: number;
    fileName: string;
    filePath?: string | null;
    displayOrder: number;
    url?: string | null;
  }

  export interface Product {
    id: number;
    name: string;
    price: number;
    stock: number;
    category: string;
    description?: string | null;
    active?: boolean;
    userAdminId?: number | null;
    images?: ProductImage[];
  }

  export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
    numberOfElements: number;
    empty: boolean;
  }

  // Rutas Públicas (requireAuth: false)

  export async function fetchProducts(adminId: number, sizePage: number = 50): Promise<Product[]> {
    const params = new URLSearchParams({ sizePage: String(sizePage) });
    const res = await fetchClient(`${API_BASE}/activeProducts?${params.toString()}`, { requireAuth: false });
    if (!res.ok) throw new Error("Error al obtener productos");
    const data = await res.json();
    return Array.isArray(data) ? data : (data.content || []);
  }

  export async function fetchActiveProductsWithImages(adminId: number): Promise<Product[]> {
    const res = await fetchClient(`${API_BASE}/search/active-with-images`, { requireAuth: false });
    if (!res.ok) throw new Error("Error al obtener productos con imágenes");
    return res.json();
  }

  export async function fetchProductById(id: number): Promise<Product[]> {
    const res = await fetchClient(`${API_BASE}/search/id/${id}`, { requireAuth: false });
    if (!res.ok) throw new Error("Error al buscar producto por ID");
    return res.json();
  }

  export async function fetchProductByName(name: string): Promise<Product> {
    const res = await fetchClient(`${API_BASE}/search/name/${encodeURIComponent(name)}`, { requireAuth: false });
    if (!res.ok) throw new Error("Error al buscar producto por nombre");
    return res.json();
  }

  export async function fetchProductsByCategory(category: string): Promise<Product[]> {
    const res = await fetchClient(`${API_BASE}/search/category/${encodeURIComponent(category)}`, { requireAuth: false });
    if (!res.ok) throw new Error("Error al buscar por categoría");
    return res.json();
  }

  export async function fetchProductImages(productId: number): Promise<ProductImage[]> {
    const res = await fetchClient(`${IMAGE_API}/${productId}`, { requireAuth: false });
    if (!res.ok) throw new Error("Error al obtener imágenes");
    return res.json();
  }

  // Rutas Protegidas (requireAuth: true)

  export async function fetchAllProducts(): Promise<Product[]> {
    const res = await fetchClient(`${API_BASE}/search/with-images`);
    if (!res.ok) throw new Error("Error al obtener todos los productos");
    return res.json();
  }

  export async function saveProduct(product: Omit<Product, "id">): Promise<Product> {
    const user = getStoredUser();
    const res = await fetchClient(`${API_BASE}/saveProduct`, {
      method: "POST",
      body: JSON.stringify({
        name: product.name,
        price: product.price,
        stock: product.stock,
        category: product.category,
        description: product.description ?? null,
        userAdmin: user?.id ? { id: user.id } : null,
      }),
    });
    if (!res.ok) throw new Error("Error al guardar producto");
    return res.json();
  }

  export async function deactivateProduct(id: number): Promise<Product> {
    const params = new URLSearchParams({ id: String(id) });
    const res = await fetchClient(`${API_BASE}/deleteSafe?${params.toString()}`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Error al desactivar producto");
    return res.json();
  }

  export async function deleteProduct(id: number): Promise<void> {
    const params = new URLSearchParams({ id: String(id) });
    const res = await fetchClient(`${API_BASE}/delete?${params.toString()}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Error al eliminar producto");
  }

  export async function updateProduct(id: number, product: Omit<Product, "id">): Promise<Product> {
    const user = getStoredUser();
    const res = await fetchClient(`${API_BASE}/update/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        ...product,
        userAdmin: user?.id ? { id: user.id } : null,
      }),
    });
    if (!res.ok) throw new Error("Error al actualizar producto");
    return res.json();
  }

  export async function uploadProductImage(productId: number, file: File): Promise<ProductImage> {
    const formData = new FormData();
    formData.append("file", file);
    // fetchClient omite agregar Content-Type a FormData automáticamente
    const res = await fetchClient(`${IMAGE_API}/upload/${productId}`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Error al subir imagen");
    return res.json();
  }

  export async function deleteProductImage(imageId: number): Promise<void> {
    const res = await fetchClient(`${IMAGE_API}/${imageId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Error al eliminar imagen");
  }

  function toProxiedUploadPath(pathOrUrl: string): string {
    if (!pathOrUrl) return "";
    if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
      return pathOrUrl;
    }
    return pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  }

  export function getImageUrl(imageOrPath: ProductImage | string): string {
    if (!imageOrPath) return "";

    if (typeof imageOrPath === 'object') {
      if (imageOrPath.url) {
        return toProxiedUploadPath(imageOrPath.url);
      }
      return getImageUrl(imageOrPath.filePath ?? "");
    }

    const filePath = toProxiedUploadPath(imageOrPath);
    if (filePath.startsWith("http")) return filePath;
    if (filePath.startsWith("/uploads/")) return `${API_BASE_URL}${filePath}`;
    if (filePath.startsWith("/")) return `${API_BASE_URL}${filePath}`;
    return `${API_BASE_URL}/uploads/${filePath}`;
  }
