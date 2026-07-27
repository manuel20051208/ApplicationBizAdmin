"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  User,
  Phone,
  Camera,
  Trash2,
  Edit,
  Plus,
  Shield,
  Upload,
  X,
  Lock,
  Loader2,
  Building2,
} from "lucide-react"
import { PhoneInput } from "@/components/ui/phone-input"
import { getStoredUser, updateStoredUser } from "@/lib/services/authService"
import { fetchAdminProfile, updateAdminProfile, updateProfilePhotoUrl, getProfilePhotoUrl } from "@/lib/services/adminService"

interface UserProfile {
  name: string
  email: string
  phone: string
  businessName: string
  avatar: string | null  // URL de Google OAuth2 o de Cloudinary
}

function ProfilePhoto({
  src,
  alt,
  className = "object-cover",
}: {
  src?: string | null
  alt: string
  className?: string
}) {
  if (!src?.trim()) {
    return <div className={`flex h-full w-full items-center justify-center bg-muted ${className}`} />
  }

  if (src.startsWith("blob:") || src.startsWith("data:")) {
    return <img src={src} alt={alt} className={`h-full w-full ${className}`} />
  }

  return <Image src={src} alt={alt} fill className={className} />
}

export default function ConfiguracionPage() {
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    avatar: null,
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSavingAvatar, setIsSavingAvatar] = useState(false)

  const loadProfilePhoto = async (photoPath?: string | null) => {
    if (photoPath?.startsWith("data:") || photoPath?.startsWith("blob:")) {
      setProfile(prev => ({ ...prev, avatar: photoPath }))
      return
    }

    if (photoPath) {
      const fallbackUrl = getProfilePhotoUrl(photoPath)
      setProfile(prev => ({ ...prev, avatar: fallbackUrl || null }))
      return
    }

    setProfile(prev => ({ ...prev, avatar: null }))
  }

  // Cargar datos del usuario desde localStorage y luego desde la API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const stored = getStoredUser()
        if (stored?.id) {
          const storedPhoto = stored.profilePhoto || stored.fotoPerfil || stored.photo

          const fallbackVal = (val?: string | number | null) => {
            if (val === undefined || val === null) return "No especificado"
            const str = String(val).trim()
            return str === "" || str === "0" || str === "null" || str === "undefined" ? "No especificado" : str
          }

          // Pre-cargar de localStorage inmediatamente (incluyendo la foto si existe)
          // La foto puede ser: URL de Google (profilePhotoUrl) o URL de Cloudinary (profilePhoto)
          const photoUrl = stored.profilePhotoUrl || stored.profilePhoto || stored.fotoPerfil || stored.photo || null
          setProfile(prev => ({
            ...prev,
            name: fallbackVal(stored.fullName),
            email: fallbackVal(stored.email),
            phone: fallbackVal(stored.phone),
            businessName: fallbackVal(stored.businessName),
            avatar: photoUrl || null,
          }))
          setEditName(stored.fullName && stored.fullName !== "No especificado" ? stored.fullName : "")
          setEditPhone(stored.phone && String(stored.phone) !== "No especificado" && String(stored.phone) !== "0" ? String(stored.phone) : "")
          setEditBusinessName(stored.businessName && stored.businessName !== "No especificado" ? stored.businessName : "")

          // Cargar desde la API de Admin
          if (stored.accountType === "ADMIN") {
            try {
              const adminData = await fetchAdminProfile()
              setProfile(prev => ({
                ...prev,
                name: fallbackVal(adminData.fullName || prev.name),
                email: fallbackVal(adminData.email || prev.email),
                phone: fallbackVal(adminData.phone ? String(adminData.phone) : prev.phone),
                businessName: fallbackVal(adminData.businessName || prev.businessName),
              }))
              setEditName(adminData.fullName || stored.fullName || "")
              setEditPhone(adminData.phone ? String(adminData.phone) : stored.phone ? String(stored.phone) : "")
              setEditBusinessName(adminData.businessName || stored.businessName || "")

              // Foto: Google OAuth2 (profilePhotoUrl) tiene prioridad, luego Cloudinary (profilePhoto)
              const apiPhoto = adminData.profilePhotoUrl || adminData.profilePhoto || adminData.photo || adminData.fotoPerfil || null
              if (apiPhoto) {
                setProfile(prev => ({ ...prev, avatar: apiPhoto }))
                updateStoredUser({
                  profilePhotoUrl: apiPhoto,
                  profilePhoto: apiPhoto,
                  photo: apiPhoto,
                  fotoPerfil: apiPhoto,
                })
              }
            } catch (profileErr) {
              console.error("Error al cargar perfil del administrador", profileErr)
              // Show error to user but continue (data from localStorage is already loaded)
              const errorMsg = profileErr instanceof Error ? profileErr.message : "No se pudo cargar el perfil del administrador"
              toast.error(errorMsg)
            }
          }
        }
      } catch (err) {
        console.error("Error al cargar perfil", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()

    return () => undefined
  }, [])

  const [editName, setEditName] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editBusinessName, setEditBusinessName] = useState("")
  const [newPhone, setNewPhone] = useState("")

  const [isEditNameOpen, setIsEditNameOpen] = useState(false)
  const [isEditBusinessNameOpen, setIsEditBusinessNameOpen] = useState(false)
  const [isEditPhoneOpen, setIsEditPhoneOpen] = useState(false)
  const [isAddPhoneOpen, setIsAddPhoneOpen] = useState(false)
  const [isAvatarOpen, setIsAvatarOpen] = useState(false)

  // Estados para Cambio de Contraseña
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [pwdStep, setPwdStep] = useState<"choose" | "sending" | "verify" | "new_password">("choose")
  const [verificationMethod, setVerificationMethod] = useState<"email" | "sms" | null>(null)
  const [verificationCode, setVerificationCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleStartPasswordChange = (method: "email" | "sms") => {
    setVerificationMethod(method)
    setPwdStep("sending")
    setTimeout(() => {
      setPwdStep("verify")
    }, 1500)
  }

  const handleVerifyCode = () => {
    if (verificationCode.length === 6) {
      setPwdStep("new_password")
    } else {
      toast.error("El código debe ser de 6 dígitos")
    }
  }

  const handleSavePassword = () => {
    if (newPassword && newPassword === confirmPassword) {
      toast.success("Contraseña actualizada exitosamente")
      setIsPasswordOpen(false)
      setTimeout(() => {
        setPwdStep("choose")
        setVerificationCode("")
        setNewPassword("")
        setConfirmPassword("")
      }, 500)
    } else {
      toast.error("Las contraseñas no coinciden")
    }
  }

  const handleSaveName = async () => {
    const user = getStoredUser();
    if (!user?.id) return;

    try {
      const updatedProfile = await updateAdminProfile({
        id: user.id,
        fullName: editName,
        email: profile.email,
        phone: Number(profile.phone.replace(/\D/g, "")) || 0,
        businessName: profile.businessName,
      });

      setProfile({ ...profile, name: updatedProfile.fullName });
      updateStoredUser({ fullName: updatedProfile.fullName });
      setIsEditNameOpen(false);
      toast.success("Nombre actualizado");
    } catch (err) {
      console.error("Error al guardar nombre", err);
      toast.error("No se pudo guardar el nombre");
    }
  }

  const handleSaveBusinessName = async () => {
    const user = getStoredUser()
    if (!user?.id) return

    try {
      const updatedProfile = await updateAdminProfile({
        id: user.id,
        fullName: profile.name,
        email: profile.email,
        phone: Number(profile.phone.replace(/\D/g, "")) || 0,
        businessName: editBusinessName,
      })

      setProfile({ ...profile, businessName: updatedProfile.businessName })
      updateStoredUser({ businessName: updatedProfile.businessName })
      window.dispatchEvent(new Event("user-profile-updated"))
      setIsEditBusinessNameOpen(false)
      toast.success("Nombre del negocio actualizado")
    } catch (err) {
      console.error("Error al guardar nombre del negocio", err)
      toast.error("No se pudo guardar el nombre del negocio")
    }
  }

  const savePhoneToApi = async (newPhoneStr: string) => {
    const user = getStoredUser();
    if (!user?.id) return false;

    try {
      // Extraemos solo los dígitos para el campo phone numérico
      const phoneNum = Number(newPhoneStr.replace(/\D/g, '')) || 0;
      const updatedProfile = await updateAdminProfile({
        id: user.id,
        fullName: profile.name,
        email: profile.email,
        phone: phoneNum,
        businessName: profile.businessName,
      });
      setProfile({ ...profile, phone: newPhoneStr });
      updateStoredUser({ phone: updatedProfile.phone });
      return true;
    } catch (err) {
      console.error("Error al guardar teléfono", err);
      toast.error("No se pudo guardar el teléfono");
      return false;
    }
  }

  const handleSavePhone = async () => {
    const success = await savePhoneToApi(editPhone);
    if (success) setIsEditPhoneOpen(false);
  }

  const handleAddPhone = async () => {
    const success = await savePhoneToApi(newPhone);
    if (success) {
      setNewPhone("");
      setIsAddPhoneOpen(false);
    }
  }

  const handleDeletePhone = async () => {
    await savePhoneToApi("");
  }
  // Estado de archivo local seleccionado para subir a Cloudinary
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    const user = getStoredUser()
    if (!user?.id) {
      toast.error("Usuario no autenticado")
      return
    }

    if (!selectedFile) {
      toast.error("Selecciona una foto desde tu dispositivo")
      return
    }

    try {
      setIsSavingAvatar(true)
      const { uploadToCloudinary } = await import("@/lib/services/cloudinaryService")
      const cloudinaryUrl = await uploadToCloudinary(selectedFile)

      const updated = await updateProfilePhotoUrl(cloudinaryUrl)
      const savedPhoto = updated.profilePhotoUrl || updated.profilePhoto || cloudinaryUrl

      setProfile(prev => ({ ...prev, avatar: savedPhoto }))
      updateStoredUser({
        profilePhotoUrl: savedPhoto,
        profilePhoto: savedPhoto,
        photo: savedPhoto,
        fotoPerfil: savedPhoto,
      })
      window.dispatchEvent(new Event("user-profile-updated"))
      toast.success("Foto de perfil actualizada exitosamente")

      setSelectedFile(null)
      setPreviewImage(null)
      setIsAvatarOpen(false)
    } catch (err: any) {
      console.error("Error al guardar avatar:", err)
      const msg = err instanceof Error ? err.message : "No se pudo subir la foto a Cloudinary"
      toast.error(msg)
    } finally {
      setIsSavingAvatar(false)
    }
  }

  const handleDeleteAvatar = async () => {
    try {
      await updateProfilePhotoUrl("")
    } catch {
      // silencioso — limpiamos local igual
    }
    setProfile(prev => ({ ...prev, avatar: null }))
    setSelectedFile(null)
    setPreviewImage(null)
    updateStoredUser({
      profilePhotoUrl: undefined,
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

  const handleDeleteUser = () => {
    toast.success("Usuario eliminado (simulación)")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
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
                <BreadcrumbPage>Configuración</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
            <p className="text-muted-foreground">Administra tu cuenta y preferencias</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Foto de Perfil */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" />
                  Foto de Perfil
                </CardTitle>
                <CardDescription>
                  Tu foto aparecerá en el sidebar y en tu perfil
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="relative h-24 w-24">
                    {profile.avatar ? (
                      <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-border">
                        <ProfilePhoto
                          src={profile.avatar || "/avatar-placeholder.png"}
                          alt={profile.name || "Usuario"}
                        />
                      </div>
                    ) : (
                      <Avatar className="h-24 w-24 border-2 border-border">
                        <AvatarFallback className="bg-primary/20 text-primary text-2xl font-semibold">
                          {getInitials(profile.name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Dialog open={isAvatarOpen} onOpenChange={(open) => {
                      setIsAvatarOpen(open)
                      if (!open) setPreviewImage(null)
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <Edit className="h-4 w-4" />
                          {profile.avatar ? "Modificar" : "Agregar"} Foto
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Foto de Perfil</DialogTitle>
                          <DialogDescription>
                            Selecciona una imagen desde tu dispositivo. Se guardará de forma segura en tu cuenta.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col items-center gap-4 py-4">
                          {/* Preview de la foto */}
                          {(previewImage || profile.avatar) ? (
                            <div className="relative h-32 w-32 overflow-hidden rounded-full border-2 border-border">
                              <ProfilePhoto
                                src={previewImage || profile.avatar}
                                alt="Preview"
                              />
                            </div>
                          ) : (
                            <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full border-2 border-dashed border-border bg-secondary/50">
                              <Camera className="mb-2 h-8 w-8 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Sin foto</span>
                            </div>
                          )}

                          {/* Selección de archivo local */}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
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
                            {selectedFile ? `Archivo: ${selectedFile.name}` : "Seleccionar imagen local"}
                          </Button>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancelar</Button>
                          </DialogClose>
                          <Button
                            onClick={handleSaveAvatar}
                            disabled={isSavingAvatar || !selectedFile}
                          >
                            {isSavingAvatar ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                              </>
                            ) : (
                              "Guardar Foto"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    {profile.avatar && (
                      <Button
                        variant="ghost"
                        className="gap-2 text-destructive hover:bg-destructive/20 hover:text-destructive"
                        onClick={handleDeleteAvatar}
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar Foto
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información del Negocio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Información del Negocio
                </CardTitle>
                <CardDescription>
                  El nombre que aparece en el sidebar y en el portal de clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre del negocio</p>
                    <p className="font-medium">{profile.businessName || "Sin nombre"}</p>
                  </div>
                  <Dialog open={isEditBusinessNameOpen} onOpenChange={setIsEditBusinessNameOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Edit className="h-4 w-4" />
                        Cambiar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cambiar Nombre del Negocio</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="businessName">Nombre del negocio</Label>
                          <Input
                            id="businessName"
                            value={editBusinessName}
                            onChange={(e) => setEditBusinessName(e.target.value)}
                            placeholder="Ej: Mi Tienda S.A."
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancelar</Button>
                        </DialogClose>
                        <Button onClick={handleSaveBusinessName} disabled={!editBusinessName.trim()}>
                          Guardar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Información de Usuario */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Información de Usuario
                </CardTitle>
                <CardDescription>
                  Actualiza tu nombre personal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre</p>
                    <p className="font-medium">{profile.name}</p>
                  </div>
                  <Dialog open={isEditNameOpen} onOpenChange={setIsEditNameOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Edit className="h-4 w-4" />
                        Cambiar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cambiar Nombre de Usuario</DialogTitle>
                        <DialogDescription>
                          Modifica el nombre que verás en tu perfil.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Nuevo nombre</Label>
                          <Input
                            id="name"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancelar</Button>
                        </DialogClose>
                        <Button onClick={handleSaveName}>Guardar</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{profile.email}</p>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                    No editable
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Teléfono */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  Número de Teléfono
                </CardTitle>
                <CardDescription>
                  Gestiona tu número de contacto
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile.phone ? (
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Teléfono</p>
                      <p className="font-medium">{profile.phone}</p>
                    </div>
                    <div className="flex gap-2">
                      <Dialog open={isEditPhoneOpen} onOpenChange={setIsEditPhoneOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Edit className="h-4 w-4" />
                            Editar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Número de Teléfono</DialogTitle>
                            <DialogDescription>
                              Actualiza tu número de contacto.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="phone">Número de teléfono</Label>
                              <PhoneInput
                                id="phone"
                                value={editPhone}
                                onChange={(val) => setEditPhone(val)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancelar</Button>
                            </DialogClose>
                            <Button onClick={handleSavePhone}>Guardar</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-destructive hover:bg-destructive/20 hover:text-destructive"
                        onClick={handleDeletePhone}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Dialog open={isAddPhoneOpen} onOpenChange={setIsAddPhoneOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full gap-2">
                        <Plus className="h-4 w-4" />
                        Agregar Número de Teléfono
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Agregar Número de Teléfono</DialogTitle>
                        <DialogDescription>
                          Agrega un número para que te contacten.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="new-phone">Número de teléfono</Label>
                          <PhoneInput
                            id="new-phone"
                            value={newPhone}
                            onChange={(val) => setNewPhone(val)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancelar</Button>
                        </DialogClose>
                        <Button onClick={handleAddPhone}>Agregar</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>

            {/* Seguridad */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Seguridad
                </CardTitle>
                <CardDescription>
                  Gestiona la contraseña de tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Contraseña</p>
                    <p className="font-medium">••••••••</p>
                  </div>
                  <Dialog open={isPasswordOpen} onOpenChange={(open) => {
                    setIsPasswordOpen(open)
                    if (!open) {
                      setTimeout(() => {
                        setPwdStep("choose")
                        setVerificationCode("")
                        setNewPassword("")
                        setConfirmPassword("")
                      }, 500)
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Edit className="h-4 w-4" />
                        Cambiar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cambiar Contraseña</DialogTitle>
                        <DialogDescription>
                          Revisa tu identidad y actualiza tu contraseña.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        {pwdStep === "choose" && (
                          <div className="flex flex-col gap-4 text-center">
                            <p className="text-sm text-muted-foreground">¿Cómo deseas recibir tu código de verificación?</p>
                            <Button variant="outline" onClick={() => handleStartPasswordChange("email")}>
                              Enviar por Correo ({profile.email})
                            </Button>
                            <Button variant="outline" onClick={() => handleStartPasswordChange("sms")} disabled={!profile.phone}>
                              Enviar por SMS {profile.phone ? `(${profile.phone})` : "(No configurado)"}
                            </Button>
                          </div>
                        )}
                        {pwdStep === "sending" && (
                          <div className="flex flex-col items-center justify-center gap-4 py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Enviando código de verificación...</p>
                          </div>
                        )}
                        {pwdStep === "verify" && (
                          <div className="flex flex-col gap-4 text-center">
                            <p className="text-sm text-muted-foreground">
                              Ingresa el código de 6 dígitos enviado por {verificationMethod === "email" ? "correo" : "SMS"}.
                            </p>
                            <Input
                              placeholder="000000"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value)}
                              maxLength={6}
                              className="text-center text-lg tracking-widest"
                            />
                            <Button onClick={handleVerifyCode}>Verificar</Button>
                          </div>
                        )}
                        {pwdStep === "new_password" && (
                          <div className="flex flex-col gap-4">
                            <div className="space-y-2">
                              <Label>Nueva contraseña</Label>
                              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label>Confirmar contraseña</Label>
                              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                            </div>
                            <Button onClick={handleSavePassword}>Guardar Contraseña</Button>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Zona de Peligro */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Shield className="h-5 w-5" />
                  Zona de Peligro
                </CardTitle>
                <CardDescription>
                  Acciones irreversibles de tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-destructive/50 text-destructive hover:bg-destructive/20 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar Usuario
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente tu cuenta
                        y todos los datos asociados a ella.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteUser}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
