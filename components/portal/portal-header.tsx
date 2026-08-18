"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ShoppingBag, Package, Receipt, Settings, LogOut, User, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { getStoredUser, logout, updateStoredUser } from "@/lib/services/authService"
import { fetchClientProfile, fetchClientProfilePhotoBlobUrl } from "@/lib/services/clientService"
import { normalizeGooglePhotoUrl, optimizeCloudinaryUrl } from "@/lib/config"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function PortalHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [clientName, setClientName] = useState("Cliente")
  const [avatarUrl, setAvatarUrl] = useState("")
  const currentHeaderBlobUrlRef = useRef<string | null>(null)

  const loadUserData = async () => {
    const userData = getStoredUser("customer") ?? getStoredUser()
    let photoPath = userData?.profilePhoto || userData?.fotoPerfil || userData?.photo

    if (userData?.fullName && userData.fullName !== "No especificado") {
      setClientName(userData.fullName)
    }

    // El login puede no incluir todos los datos del cliente. El perfil autenticado
    // es la fuente completa y también deja los datos listos para la siguiente carga.
    try {
      const profile = await fetchClientProfile()
      const profileName = profile.fullName?.trim()

      if (profileName) {
        setClientName(profileName)
        updateStoredUser({
          fullName: profileName,
          email: profile.email,
          phone: profile.phone ?? undefined,
          address: profile.address ?? undefined,
          photo: profile.photo ?? undefined,
        })
      }

      if (profile.photo) {
        photoPath = profile.photo
      }
    } catch (err) {
      console.warn("No se pudo cargar el perfil del cliente para el encabezado:", err)
    }

    if (userData || photoPath) {

      if (currentHeaderBlobUrlRef.current) {
        URL.revokeObjectURL(currentHeaderBlobUrlRef.current)
        currentHeaderBlobUrlRef.current = null
      }

      // Si tiene foto de Google (empieza con http/https), la usamos directamente
      if (photoPath?.startsWith("http://") || photoPath?.startsWith("https://")) {
        setAvatarUrl(optimizeCloudinaryUrl(normalizeGooglePhotoUrl(photoPath)))
        return
      }

      try {
        const blobUrl = await fetchClientProfilePhotoBlobUrl()
        if (blobUrl) {
          currentHeaderBlobUrlRef.current = blobUrl
          setAvatarUrl(blobUrl)
          return
        }
      } catch (err) {
        console.error("Error al cargar foto de perfil en header del portal:", err)
      }

      setAvatarUrl("")
    }
  }

  useEffect(() => {
    setMounted(true)
    loadUserData()

    const handleProfileUpdate = () => {
      loadUserData()
    }

    window.addEventListener("user-profile-updated", handleProfileUpdate)
    window.addEventListener("storage", handleProfileUpdate)

    return () => {
      window.removeEventListener("user-profile-updated", handleProfileUpdate)
      window.removeEventListener("storage", handleProfileUpdate)

      if (currentHeaderBlobUrlRef.current) {
        URL.revokeObjectURL(currentHeaderBlobUrlRef.current)
        currentHeaderBlobUrlRef.current = null
      }
    }
  }, [])

  const handleLogout = () => {
    logout("customer")
    router.push("/login")
  }

  const navItems = [
    { label: "Tienda", href: "/portal", icon: Package },
    { label: "Mis Compras", href: "/portal/compras", icon: Receipt },
    { label: "Configuración", href: "/portal/configuracion", icon: Settings },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-2 px-3 sm:h-16 sm:px-6">
        {/* Logo */}
        <Link href="/portal" className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
            <ShoppingBag className="size-5 text-primary-foreground" />
          </div>
          <span className="hidden text-lg font-bold tracking-tight text-foreground sm:inline">BizShop</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
          {/* Theme toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="text-muted-foreground hover:text-foreground"
            >
              <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          )}

          <div className="flex items-center gap-2 rounded-full px-3 py-1.5 bg-muted">
            <Avatar className="size-7">
              <AvatarImage src={avatarUrl} alt={clientName} referrerPolicy="no-referrer" />
              <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-bold uppercase">
                {(clientName || "CL").substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground hidden sm:inline">{clientName}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </div>

      {/* Mobile navigation */}
      <nav
        aria-label="Navegación principal móvil"
        className="fixed inset-x-0 bottom-0 z-[60] flex h-16 items-center justify-around border-t border-border bg-card/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.2)] backdrop-blur-xl md:hidden"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
                className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[10px] font-medium transition-colors ${isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
              <item.icon className={`size-5 ${isActive ? "drop-shadow-[0_0_6px_hsl(var(--primary))]" : ""}`} />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
