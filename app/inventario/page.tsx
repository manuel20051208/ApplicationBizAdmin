"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { toast } from "sonner"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  fetchAllProducts, saveProduct, deactivateProduct, updateProduct,
  uploadProductImage, fetchProductImages, deleteProductImage,
  getImageUrl,
  type Product, type ProductImage,
} from "@/lib/services/productService"
import { getStoredUser } from "@/lib/auth/session"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import Image from "next/image"
import { Plus, Trash2, Package, Search, Pencil, Upload, ImageIcon, Eye, Store, Phone, Mail, FileText, ShoppingCart } from "lucide-react"

const PRODUCT_CATEGORIES = [
  "Electrónica",
  "Tecnología",
  "Computadoras",
  "Celulares",
  "Audio",
  "Ropa",
  "Calzado",
  "Accesorios",
  "Hogar",
  "Muebles",
  "Deportes",
  "Salud y Belleza",
  "Alimentos",
  "Bebidas",
  "Juguetes",
  "Libros",
  "Herramientas",
  "Automotriz",
  "Mascotas",
  "Oficina",
  "Gaming",
  "Fotografía",
  "Jardín",
  "Otro",
]

type StorePreviewPayload = {
  name: string
  category: string
  price: number
  stock: number
  description: string | null
  images: ProductImage[]
}

