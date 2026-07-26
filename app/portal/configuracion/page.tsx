"use client"

import { useEffect, useState, useRef } from "react"
import {
  User, Mail, Phone, MapPin, Lock, Eye, EyeOff,
  Save, Camera, Bell, CreditCard, Shield, Globe,
  X, Trash2, Upload, Loader2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { CreditCardVisual } from "@/components/portal/credit-card-visual"
import { LinkCardDialog } from "@/components/portal/link-card-dialog"
import {
  getLinkedCardRaw,
  removeLinkedCard,
  saveLinkedCard,
  type LinkedCard,
} from "@/lib/portal-store"
import { toast } from "sonner"
import { getStoredUser, updateStoredUser } from "@/lib/services/authService"
import { fetchClientProfilePhotoBlobUrl, uploadClientProfilePhoto, getPaymentCards, updatePaymentCardStatus, fetchClientProfile, updateClientProfile, type PaymentCardResponseDTO } from "@/lib/services/clientService"
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

export default function ConfiguracionClientePage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"perfil" | "pagos" | "seguridad" | "notificaciones">("perfil")
  const [linkedCard, setLinkedCard] = useState<LinkedCard | null>(null)
  const [linkCardOpen, setLinkCardOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSavingAvatar, setIsSavingAvatar] = useState(false)
  const currentAvatarBlobUrlRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isAvatarOpen, setIsAvatarOpen] = useState(false)
  const [dbCards, setDbCards] = useState<PaymentCardResponseDTO[]>([])
  const [isLoadingCards, setIsLoadingCards] = useState(false)

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    avatar: null as string | null,
  })

  const loadProfilePhoto = async (photoPath?: string | null) => {
    if (currentAvatarBlobUrlRef.current) {
      URL.revokeObjectURL(currentAvatarBlobUrlRef.current)
      currentAvatarBlobUrlRef.current = null
    }

    if (photoPath?.startsWith("data:") || photoPath?.startsWith("blob:")) {
      setProfile(prev => ({ ...prev, avatar: photoPath }))
      return
    }

    if (photoPath?.startsWith("http://") || photoPath?.startsWith("https://")) {
      setProfile(prev => ({ ...prev, avatar: photoPath }))
      return
    }

    try {
      const blobUrl = await fetchClientProfilePhotoBlobUrl()
      if (blobUrl) {
        currentAvatarBlobUrlRef.current = blobUrl
        setProfile(prev => ({ ...prev, avatar: blobUrl }))
        return
      }
    } catch (err) {
      console.error("Error al cargar la foto de perfil del cliente:", err)
    }

    setProfile(prev => ({ ...prev, avatar: null }))
  }

  const loadCards = async () => {
    setIsLoadingCards(true)
    try {
      const cards = await getPaymentCards()
      setDbCards(cards)

      const activeCard = cards.find(c => c.active);
      if (activeCard) {
        const existingLocal = getLinkedCardRaw();
        saveLinkedCard({
          id: activeCard.id,
          holderName: activeCard.cardHolderName,
          last4: activeCard.lastFour,
          brand: activeCard.brand as any,
          expiryMonth: existingLocal?.expiryMonth || "12",
          expiryYear: existingLocal?.expiryYear || "28",
          active: true,
          linkedAt: activeCard.createdAt
        });
        setLinkedCard(getLinkedCardRaw());
      } else {
        removeLinkedCard();
        setLinkedCard(null);
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingCards(false)
    }
  }

  useEffect(() => {
    if (activeTab === "pagos") {
      loadCards()
    }
  }, [activeTab])

  useEffect(() => {
    setLinkedCard(getLinkedCardRaw())

    const loadProfile = async () => {
      const fallbackVal = (val?: string | number | null) => {
        if (val === undefined || val === null) return "No especificado"
        const str = String(val).trim()
        return str === "" || str === "0" || str === "null" || str === "undefined" ? "No especificado" : str
      }

      // Pre-cargar desde localStorage mientras llega la API
      const stored = getStoredUser("customer")
      if (stored) {
        setProfile(prev => ({
          ...prev,
          name: fallbackVal(stored.fullName),
          email: fallbackVal(stored.email),
          phone: fallbackVal(stored.phone),
          address: fallbackVal(stored.address),
        }))
      }

      // Cargar datos reales desde la API
      try {
        const data = await fetchClientProfile()
        setProfile(prev => ({
          ...prev,
          name: fallbackVal(data.fullName || prev.name),
          email: fallbackVal(data.email || prev.email),
          phone: fallbackVal(data.phone ? String(data.phone) : prev.phone),
          address: fallbackVal(data.address || prev.address),
        }))
        // Actualizar localStorage con datos frescos
        updateStoredUser({
          fullName: data.fullName,
          email: data.email,
          phone: data.phone ?? undefined,
          address: data.address ?? undefined,
        })
      } catch (err) {
        console.error("Error al cargar perfil del cliente:", err)
      }

      // Cargar foto
      const storedPhoto = stored?.profilePhoto || stored?.fotoPerfil || stored?.photo
      loadProfilePhoto(storedPhoto)
    }

    loadProfile()

    return () => {
      if (currentAvatarBlobUrlRef.current) {
        URL.revokeObjectURL(currentAvatarBlobUrlRef.current)
        currentAvatarBlobUrlRef.current = null
      }
    }
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveAvatar = async () => {
    const user = getStoredUser("customer")
    if (!user) {
      toast.error("Usuario no autenticado")
      return
    }

    try {
      setIsSavingAvatar(true)
      if (selectedFile) {
        await uploadClientProfilePhoto(selectedFile)
        toast.success("Foto de perfil actualizada exitosamente")

        const blobUrl = await fetchClientProfilePhotoBlobUrl()
        if (blobUrl) {
          if (currentAvatarBlobUrlRef.current) {
            URL.revokeObjectURL(currentAvatarBlobUrlRef.current)
          }
          currentAvatarBlobUrlRef.current = blobUrl
          setProfile(prev => ({ ...prev, avatar: blobUrl }))
          updateStoredUser({
            profilePhoto: blobUrl,
            fotoPerfil: blobUrl,
            photo: blobUrl,
          })
        }

        window.dispatchEvent(new Event("user-profile-updated"))
      }

      setPreviewImage(null)
      setSelectedFile(null)
      setIsAvatarOpen(false)
    } catch (err) {
      console.error("Error al guardar avatar:", err)
      toast.error("No se pudo guardar la foto de perfil")
    } finally {
      setIsSavingAvatar(false)
    }
  }

  const handleDeleteAvatar = () => {
    if (currentAvatarBlobUrlRef.current) {
      URL.revokeObjectURL(currentAvatarBlobUrlRef.current)
      currentAvatarBlobUrlRef.current = null
    }

    setProfile(prev => ({ ...prev, avatar: null }))
    setPreviewImage(null)
    setSelectedFile(null)
    updateStoredUser({
      profilePhoto: undefined,
      fotoPerfil: undefined,
      photo: undefined,
    })
    window.dispatchEvent(new Event("user-profile-updated"))
    toast.success("Foto de perfil eliminada")
  }

  const handleRemovePreview = () => {
    setPreviewImage(null)
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getInitials = (name: string) => {
    if (!name) return "CL"
    return name
      .split(" ")
      .map(n => n[0])
      .filter(Boolean)
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: false,
    newProducts: true,
    newsletter: false,
    smsAlerts: true,
    emailAlerts: true,
  })

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updated = await updateClientProfile({
        fullName: profile.name,
        email: profile.email,
        phone: profile.phone ? Number(profile.phone.replace(/\D/g, "")) || null : null,
        address: profile.address || null,
      })
      // Sincronizar estado y localStorage con la respuesta del servidor
      setProfile(prev => ({
        ...prev,
        name: updated.fullName || prev.name,
        email: updated.email || prev.email,
        phone: updated.phone ? String(updated.phone) : prev.phone,
        address: updated.address || prev.address,
      }))
      updateStoredUser({
        fullName: updated.fullName,
        email: updated.email,
        phone: updated.phone ?? undefined,
        address: updated.address ?? undefined,
      })
      toast.success("Perfil actualizado correctamente")
    } catch (err) {
      console.error("Error al guardar perfil:", err)
      toast.error("No se pudo guardar el perfil")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePassword = async () => {
    if (!security.newPassword) {
      toast.error("Escribe la nueva contraseña")
      return
    }
    if (security.newPassword !== security.confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }
    setIsSaving(true)
    try {
      await updateClientProfile({
        fullName: profile.name,
        email: profile.email,
        password: security.newPassword,
        phone: profile.phone ? Number(profile.phone.replace(/\D/g, "")) || null : null,
        address: profile.address || null,
      })
      setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" })
      toast.success("Contraseña actualizada correctamente")
    } catch (err) {
      console.error("Error al cambiar contraseña:", err)
      toast.error("No se pudo actualizar la contraseña")
    } finally {
      setIsSaving(false)
    }
  }

  const tabs = [
    { id: "perfil" as const, label: "Mi Perfil", icon: User },
    { id: "pagos" as const, label: "Pagos", icon: CreditCard },
    { id: "seguridad" as const, label: "Seguridad", icon: Shield },
    { id: "notificaciones" as const, label: "Notificaciones", icon: Bell },
  ]

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Administra tu perfil y preferencias
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar tabs */}
        <div className="flex flex-row gap-2 lg:flex-col">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all text-left border ${isActive
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-card text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
                  }`}
              >
                <tab.icon className="size-4 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* ============ PERFIL ============ */}
          {activeTab === "perfil" && (
            <>
              {/* Avatar section */}
              <Card className="border border-border bg-card">
                <CardContent className="flex items-center gap-6 p-6">
                  <div className="relative h-20 w-20">
                    {profile.avatar ? (
                      <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-2 border-border">
                        <img
                          src={profile.avatar}
                          alt={profile.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xl font-bold uppercase border-2 border-border">
                        {getInitials(profile.name)}
                      </div>
                    )}
                    <Dialog open={isAvatarOpen} onOpenChange={(open) => {
                      setIsAvatarOpen(open)
                      if (!open) setPreviewImage(null)
                    }}>
                      <DialogTrigger asChild>
                        <button className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-muted border-2 border-card hover:bg-secondary transition-colors">
                          <Camera className="size-3.5 text-primary" />
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Foto de Perfil</DialogTitle>
                          <DialogDescription>
                            Sube o cambia tu foto de perfil.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col items-center gap-4 py-4">
                          {previewImage ? (
                            <div className="relative">
                              <div className="relative h-32 w-32 overflow-hidden rounded-full border-2 border-border">
                                <img
                                  src={previewImage}
                                  alt="Preview"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -right-1 -top-1 h-6 w-6"
                                onClick={handleRemovePreview}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : profile.avatar ? (
                            <div className="relative h-32 w-32 overflow-hidden rounded-full border-2 border-border">
                              <img
                                src={profile.avatar}
                                alt={profile.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div
                              className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed border-border bg-secondary/50 transition-colors hover:border-primary hover:bg-secondary"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Camera className="mb-2 h-8 w-8 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Subir foto</span>
                            </div>
                          )}

                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                          />

                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="gap-2"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Upload className="h-4 w-4" />
                              {previewImage || profile.avatar ? "Cambiar" : "Subir"} Archivo
                            </Button>
                            {(previewImage || profile.avatar) && (
                              <Button
                                type="button"
                                variant="ghost"
                                className="gap-2 text-destructive hover:bg-destructive/20 hover:text-destructive"
                                onClick={() => {
                                  handleRemovePreview()
                                  if (profile.avatar) handleDeleteAvatar()
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                Eliminar
                              </Button>
                            )}
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancelar</Button>
                          </DialogClose>
                          <Button onClick={handleSaveAvatar} disabled={isSavingAvatar || (!previewImage && !profile.avatar)}>
                            {isSavingAvatar ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                              </>
                            ) : (
                              "Guardar"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{profile.name}</h2>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                    <p className="text-xs mt-1 text-muted-foreground/60">
                      Miembro de BizShop
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Personal info */}
              <Card className="border border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">Información Personal</CardTitle>
                  <CardDescription>Tus datos personales y de contacto</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Nombre completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input className="pl-10" value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Correo electrónico</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input className="pl-10" value={profile.email}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-sm font-medium">Teléfono</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input className="pl-10" value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Address */}
              <Card className="border border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">Dirección de Envío</CardTitle>
                  <CardDescription>Dirección predeterminada para tus pedidos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Dirección</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input className="pl-10" value={profile.address}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button className="gap-2 px-8" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <><span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> Guardando...</>
                  ) : (
                    <><Save className="size-4" /> Guardar Cambios</>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* ============ PAGOS ============ */}
          {activeTab === "pagos" && (
            <>
              <Card className="border border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                    <CreditCard className="size-5 text-primary" />
                    Mis Tarjetas
                  </CardTitle>
                  <CardDescription>
                    Administra tus tarjetas de crédito y débito. Activa la tarjeta que deseas usar para tus compras.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoadingCards ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="animate-spin size-8 text-muted-foreground" />
                    </div>
                  ) : dbCards.length > 0 ? (
                    <div className="space-y-4">
                      {dbCards.map((card) => (
                        <div key={card.id} className="flex flex-col sm:flex-row items-center justify-between p-4 border rounded-xl gap-4">
                          <div className="flex items-center gap-4">
                            <div className={`flex size-12 shrink-0 items-center justify-center rounded-lg ${card.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                              <CreditCard className="size-6" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">
                                {card.brand ? card.brand.toUpperCase() : "TARJETA"} terminada en {card.lastFour}
                              </p>
                              <p className="text-sm text-muted-foreground">{card.cardHolderName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`status-${card.id}`} className="text-sm cursor-pointer">
                                {card.active ? "Activa" : "Inactiva"}
                              </Label>
                              <Switch
                                id={`status-${card.id}`}
                                checked={card.active}
                                onCheckedChange={async (val) => {
                                  try {
                                    await updatePaymentCardStatus(card.id, val)
                                    toast.success(val ? "Tarjeta activada" : "Tarjeta desactivada")
                                    loadCards()
                                  } catch (e) {
                                    toast.error("Error al actualizar la tarjeta")
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-end pt-4">
                        <Button className="gap-2" onClick={() => setLinkCardOpen(true)}>
                          <CreditCard className="size-4" />
                          Agregar nueva tarjeta
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 py-6 text-center">
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                        <CreditCard className="size-7 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        No tienes ninguna tarjeta guardada en tu cuenta.
                      </p>
                      <Button className="gap-2" onClick={() => setLinkCardOpen(true)}>
                        <CreditCard className="size-4" />
                        Vincular tarjeta
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <LinkCardDialog
                open={linkCardOpen}
                onOpenChange={setLinkCardOpen}
                onLinked={(card) => {
                  loadCards()
                }}
              />
            </>
          )}

          {/* ============ SEGURIDAD ============ */}
          {activeTab === "seguridad" && (
            <>
              <Card className="border border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">Cambiar Contraseña</CardTitle>
                  <CardDescription>Actualiza tu contraseña para mantener tu cuenta segura</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 max-w-md">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Contraseña actual</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type={showPassword ? "text" : "password"} className="pl-10 pr-10"
                        placeholder="••••••••" value={security.currentPassword}
                        onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Nueva contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="password" className="pl-10" placeholder="••••••••"
                        value={security.newPassword}
                        onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Confirmar nueva contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="password" className="pl-10" placeholder="••••••••"
                        value={security.confirmPassword}
                        onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Remove hardcoded Metodos de Pago in Seguridad because we now use the Pagos tab */}

              <div className="flex justify-end">
                <Button className="gap-2 px-8" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <><span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> Guardando...</>
                  ) : (
                    <><Save className="size-4" /> Guardar Cambios</>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* ============ NOTIFICACIONES ============ */}
          {activeTab === "notificaciones" && (
            <>
              <Card className="border border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">Preferencias de Notificación</CardTitle>
                  <CardDescription>Elige qué notificaciones deseas recibir</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                  {[
                    { key: "orderUpdates", label: "Actualizaciones de pedidos", desc: "Recibe alertas cuando tu pedido cambie de estado" },
                    { key: "promotions", label: "Promociones y ofertas", desc: "Entérate de descuentos especiales y ofertas exclusivas" },
                    { key: "newProducts", label: "Nuevos productos", desc: "Sé el primero en conocer nuevos productos en la tienda" },
                    { key: "newsletter", label: "Boletín semanal", desc: "Resumen semanal de lo más destacado en BizShop" },
                  ].map((item, i) => (
                    <div key={item.key}>
                      <div className="flex items-center justify-between rounded-xl p-4 hover:bg-muted transition-colors">
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.label}</p>
                          <p className="text-xs mt-0.5 text-muted-foreground">{item.desc}</p>
                        </div>
                        <Switch
                          checked={notifications[item.key as keyof typeof notifications]}
                          onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                        />
                      </div>
                      {i < 3 && <Separator />}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">Canales de Notificación</CardTitle>
                  <CardDescription>Elige cómo recibir tus notificaciones</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                  {[
                    { key: "emailAlerts", label: "Notificaciones por email", desc: "Recibe alertas en tu correo electrónico" },
                    { key: "smsAlerts", label: "Notificaciones por SMS", desc: "Recibe mensajes de texto con las actualizaciones" },
                  ].map((item, i) => (
                    <div key={item.key}>
                      <div className="flex items-center justify-between rounded-xl p-4 hover:bg-muted transition-colors">
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.label}</p>
                          <p className="text-xs mt-0.5 text-muted-foreground">{item.desc}</p>
                        </div>
                        <Switch
                          checked={notifications[item.key as keyof typeof notifications]}
                          onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                        />
                      </div>
                      {i < 1 && <Separator />}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button className="gap-2 px-8" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <><span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> Guardando...</>
                  ) : (
                    <><Save className="size-4" /> Guardar Preferencias</>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
