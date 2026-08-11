"use client"

// Agrega estos imports arriba
import { Bell } from "lucide-react"
import { useNotifications } from "@/hooks/use-notifications"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Moon,
  Sun,
} from "lucide-react"
import { useTheme } from "next-themes"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getStoredUser, logout, updateStoredUser } from "@/lib/services/authService"
import { fetchAdminProfile, getProfilePhotoUrl } from "@/lib/services/adminService"

import { warmCache, CACHE_KEYS, CACHE_TTL } from "@/lib/api/apiCache"
import { fetchSalesItems } from "@/lib/services/saleService"
import { fetchClientsSummary } from "@/lib/services/clientService"
import { fetchAllProducts } from "@/lib/services/productService"
import { fetchDashboardData } from "@/lib/services/adminService"

const navItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    title: "Inventario",
    icon: Package,
    href: "/inventario",
  },
  {
    title: "Ventas",
    icon: ShoppingCart,
    href: "/ventas",
  },
  {
    title: "Clientes",
    icon: Users,
    href: "/clientes",
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { notifications, unreadCount, markAllAsRead, clearAll, markAsRead } = useNotifications()

  const handleLinkHover = useCallback((href: string) => {
    // 1. Next.js router prefetch
    router.prefetch(href)

    // 2. Pre-warm API cache
    const userData = getStoredUser("admin")
    const adminId = userData?.id

    if (href === "/") {
      warmCache(CACHE_KEYS.DASHBOARD, () => fetchDashboardData(), CACHE_TTL.DASHBOARD)
    } else if (href === "/inventario") {
      warmCache(CACHE_KEYS.PRODUCTOS(50), () => fetchAllProducts(50), CACHE_TTL.PRODUCTOS)
    } else if (href === "/ventas" && adminId) {
      warmCache(CACHE_KEYS.VENTAS(50), () => fetchSalesItems(adminId, 50), CACHE_TTL.VENTAS)
    } else if (href === "/clientes" && adminId) {
      warmCache(CACHE_KEYS.CLIENTES(adminId), () => fetchClientsSummary(adminId), CACHE_TTL.CLIENTES)
    }
  }, [router])
  // Leer datos del usuario desde localStorage
  const [businessName, setBusinessName] = useState("Mi Negocio")
  const [fullName, setFullName] = useState("Administrador")
  const [avatarUrl, setAvatarUrl] = useState("")

  const loadUserData = useCallback(async () => {
    // 1. Leer inmediatamente desde localStorage
    const userData = getStoredUser("admin")
    if (userData) {
      if (userData.businessName && userData.businessName !== "No especificado") {
        setBusinessName(userData.businessName)
      }
      if (userData.fullName && userData.fullName !== "No especificado") {
        setFullName(userData.fullName)
      }
      const photoPath = userData.photo || userData.profilePhotoUrl || userData.profilePhoto || userData.fotoPerfil
      if (photoPath) {
        setAvatarUrl(getProfilePhotoUrl(photoPath))
      }
    }

    // 2. Refrescar datos desde la API de Spring Boot al entrar a la app
    try {
      const profile = await fetchAdminProfile()
      if (profile) {
        const freshName = profile.fullName || userData?.fullName || "Administrador"
        const freshBusiness = profile.businessName || userData?.businessName || ""
        const freshPhoto = profile.photo || profile.profilePhotoUrl || profile.profilePhoto || profile.fotoPerfil || ""

        setFullName(freshName)
        if (freshBusiness) setBusinessName(freshBusiness)
        if (freshPhoto) setAvatarUrl(getProfilePhotoUrl(freshPhoto))

        updateStoredUser({
          fullName: freshName,
          businessName: freshBusiness || undefined,
          photo: freshPhoto || undefined,
          profilePhotoUrl: freshPhoto || undefined,
          profilePhoto: freshPhoto || undefined,
        })
      }
    } catch (err) {
      console.warn("[AppSidebar] No se pudo refrescar perfil desde API:", err)
    }
  }, [])

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
    }
  }, [])

  const handleLogout = () => {
    logout("admin")
    router.push("/login")
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
            <Package className="size-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-foreground">{businessName}</span>
            <span className="text-xs text-muted-foreground">Panel de Control</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href} onMouseEnter={() => handleLinkHover(item.href)}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Configuración" isActive={pathname === "/configuracion"}>
              <Link href="/configuracion">
                <Settings className="size-4" />
                <span>Configuración</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton tooltip="Notificaciones" className="relative">
                  <div className="relative">
                    <Bell className="size-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <span>Notificaciones</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notificaciones</span>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Limpiar todo
                    </button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Sin notificaciones
                  </div>
                ) : (
                  notifications.map(n => (
                    <DropdownMenuItem
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`flex flex-col items-start gap-1 py-3 px-3.5 cursor-pointer transition-all duration-200 focus:bg-muted ${!n.leida
                          ? "bg-primary/5 border-l-2 border-primary"
                          : "border-l-2 border-transparent"
                        }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className={`text-xs font-semibold ${n.tipo === "VENTA_NUEVA" ? "text-primary" :
                            n.tipo === "STOCK_BAJO" ? "text-yellow-500" :
                              "text-blue-500"
                          }`}>
                          {n.tipo === "VENTA_NUEVA" ? "Venta nueva" :
                            n.tipo === "STOCK_BAJO" ? "Stock bajo" : "Cliente nuevo"}
                        </span>
                        {!n.leida && (
                          <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                        )}
                      </div>
                      <span className="text-sm font-medium">{n.mensaje}</span>
                      <span className="text-xs text-muted-foreground">
                        {n.timestamp.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
                {notifications.length > 0 && unreadCount > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={markAllAsRead} className="justify-center text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                      Marcar todas como leídas
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Cerrar sesión" onClick={handleLogout}>
              <LogOut className="size-4" />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Cambiar tema"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span>Cambiar tema</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator className="my-2" />

        <Link href="/configuracion" className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center">
          <Avatar className="size-9">
            <AvatarImage src={avatarUrl || "/avatar-placeholder.png"} alt={fullName} />
            <AvatarFallback className="bg-primary/20 text-primary text-sm uppercase">
              {fullName.substring(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium text-foreground">{fullName}</span>
            <span className="text-xs text-muted-foreground">Administrador</span>
          </div>
        </Link>
      </SidebarFooter>
    </Sidebar>
  )
}