export default function InventarioPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [newProduct, setNewProduct] = useState({ name: "", price: "", stock: "", category: "", description: "" })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [onlyWithImages, setOnlyWithImages] = useState(false)

  // Límite de productos a mostrar
  const [sizeLimit, setSizeLimit] = useState(50)

  // Estado para el modal de edición
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Estado para el modal de imágenes
  const [imageModalProductId, setImageModalProductId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estado para confirmación de eliminación
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)

  const [storePreviewOpen, setStorePreviewOpen] = useState(false)
  const [storePreview, setStorePreview] = useState<StorePreviewPayload | null>(null)

  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  const checkProfileOrWarn = (): boolean => {
    const storedUser = getStoredUser("admin")
    if (!storedUser) return false

    const isInvalid = (val?: string | number | null) => {
      if (val === undefined || val === null) return true
      const str = String(val).trim().toLowerCase()
      return (
        str === "" ||
        str === "0" ||
        str === "no especificado" ||
        str === "sin nombre" ||
        str === "null" ||
        str === "undefined"
      )
    }

    if (
      isInvalid(storedUser.fullName) ||
      isInvalid(storedUser.businessName) ||
      isInvalid(storedUser.phone) ||
      isInvalid(storedUser.email)
    ) {
      toast.error("Debes completar la información de tu perfil y negocio (Nombre, Negocio, Teléfono, Email) en Configuración antes de agregar productos.", {
        action: {
          label: "Ir a Configuración",
          onClick: () => router.push("/configuracion"),
        },
        duration: 6000,
      })
      return false
    }
    return true
  }

  useEffect(() => {
    setUser(getStoredUser())
  }, [])

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchAllProducts()
      setProducts(data.map((p: any) => ({ ...p, images: p.images || [] })))
    } catch (err) {
      import("@/lib/api-errors").then(({ triggerOfflineNotification }) => {
        triggerOfflineNotification(() => loadProducts())
      })
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const filteredProducts = products.filter(product => {
    // Filtrar productos inactivos (eliminados lógicamente)
    if (product.active === false) return false

    const t = searchTerm.toLowerCase()
    const desc = (product.description ?? "").toLowerCase()
    return (
      product.name.toLowerCase().includes(t) ||
      product.category.toLowerCase().includes(t) ||
      desc.includes(t)
    )
  })

  const handleAddProduct = async () => {
    if (!checkProfileOrWarn()) return

    if (newProduct.name && newProduct.price && newProduct.stock && newProduct.category) {
      try {
        const savedProduct = await saveProduct({
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock),
          category: newProduct.category,
          description: newProduct.description.trim() || null,
        })
        setNewProduct({ name: "", price: "", stock: "", category: "", description: "" })
        setIsDialogOpen(false)
        await loadProducts() // Recargar la lista

        // Abrir automáticamente el modal de edición para permitir agregar imágenes
        handleOpenEdit(savedProduct)
      } catch (err) {
        console.error("Error al guardar:", err)
        toast.error("Error al guardar el producto")
      }
    }
  }

  const handleDeactivateProduct = async () => {
    if (!deletingProduct) return
    try {
      await deactivateProduct(deletingProduct.id)
      setDeletingProduct(null)
      await loadProducts() // Recargar la lista
    } catch (err) {
      console.error("Error al desactivar:", err)
      toast.error("Error al desactivar el producto")
    }
  }

  // Abrir modal de edición con los datos del producto
  const handleOpenEdit = async (product: Product) => {
    setEditingProduct({ ...product, images: [] })
    setIsEditDialogOpen(true)
    // Cargar imágenes del producto desde la API
    try {
      const images = await fetchProductImages(product.id)
      setEditingProduct(prev => prev ? { ...prev, images } : null)
    } catch (err) {
      console.error("Error al cargar imágenes:", err)
    }
  }

  // Guardar cambios del modal de edición
  const handleSaveEdit = async () => {
    if (editingProduct) {
      try {
        await updateProduct(editingProduct.id, {
          name: editingProduct.name,
          price: editingProduct.price,
          stock: editingProduct.stock,
          category: editingProduct.category,
          description: editingProduct.description?.trim() ? editingProduct.description : null,
        })
        setIsEditDialogOpen(false)
        setEditingProduct(null)
        await loadProducts() // Recargar la lista
      } catch (err) {
        console.error("Error al actualizar:", err)
        toast.error("Error al actualizar el producto")
      }
    }
  }

  // Cancelar edición
  const handleCancelEdit = () => {
    setIsEditDialogOpen(false)
    setEditingProduct(null)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && editingProduct) {
      for (const file of Array.from(files)) {
        try {
          const uploaded = await uploadProductImage(editingProduct.id, file)
          setEditingProduct(prev => prev ? {
            ...prev,
            images: [...(prev.images || []), uploaded],
          } : null)
        } catch (err) {
          console.error("Error al subir imagen:", err)
          toast.error("Error al subir imagen")
        }
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRemoveImage = async (imageId: number) => {
    try {
      await deleteProductImage(imageId)
      if (editingProduct) {
        setEditingProduct({
          ...editingProduct,
          images: (editingProduct.images || []).filter(img => img.id !== imageId),
        })
      }
    } catch (err) {
      console.error("Error al eliminar imagen:", err)
      toast.error("Error al eliminar imagen")
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount)
  }

  const openStorePreviewFromNew = () => {
    setStorePreview({
      name: newProduct.name.trim() || "Sin nombre",
      category: newProduct.category || "—",
      price: Math.max(0, parseFloat(newProduct.price) || 0),
      stock: Math.max(0, parseInt(newProduct.stock, 10) || 0),
      description: newProduct.description.trim() || null,
      images: [],
    })
    setStorePreviewOpen(true)
  }

  const openStorePreviewFromEdit = () => {
    if (!editingProduct) return
    const images = [...(editingProduct.images || [])].sort((a, b) => a.displayOrder - b.displayOrder)
    setStorePreview({
      name: editingProduct.name,
      category: editingProduct.category,
      price: editingProduct.price,
      stock: editingProduct.stock,
      description: editingProduct.description?.trim() || null,
      images,
    })
    setStorePreviewOpen(true)
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-card px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Inventario</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex-1 p-6">

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Inventario</h1>
              <p className="text-muted-foreground">Gestiona tus productos y stock</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={String(sizeLimit)} onValueChange={(val) => setSizeLimit(Number(val))}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Mostrar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Mostrar 10</SelectItem>
                  <SelectItem value="20">Mostrar 20</SelectItem>
                  <SelectItem value="50">Mostrar 50</SelectItem>
                  <SelectItem value="100">Mostrar 100</SelectItem>
                  <SelectItem value="200">Mostrar 200</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                if (open) {
                  if (checkProfileOrWarn()) {
                    setIsDialogOpen(true)
                  }
                } else {
                  setIsDialogOpen(false)
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2" onClick={(e) => {
                    if (!checkProfileOrWarn()) {
                      e.preventDefault()
                    }
                  }}>
                    <Plus className="h-4 w-4" />
                    Agregar Producto
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Agregar Nuevo Producto</DialogTitle>
                    <DialogDescription>
                      Completa los datos del producto y guarda la información.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nombre del producto <span className="text-destructive">*</span></Label>
                      <Input
                        id="name"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        placeholder="Ej: Laptop HP Pavilion"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="price">Precio <span className="text-destructive">*</span></Label>
                        <Input
                          id="price"
                          type="number"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="stock">Stock <span className="text-destructive">*</span></Label>
                        <Input
                          id="stock"
                          type="number"
                          value={newProduct.stock}
                          onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="category">Categoría <span className="text-destructive">*</span></Label>
                      <Select
                        value={newProduct.category}
                        onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {PRODUCT_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Descripción (visible en la tienda)</Label>
                      <Textarea
                        id="description"
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        placeholder="Detalles que verán los clientes al abrir el producto... (opcional)"
                        rows={4}
                        className="min-h-[100px] resize-y"
                      />
                    </div>
                  </div>
                  <DialogFooter className="flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 w-full sm:w-auto"
                      onClick={openStorePreviewFromNew}
                      disabled={!newProduct.name.trim() || !newProduct.category || !newProduct.price || !newProduct.stock}
                    >
                      <Eye className="h-4 w-4" />
                      Vista previa (tienda)
                    </Button>
                    <div className="flex w-full gap-2 justify-end sm:w-auto">
                      <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                      </DialogClose>
                      <Button
                        onClick={handleAddProduct}
                        disabled={!newProduct.name.trim() || !newProduct.price || !newProduct.stock || !newProduct.category}
                      >
                        Agregar
                      </Button>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-6">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Productos ({filteredProducts.length})
                  </CardTitle>
                  <div
                    className={`flex items-center space-x-3 shrink-0 p-2 px-3 rounded-xl border cursor-pointer transition-all duration-300 select-none ${onlyWithImages
                      ? "bg-primary/10 border-primary/40 shadow-[0_0_15px_rgba(var(--primary),0.15)]"
                      : "bg-background/50 border-border hover:border-primary/20 hover:bg-muted/50"
                      }`}
                    onClick={() => setOnlyWithImages(!onlyWithImages)}
                  >
                    <Switch
                      id="images-only-inventory"
                      checked={onlyWithImages}
                      onCheckedChange={() => { }}
                      className="pointer-events-none data-[state=checked]:bg-primary"
                    />
                    <Label
                      htmlFor="images-only-inventory"
                      className={`text-sm font-semibold cursor-pointer flex items-center gap-2 transition-colors duration-300 pointer-events-none ${onlyWithImages ? "text-primary" : "text-muted-foreground"
                        }`}
                    >
                      <ImageIcon className={`size-4 transition-all duration-300 ${onlyWithImages ? "scale-110 drop-shadow-[0_0_5px_rgba(var(--primary),0.5)]" : ""}`} />
                      Solo fotos
                    </Label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar productos..."
                      className="w-full bg-background pl-8 shadow-sm sm:w-[300px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">ID</TableHead>
                      <TableHead className="text-muted-foreground">Producto</TableHead>
                      <TableHead className="text-muted-foreground">Categoría</TableHead>
                      <TableHead className="text-right text-muted-foreground">Precio</TableHead>
                      <TableHead className="text-center text-muted-foreground">Stock</TableHead>
                      <TableHead className="text-center text-muted-foreground">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id} className="border-border">
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold font-mono text-primary">
                            INV-{String(product.id).padStart(3, '0')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{product.name}</span>
                        </TableCell>
                        <TableCell>
                          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
                            {product.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-primary">
                            {formatCurrency(product.price)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex min-w-[3rem] justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${product.stock < 10
                            ? "bg-destructive/20 text-destructive"
                            : product.stock < 20
                              ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                              : "bg-primary/20 text-primary"
                            }`}>
                            {product.stock}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 transition-all duration-200 hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:text-emerald-500 hover:shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                              onClick={() => handleOpenEdit(product)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/20 hover:text-destructive"
                              onClick={() => setDeletingProduct(product)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Modal de edición de producto */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          if (!open) handleCancelEdit()
        }}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" />
                Editar Producto
              </DialogTitle>
              <DialogDescription>
                Modifica los datos del producto y administra sus imágenes.
              </DialogDescription>
              {editingProduct && (
                <p className="text-sm text-muted-foreground">
                  Editando: INV-{String(editingProduct.id).padStart(3, '0')}
                </p>
              )}
            </DialogHeader>
            {editingProduct && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Nombre del producto <span className="text-destructive">*</span></Label>
                  <Input
                    id="edit-name"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    placeholder="Nombre del producto"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-price">Precio (MXN) <span className="text-destructive">*</span></Label>
                    <Input
                      id="edit-price"
                      type="number"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({
                        ...editingProduct,
                        price: Math.max(0, parseFloat(e.target.value) || 0)
                      })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-stock">Stock <span className="text-destructive">*</span></Label>
                    <Input
                      id="edit-stock"
                      type="number"
                      value={editingProduct.stock}
                      onChange={(e) => setEditingProduct({
                        ...editingProduct,
                        stock: Math.max(0, parseInt(e.target.value) || 0)
                      })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Categoría <span className="text-destructive">*</span></Label>
                  <Select
                    value={editingProduct.category}
                    onValueChange={(value) => setEditingProduct({ ...editingProduct, category: value })}
                  >
                    <SelectTrigger id="edit-category">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Descripción (visible en la tienda)</Label>
                  <Textarea
                    id="edit-description"
                    value={editingProduct.description ?? ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    placeholder="Detalles que verán los clientes al abrir el producto... (opcional)"
                    rows={4}
                    className="min-h-[100px] resize-y"
                  />
                </div>

                {/* Sección de imágenes dentro del modal de edición */}
                <div className="grid gap-2">
                  <Label>Imágenes del producto</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    Subir Imagen
                  </Button>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(editingProduct.images || []).length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border py-6 text-center">
                        <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          No hay imágenes
                        </p>
                      </div>
                    ) : (
                      (editingProduct.images || []).map((image) => (
                        <div
                          key={image.id}
                          className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                            {image.displayOrder}
                          </span>
                          <span className="flex-1 truncate text-sm text-foreground">
                            {image.fileName}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/20"
                            onClick={() => handleRemoveImage(image.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-between">
              <Button variant="outline" onClick={handleCancelEdit} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button type="button" variant="secondary" className="gap-2 w-full sm:w-auto" onClick={openStorePreviewFromEdit}>
                  <Eye className="h-4 w-4" />
                  Vista previa (tienda)
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  className="w-full sm:w-auto"
                  disabled={!editingProduct?.name?.trim() || editingProduct?.price === undefined || editingProduct?.stock === undefined || !editingProduct?.category}
                >
                  Guardar Cambios
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={storePreviewOpen}
          onOpenChange={(open) => {
            if (!open) {
              setStorePreviewOpen(false)
              setStorePreview(null)
            }
          }}
        >
          <DialogContent className="max-w-[min(92vw,40rem)] w-full gap-0 overflow-hidden p-0 sm:max-w-[min(92vw,40rem)]">
            <DialogHeader className="sr-only">
              <DialogTitle>Vista previa en la tienda</DialogTitle>
              <DialogDescription>
                Previsualiza cómo se verá el producto en el portal del cliente.
              </DialogDescription>
            </DialogHeader>
            {storePreview && (
              <div className="grid max-h-[min(88vh,36rem)] grid-cols-1 overflow-y-auto sm:grid-cols-[minmax(0,11rem)_1fr] md:grid-cols-[minmax(0,13rem)_1fr]">
                <div className="relative flex min-h-[200px] flex-col items-center justify-center bg-muted p-4 sm:max-h-[min(88vh,36rem)] sm:min-h-0 sm:p-5">
                  {storePreview.images.length > 0 && storePreview.images.some((img) => img?.url || img?.filePath) ? (
                    <div className="relative mx-auto aspect-square w-full max-w-[220px] md:max-w-[13rem]">
                      {(() => {
                        const previewImage = storePreview.images.find((img) => Boolean(img?.url || img?.filePath))
                        return previewImage ? (
                          <Image
                            src={getImageUrl(previewImage)}
                            alt={storePreview.name}
                            fill
                            className="object-contain p-1"
                            sizes="208px"
                            priority
                          />
                        ) : null
                      })()}
                      {storePreview.images.length > 1 && (
                        <span className="absolute bottom-1 right-1 rounded-md bg-background/90 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          +{storePreview.images.length - 1} en la tienda
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ImageIcon className="size-14 opacity-50" />
                      <span className="text-xs">Sin imagen</span>
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Vista previa — portal cliente</p>
                  <div>
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-primary">
                      {storePreview.category}
                    </span>
                    <h2 className="text-lg font-bold leading-snug text-foreground sm:text-xl">{storePreview.name}</h2>
                    <p className="mt-1.5 text-xl font-bold text-primary">{formatCurrency(storePreview.price)}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {storePreview.stock > 0 ? `En stock (${storePreview.stock} disponibles)` : "Sin stock"}
                    </p>
                  </div>
                  {storePreview.description?.trim() ? (
                    <div className="min-w-0">
                      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                        <FileText className="size-4 shrink-0 text-primary" />
                        Descripción
                      </h3>
                      <ScrollArea className="max-h-36 rounded-lg border border-border bg-muted/20">
                        <p className="whitespace-pre-wrap p-3 pr-6 text-sm leading-relaxed text-muted-foreground">
                          {storePreview.description}
                        </p>
                      </ScrollArea>
                    </div>
                  ) : null}
                  <div className="h-px w-full shrink-0 bg-border" />
                  <div className="min-w-0">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Store className="size-4 shrink-0 text-primary" />
                      Información del Proveedor
                    </h3>
                    <div className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/30 p-3 text-sm text-muted-foreground">
                      <div className="flex min-w-0 gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Store className="size-4" />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Tienda</span>
                          <span className="break-words text-sm font-medium text-foreground">{user?.businessName || user?.fullName || "Distribuidor Autorizado BizShop"}</span>
                        </div>
                      </div>
                      <div className="flex min-w-0 gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Phone className="size-4" />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Teléfono</span>
                          <span className="break-all text-sm font-medium text-foreground">{user?.phone || "+52 555 123 4567"}</span>
                        </div>
                      </div>
                      <div className="flex min-w-0 gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Mail className="size-4" />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Contacto</span>
                          <span className="break-all text-sm font-medium text-foreground">{user?.email || "ventas@bizshop.com"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button disabled className="h-10 gap-2 opacity-80">
                    <ShoppingCart className="size-4" />
                    Agregar al carrito
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de confirmación de eliminación (soft delete) */}
        <AlertDialog open={!!deletingProduct} onOpenChange={(open) => {
          if (!open) setDeletingProduct(null)
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                ¿Desactivar producto?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <span className="block">
                  Estás a punto de desactivar{" "}
                  <strong className="text-foreground">{deletingProduct?.name}</strong>.
                </span>
                <span className="block text-yellow-600 dark:text-yellow-400">
                  ⚠️ El producto se ocultará del inventario pero NO se eliminará de la base de datos.
                  Los datos históricos y reportes del dashboard seguirán disponibles.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDeactivateProduct}
              >
                Sí, desactivar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  )
}