"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ShoppingBag, Package, Receipt, Settings, LogOut, User, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { getStoredUser, logout } from "@/lib/services/authService"
import { fetchClientProfilePhotoBlobUrl } from "@/lib/services/clientService"
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
    const userData = getStoredUser("customer")
    if (userData) {
      setClientName(userData.fullName || "Cliente")

      if (currentHeaderBlobUrlRef.current) {
        URL.revokeObjectURL(currentHeaderBlobUrlRef.current)
        currentHeaderBlobUrlRef.current = null
      }

      // Si tiene foto de Google (empieza con http/https), la usamos directamente
      const photoPath = userData.profilePhoto || userData.fotoPerfil || userData.photo
      if (photoPath?.startsWith("http://") || photoPath?.startsWith("https://")) {
        setAvatarUrl(photoPath)
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
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6">
        {/* Logo */}
        <Link href="/portal" className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
            <ShoppingBag className="size-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">BizShop</span>
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
        <div className="flex items-center gap-3">
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
              <AvatarImage src={avatarUrl} alt={clientName} />
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
      <div className="flex md:hidden items-center gap-1 px-4 pb-3 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${isActive
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
                }`}
            >
              <item.icon className="size-3.5" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </header>
  )
}
