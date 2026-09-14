"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { PackageOpen, Plus, Search, Pencil, Trash2, Upload, ImageIcon } from "lucide-react"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"
import { formatCurrency } from "@/lib/format"
import { useDebounce } from "@/hooks/use-debounce"
import {
  deactivateShProduct, fetchShProductImages, fetchShProducts, getShImageUrl, saveShProduct,
  updateShProduct, uploadShProductImage, type ShProduct, type ShProductPayload,
} from "@/lib/services/shProductService"

const categories = ["Electrónica", "Tecnología", "Computadoras", "Celulares", "Audio", "Ropa", "Hogar", "Muebles", "Deportes", "Gaming", "Otro"]
const conditions = ["Como nuevo", "Excelente", "Bueno", "Aceptable"]
const emptyForm: ShProductPayload = { name: "", price: 0, stock: 1, category: "", description: "", timeOfUse: "", levelOfSecondHandProduct: "Bueno", active: true }

export default function SegundaManoPage() {
  const [products, setProducts] = useState<ShProduct[]>([])
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ShProduct | null>(null)
  const [form, setForm] = useState<ShProductPayload>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<ShProduct | null>(null)
  const [selected, setSelected] = useState<ShProduct | null>(null)

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      setProducts(await fetchShProducts(debouncedSearch))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar los productos")
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => { loadProducts() }, [loadProducts])

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm }); setDialogOpen(true) }
  const openEdit = (product: ShProduct) => {
    setEditing(product)
    setForm({ name: product.name, price: product.price, stock: product.stock, category: product.category, description: product.description || "", timeOfUse: String(product.timeOfUse || ""), levelOfSecondHandProduct: product.levelOfSecondHandProduct || "Bueno", active: product.active })
    setDialogOpen(true)
  }
  const setField = <K extends keyof ShProductPayload>(key: K, value: ShProductPayload[K]) => setForm((current) => ({ ...current, [key]: value }))

  const submit = async () => {
    if (!form.name.trim() || !form.category || form.price < 0 || form.stock < 0) { toast.error("Completa nombre, categoría, precio y stock"); return }
    try {
      setSaving(true)
      const product = editing ? await updateShProduct(editing.id, form) : await saveShProduct(form)
      setProducts((current) => editing ? current.map((item) => item.id === product.id ? { ...item, ...product } : item) : [product, ...current])
      setDialogOpen(false)
      toast.success(editing ? "Producto actualizado" : "Producto creado")
    } catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo guardar") } finally { setSaving(false) }
  }

  const handleDeactivate = async () => {
    if (!deleting) return
    try {
      const updated = await deactivateShProduct(deleting)
      setProducts((current) => current.map((item) => item.id === updated.id ? updated : item))
      toast.success("Producto desactivado")
    } catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo desactivar") } finally { setDeleting(null) }
  }

  const activeCount = useMemo(() => products.filter((product) => product.active !== false).length, [products])

  return <SidebarProvider><AppSidebar /><SidebarInset>
    <header className="flex h-14 items-center gap-2 border-b border-border px-4">
      <SidebarTrigger className="-ml-1" /><Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbPage>Productos de segunda mano</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
    </header>
    <main className="flex-1 space-y-5 p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-muted-foreground">Administra publicaciones usadas, su estado y sus imágenes.</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Productos de segunda mano</h1></div><Button onClick={openCreate} className="gap-2"><Plus className="size-4" />Nuevo producto</Button></div>
      <div className="grid gap-3 sm:grid-cols-3"><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Publicaciones visibles</p><p className="mt-1 text-2xl font-bold">{activeCount}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Resultados actuales</p><p className="mt-1 text-2xl font-bold">{products.length}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Inventario total</p><p className="mt-1 text-2xl font-bold">{products.reduce((sum, item) => sum + item.stock, 0)}</p></CardContent></Card></div>
      <div className="relative max-w-xl"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre o categoría..." className="pl-9" /></div>
      {loading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-64 animate-pulse rounded-xl bg-muted" />)}</div> : products.length === 0 ? <div className="rounded-xl border border-dashed border-border py-16 text-center"><PackageOpen className="mx-auto size-12 text-muted-foreground/50" /><p className="mt-3 font-medium">Aún no tienes productos de segunda mano</p><p className="mt-1 text-sm text-muted-foreground">Crea la primera publicación para verla en el portal.</p></div> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{products.map((product) => <Card key={product.id} className="overflow-hidden"><div className="relative flex h-44 items-center justify-center bg-muted/50">{product.imageUrl ? <Image src={getShImageUrl(product.imageUrl)} alt={product.name} fill className="object-contain p-3" sizes="(max-width: 640px) 92vw, 30vw" /> : <ImageIcon className="size-12 text-muted-foreground/40" />}<span className={`absolute right-3 top-3 rounded-full px-2 py-1 text-[10px] font-semibold ${product.active === false ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"}`}>{product.active === false ? "Inactivo" : "Activo"}</span></div><CardContent className="space-y-3 p-4"><div><p className="text-[10px] font-semibold uppercase tracking-wide text-primary">{product.category}</p><h2 className="mt-1 line-clamp-1 font-semibold">{product.name}</h2><p className="mt-1 text-lg font-bold">{formatCurrency(product.price)}</p></div><div className="flex items-center justify-between text-xs text-muted-foreground"><span>Stock: {product.stock}</span><span>{product.levelOfSecondHandProduct}</span></div><div className="flex gap-2"><Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => openEdit(product)}><Pencil className="size-3.5" />Editar</Button><Button variant="outline" size="sm" className="gap-1.5" onClick={() => setSelected(product)}><Upload className="size-3.5" />Fotos</Button><Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(product)}><Trash2 className="size-4" /></Button></div></CardContent></Card>)}</div>}
    </main>

    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{editing ? "Editar producto" : "Nuevo producto de segunda mano"}</DialogTitle></DialogHeader><div className="grid gap-4 py-2 sm:grid-cols-2"><div className="space-y-2 sm:col-span-2"><Label>Nombre</Label><Input value={form.name} onChange={(event) => setField("name", event.target.value)} placeholder="Ej. iPhone 13 usado" /></div><div className="space-y-2"><Label>Precio</Label><Input type="number" min="0" value={form.price} onChange={(event) => setField("price", Number(event.target.value))} /></div><div className="space-y-2"><Label>Stock</Label><Input type="number" min="0" value={form.stock} onChange={(event) => setField("stock", Number(event.target.value))} /></div><div className="space-y-2"><Label>Categoría</Label><Select value={form.category} onValueChange={(value) => setField("category", value)}><SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger><SelectContent>{categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Estado</Label><Select value={form.levelOfSecondHandProduct} onValueChange={(value) => setField("levelOfSecondHandProduct", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{conditions.map((condition) => <SelectItem key={condition} value={condition}>{condition}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2 sm:col-span-2"><Label>Tiempo de uso</Label><Input value={form.timeOfUse || ""} onChange={(event) => setField("timeOfUse", event.target.value)} placeholder="Ej. 1 año" /></div><div className="space-y-2 sm:col-span-2"><Label>Descripción</Label><Textarea value={form.description || ""} onChange={(event) => setField("description", event.target.value)} rows={4} placeholder="Describe el estado y los detalles del producto" /></div></div><DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button onClick={submit} disabled={saving}>{saving ? "Guardando..." : "Guardar producto"}</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}><DialogContent><DialogHeader><DialogTitle>Imágenes de {selected?.name}</DialogTitle></DialogHeader>{selected && <ShImages product={selected} onChanged={async () => { const images = await fetchShProductImages(selected.id); setSelected((current) => current ? { ...current, images } : current) }} />}</DialogContent></Dialog>
    <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Desactivar publicación?</AlertDialogTitle><AlertDialogDescription>Se ocultará del catálogo, pero conservarás la información de la venta y la publicación.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeactivate}>Desactivar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </SidebarInset></SidebarProvider>
}

function ShImages({ product, onChanged }: { product: ShProduct; onChanged: () => Promise<void> }) {
  const [images, setImages] = useState(product.images || [])
  const [uploading, setUploading] = useState(false)
  useEffect(() => { fetchShProductImages(product.id).then(setImages).catch(() => setImages([])) }, [product.id])
  const upload = async (file?: File) => { if (!file) return; try { setUploading(true); const image = await uploadShProductImage(product.id, file); setImages((current) => [...current, image]); await onChanged(); toast.success("Imagen subida") } catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo subir") } finally { setUploading(false) } }
  return <div className="space-y-4"><label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground hover:bg-muted/50"><Upload className="size-4" />{uploading ? "Subiendo..." : "Seleccionar imagen"}<input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(event) => upload(event.target.files?.[0])} /></label>{images.length === 0 ? <p className="py-5 text-center text-sm text-muted-foreground">Sin imágenes cargadas.</p> : <div className="grid grid-cols-3 gap-2">{images.map((image) => <div key={image.id} className="relative aspect-square overflow-hidden rounded-lg bg-muted"><Image src={getShImageUrl(image)} alt={image.fileName || product.name} fill className="object-cover" sizes="120px" /></div>)}</div>}</div>
}
