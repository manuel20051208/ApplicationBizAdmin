"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { saveAuthSession } from "@/lib/auth/session"
import { normalizeGooglePhotoUrl } from "@/lib/config"
import { toast } from "sonner"

/**
 * Callback page para Google OAuth2.
 *
 * El backend debe redirigir a esta URL tras autenticar con Google:
 *   /auth/google/callback?token=JWT&id=1&email=a@b.com&name=Fulano&photo=URL&role=customer&accountType=CLIENT
 */
function GoogleCallbackContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [status, setStatus] = useState<"loading" | "error">("loading")

  useEffect(() => {
    const token       = params.get("token")
    const id          = params.get("id")
    const email       = params.get("email")
    const name        = params.get("name") ?? params.get("fullName") ?? ""
    const photo       = normalizeGooglePhotoUrl(params.get("photo") ?? params.get("picture") ?? params.get("profilePhoto") ?? "")
    const roleParam   = params.get("role")
    const accountType = params.get("accountType")

    if (!token) {
      toast.error("No se recibió un token de Google. Intenta de nuevo.")
      setStatus("error")
      setTimeout(() => router.replace("/login"), 2500)
      return
    }

    const role = roleParam === "admin" ? "admin" : "customer"

    saveAuthSession(
      {
        id:           id ? Number(id) : undefined,
        token,
        email:        email ?? "",
        fullName:     name,
        profilePhoto: photo || undefined,
        photo:        photo || undefined,
        fotoPerfil:   photo || undefined,
        accountType:  accountType ?? (role === "admin" ? "ADMIN" : "CLIENT"),
      },
      role,
      { name, email: email ?? "" }
    )

    toast.success(`Bienvenido, ${name || email}!`)
    router.replace(role === "admin" ? "/" : "/portal")
  }, [params, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      {status === "loading" ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="size-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
          <p className="text-sm text-muted-foreground">Autenticando con Google...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-destructive">Error al autenticar. Redirigiendo...</p>
        </div>
      )}
    </div>
  )
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={null}>
      <GoogleCallbackContent />
    </Suspense>
  )
}
