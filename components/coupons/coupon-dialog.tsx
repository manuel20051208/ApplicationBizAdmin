"use client"

import { useMemo, useState } from "react"
import { Ticket, Mail, Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface CouponProductOption {
  id: string | number
  name: string
}

interface CouponDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products?: CouponProductOption[]
  recipientEmail?: string
}

export function CouponDialog({ open, onOpenChange, products = [], recipientEmail }: CouponDialogProps) {
  const [code, setCode] = useState("")
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [discountValue, setDiscountValue] = useState("")
  const [appliesTo, setAppliesTo] = useState("all")
  const [expiresAt, setExpiresAt] = useState("")
  const [email, setEmail] = useState(recipientEmail ?? "")

  const productOptions = useMemo(() => products.filter((product) => product.name.trim()), [products])

  const reset = () => {
    setCode("")
    setDiscountType("percentage")
    setDiscountValue("")
    setAppliesTo("all")
    setExpiresAt("")
    setEmail(recipientEmail ?? "")
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  const handleSubmit = () => {
    const normalizedCode = code.trim().toUpperCase()
    const value = Number(discountValue)
    if (!normalizedCode || !Number.isFinite(value) || value <= 0 || !expiresAt) {
      toast.error("Completa el código, descuento y fecha de expiración")
      return
    }
    if (discountType === "percentage" && value > 100) {
      toast.error("El porcentaje no puede superar el 100%")
      return
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Escribe un correo válido")
      return
    }

    const raw = localStorage.getItem("biz-coupons")
    const coupons = raw ? JSON.parse(raw) : []
    coupons.push({
      id: crypto.randomUUID(),
      code: normalizedCode,
      discountType,
      discountValue: value,
      productId: appliesTo === "all" ? null : appliesTo,
      expiresAt,
      recipientEmail: email || null,
      createdAt: new Date().toISOString(),
    })
    localStorage.setItem("biz-coupons", JSON.stringify(coupons))
    toast.success(email ? "Cupón preparado para enviar" : "Cupón creado correctamente")
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {email ? <Mail className="size-5 text-primary" /> : <Ticket className="size-5 text-primary" />}
            {email ? "Enviar cupón de descuento" : "Crear cupón de descuento"}
          </DialogTitle>
          <DialogDescription>
            Define el descuento, los productos aplicables y el tiempo de vigencia.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {recipientEmail !== undefined && (
            <div className="grid gap-2">
              <Label htmlFor="coupon-email">Correo del cliente</Label>
              <Input id="coupon-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="cliente@correo.com" />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="coupon-code">Código</Label>
            <Input id="coupon-code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="BIENVENIDO20" maxLength={30} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select value={discountType} onValueChange={(value: "percentage" | "fixed") => setDiscountType(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                  <SelectItem value="fixed">Valor fijo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="coupon-value">Descuento</Label>
              <Input id="coupon-value" type="number" min="1" value={discountValue} onChange={(event) => setDiscountValue(event.target.value)} placeholder={discountType === "percentage" ? "20" : "50000"} />
            </div>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Aplicar a</Label>
              <Button
                type="button"
                size="sm"
                variant={appliesTo === "all" ? "default" : "outline"}
                className="h-7 rounded-full px-3 text-xs"
                onClick={() => setAppliesTo("all")}
              >
                Todos
              </Button>
            </div>
            <Select value={appliesTo} onValueChange={setAppliesTo}>
              <SelectTrigger><SelectValue placeholder="Selecciona productos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los productos</SelectItem>
                {productOptions.map((product) => <SelectItem key={String(product.id)} value={String(product.id)}>{product.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="coupon-expires">Fecha de expiración</Label>
            <Input id="coupon-expires" type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} className="gap-2">
            {email ? <Send className="size-4" /> : <Ticket className="size-4" />}
            {email ? "Preparar envío" : "Crear cupón"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
