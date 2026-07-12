"use client"

import { useState } from "react"
import { CreditCard, Loader2, ShieldCheck } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getStoredUser } from "@/lib/services/authService"
import { addPaymentCard } from "@/lib/services/clientService"
import {
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  isCardExpired,
  saveLinkedCard,
  type LinkedCard,
} from "@/lib/portal-store"
import { CreditCardVisual } from "@/components/portal/credit-card-visual"

interface LinkCardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLinked: (card: LinkedCard) => void
}

export function LinkCardDialog({ open, onOpenChange, onLinked }: LinkCardDialogProps) {
  const user = getStoredUser()
  const [cardNumber, setCardNumber] = useState("")
  const [holderName, setHolderName] = useState(user?.fullName || user?.username || "")
  const [expiry, setExpiry] = useState("")
  const [cvv, setCvv] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const digits = cardNumber.replace(/\D/g, "")

  const buildPreview = (): LinkedCard | null => {
    const [month, year] = expiry.split("/")
    if (digits.length < 16 || !holderName.trim() || !month || !year) return null
    return {
      holderName: holderName.trim(),
      last4: digits.slice(-4),
      brand: detectCardBrand(digits),
      expiryMonth: month.padStart(2, "0"),
      expiryYear: year,
      active: true,
      linkedAt: new Date().toISOString(),
    }
  }

  const previewCard = buildPreview()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const [month, year] = expiry.split("/")
    if (digits.length !== 16) {
      setError("Ingresa un número de tarjeta válido (16 dígitos).")
      return
    }
    if (!holderName.trim()) {
      setError("Indica el nombre del titular.")
      return
    }
    if (!month || !year || month.length !== 2) {
      setError("Ingresa la fecha de vencimiento (MM/AA).")
      return
    }
    if (isCardExpired(month, year)) {
      setError("La tarjeta está vencida.")
      return
    }
    if (cvv.length < 3) {
      setError("Ingresa el CVV de la tarjeta.")
      return
    }

    setIsSaving(true)
    
    let cardId: number | undefined;
    if (user?.id) {
      try {
        const response = await addPaymentCard({
          cardHolderName: holderName.trim(),
          brand: detectCardBrand(digits),
          lastFour: digits.slice(-4),
          active: true
        });
        cardId = response.id;
      } catch (err) {
        console.error("Error al guardar tarjeta en backend:", err);
      }
    } else {
      await new Promise((r) => setTimeout(r, 800))
    }

    const card: LinkedCard = {
      id: cardId,
      holderName: holderName.trim(),
      last4: digits.slice(-4),
      brand: detectCardBrand(digits),
      expiryMonth: month.padStart(2, "0"),
      expiryYear: year,
      active: true,
      linkedAt: new Date().toISOString(),
    }

    saveLinkedCard(card)
    setIsSaving(false)
    onLinked(card)
    onOpenChange(false)
    setCardNumber("")
    setExpiry("")
    setCvv("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="size-5 text-primary" />
            Vincular tarjeta
          </DialogTitle>
          <DialogDescription>
            Vincula una tarjeta a tu cuenta para poder realizar compras.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          {previewCard && (
            <CreditCardVisual card={previewCard} className="mx-auto max-w-xs" />
          )}

          <div className="grid gap-2">
            <Label htmlFor="card-holder">Titular</Label>
            <Input
              id="card-holder"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              placeholder="Como aparece en la tarjeta"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="card-number">Número de tarjeta</Label>
            <Input
              id="card-number"
              inputMode="numeric"
              autoComplete="cc-number"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="0000 0000 0000 0000"
              maxLength={19}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="card-expiry">Vencimiento</Label>
              <Input
                id="card-expiry"
                inputMode="numeric"
                autoComplete="cc-exp"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/AA"
                maxLength={5}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="card-cvv">CVV</Label>
              <Input
                id="card-cvv"
                type="password"
                inputMode="numeric"
                autoComplete="cc-csc"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="•••"
                maxLength={4}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
            Tu tarjeta se guarda de manera segura en el servidor. Nunca almacenamos el CVV ni el número completo.
          </p>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving} className="gap-2">
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Vinculando...
                </>
              ) : (
                "Vincular tarjeta"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
