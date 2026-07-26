"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Package, ShoppingBag, Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Store, Building2, Sun, Moon, UserRound } from "lucide-react"
import { PhoneInput } from "@/components/ui/phone-input"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getNetworkErrorMessage, isNetworkOrApiDown } from "@/lib/api-errors"
import {
  loginAndSave,
  registerAndSave,
  type AuthRole,
} from "@/lib/services/authService"
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
  }, [])

  useEffect(() => {
    // Si el usuario ya está autenticado, redirigirlo a su respectivo portal.
    // IMPORTANT: deps vacío — solo corre al montar, no en cada cambio de router.
    // Si estuviera en [router], re-dispararía justo después del login y causaría
    // dos router.push() simultáneos que congelan la navegación.
    const user = getStoredUser();
    if (user && user.token && !isSessionExpired(user)) {
      router.push(user.role === "admin" ? "/" : "/portal");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        toast.success("Usuario registrado exitosamente");
      }

      if (role === "admin") {
        router.push("/")
      } else {
        router.push("/portal")
      }
    } catch (error) {
      if (isNetworkOrApiDown(error)) {
        const { triggerOfflineNotification } = await import("@/lib/api-errors")
        triggerOfflineNotification()
      } else {
        const message = error instanceof Error
          ? error.message
          : getNetworkErrorMessage()
        toast.error(message)
      }
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
                      <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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
                    <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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

              {/* ---- CAMPO EMAIL (siempre visible) ---- */}
              {
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
              }

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

            {/* Google OAuth2 button (ambos roles) */}
            <div className="mt-4 space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">O continúa con</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  // URLs exactas del backend Spring Security OAuth2
                  const url = isAdmin
                    ? "http://localhost:8080/oauth2/authorization/google-admin"
                    : "http://localhost:8080/oauth2/authorization/google-client"
                  window.location.href = url
                }}
                className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-accent hover:shadow-md active:scale-[0.98]"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar con Google
              </button>
            </div>

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
