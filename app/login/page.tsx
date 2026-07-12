"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Package, ShoppingBag, Mail, Lock, User, Eye, EyeOff, ArrowRight, Shield, Store, Building2, Sun, Moon } from "lucide-react"
import { PhoneInput } from "@/components/ui/phone-input"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getNetworkErrorMessage, isNetworkOrApiDown } from "@/lib/api-errors"
import {
  loginAndSave,
  registerAndSave,
  updateStoredUser,
  type AuthRole,
} from "@/lib/services/authService"
import { fetchAdminProfile } from "@/lib/services/adminService"
import { fetchClientProfile } from "@/lib/services/clientService"
import { getStoredUser, isSessionExpired } from "@/lib/auth/session"

type Role = "admin" | "customer"

export default function LoginPage() {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [role, setRole] = useState<Role | null>(null)
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => { 
    setMounted(true)
    
    // Si el usuario ya está autenticado, redirigirlo a su respectivo portal
    const user = getStoredUser();
    if (user && user.token && !isSessionExpired(user)) {
      if (user.role === "admin") {
        router.push("/");
      } else {
        router.push("/portal");
      }
    }
  }, [router])

  const [formData, setFormData] = useState({
    name: "",
    nameBusiness: "",
    email: "",
    password: "",
    phone: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const authRole = role as AuthRole

      if (isLogin) {
        // Ambos roles usan email como identificador
        await loginAndSave(
          authRole,
          {
            identifier: formData.email,
            password: formData.password,
          },
          formData
        )
      } else {
        if (role === "admin") {
          await registerAndSave(
            authRole,
            {
              password: formData.password,
              fullName: formData.name,
              email: formData.email,
              phone: Number(formData.phone.replace(/\D/g, "") || 0),
              businessName: formData.nameBusiness,
            },
            formData
          )
        } else {
          await registerAndSave(
            authRole,
            {
              password: formData.password,
              fullName: formData.name,
              email: formData.email,
              phone: Number(formData.phone.replace(/\D/g, "") || 0),
              businessName: "",
            },
            formData
          )
        }
      }

      if (role === "admin") {
        // Cargar foto de perfil del admin y guardarla antes de redirigir
        try {
          const adminData = await fetchAdminProfile()
          const apiPhoto = adminData.photo || adminData.profilePhoto || adminData.fotoPerfil
          if (apiPhoto) {
            updateStoredUser({
              profilePhoto: apiPhoto,
              fotoPerfil: apiPhoto,
              photo: apiPhoto,
            })
          }
        } catch {
          // Si falla la carga de foto, igual redirigimos
        }
        router.push("/")
      } else {
        // Cargar datos del perfil del cliente antes de redirigir
        try {
          const clientData = await fetchClientProfile()
          updateStoredUser({
            fullName: clientData.fullName,
            email: clientData.email,
            phone: clientData.phone ?? undefined,
            address: clientData.address ?? undefined,
            photo: clientData.photo ?? undefined,
            profilePhoto: clientData.photo ?? undefined,
            fotoPerfil: clientData.photo ?? undefined,
          })
        } catch {
          // Si falla, igual redirigimos
        }
        router.push("/portal")
      }
    } catch (error) {
      const message = isNetworkOrApiDown(error)
        ? getNetworkErrorMessage()
        : error instanceof Error
          ? error.message
          : getNetworkErrorMessage()
      alert(message)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: "", nameBusiness: "", email: "", password: "", phone: "" })
    setIsLogin(true)
    setShowPassword(false)
  }

  // ——— Role Selection Screen ———
  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden bg-background">
        {/* Theme toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="fixed top-4 right-4 z-50 text-muted-foreground hover:text-foreground"
          >
            <Sun className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        )}

        <div className="relative w-full max-w-lg">
          {/* Header */}
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Bienvenido</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Selecciona cómo deseas ingresar
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Admin Card */}
            <button
              onClick={() => { setRole("admin"); resetForm() }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:border-primary focus:outline-none"
            >
              <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-primary/5 to-transparent" />

              <div className="relative">
                <div className="mb-4 flex size-14 items-center justify-center rounded-xl bg-primary">
                  <Shield className="size-7 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Administrador</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Accede al panel de control para gestionar inventario, ventas y clientes.
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary">
                  Continuar
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </button>

            {/* Customer Card */}
            <button
              onClick={() => { setRole("customer"); resetForm() }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:border-primary focus:outline-none"
            >
              <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-primary/5 to-transparent" />

              <div className="relative">
                <div className="mb-4 flex size-14 items-center justify-center rounded-xl bg-primary">
                  <Store className="size-7 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Cliente</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Consulta tus compras, pedidos y estado de entregas.
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary">
                  Continuar
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ——— Config per role ———
  const isAdmin = role === "admin"
  const Icon = isAdmin ? Package : ShoppingBag
  const title = isAdmin ? "BizAdmin" : "BizShop"
  const subtitle = isAdmin ? "Panel de Administración" : "Portal de Clientes"

  // ——— Login / Register Form ———
  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Theme toggle */}
      {mounted && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="fixed top-4 right-4 z-50 text-muted-foreground hover:text-foreground"
        >
          <Sun className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      )}

      <div className="relative w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => { setRole(null); resetForm() }}
          className="mb-6 flex items-center gap-1.5 text-sm font-medium transition-colors text-muted-foreground hover:text-primary"
        >
          <ArrowRight className="size-4 rotate-180" />
          Cambiar tipo de cuenta
        </button>

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex size-16 items-center justify-center rounded-2xl shadow-lg bg-primary">
            <Icon className="size-8 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <Card className="border border-border bg-card shadow-2xl">
          <CardHeader className="space-y-1 text-center pb-4">
            <CardTitle className="text-xl text-foreground">
              {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? `Ingresa tus credenciales ${isAdmin ? "de administrador" : "de cliente"}`
                : `Registra tu cuenta ${isAdmin ? "de administrador" : "de cliente"}`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ---- CAMPOS SOLO PARA REGISTRO ---- */}
              {!isLogin && isAdmin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Nombre completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Tu nombre completo"
                        className="pl-10"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nameBusiness" className="text-sm font-medium">Nombre del negocio</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="nameBusiness"
                        type="text"
                        placeholder="Ej: Mi Tienda S.A."
                        className="pl-10"
                        value={formData.nameBusiness}
                        onChange={(e) => setFormData({ ...formData, nameBusiness: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {!isLogin && !isAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Nombre completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Tu nombre"
                      className="pl-10"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}

              {/* ---- CAMPO EMAIL (siempre visible para ambos roles) ---- */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>



              {/* Phone field (register only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Teléfono</Label>
                  <PhoneInput
                    id="phone"
                    value={formData.phone}
                    onChange={(val) => setFormData({ ...formData, phone: val })}
                    required
                  />
                </div>
              )}

              {/* Forgot password (login only) */}
              {isLogin && (
                <div className="text-right">
                  <Link href="#" className="text-sm text-primary transition-colors hover:underline">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              )}

              <Button
                type="submit"
                className="w-full gap-2 font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    {isLogin ? "Ingresando..." : "Creando cuenta..."}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
                    <ArrowRight className="size-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-2">
            <div className="text-center text-sm text-muted-foreground">
              {isLogin ? (
                <>
                  ¿No tienes cuenta?{" "}
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className="font-medium text-primary hover:underline"
                  >
                    Regístrate
                  </button>
                </>
              ) : (
                <>
                  ¿Ya tienes cuenta?{" "}
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className="font-medium text-primary hover:underline"
                  >
                    Inicia Sesión
                  </button>
                </>
              )}
            </div>
          </CardFooter>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Al continuar, aceptas nuestros{" "}
          <Link href="#" className="text-primary hover:underline">
            Términos de Servicio
          </Link>{" "}
          y{" "}
          <Link href="#" className="text-primary hover:underline">
            Política de Privacidad
          </Link>
        </p>
      </div>
    </div>
  )
}
