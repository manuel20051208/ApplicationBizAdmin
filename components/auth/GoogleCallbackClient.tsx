"use client"

import { useEffect, useState } from "react"
import { saveAuthSession } from "@/lib/auth/session"
import { toHttps } from "@/lib/config"
import { toast } from "sonner"

/**
 * Parsea el payload del JWT soportando UTF-8 y padding.
 */
function parseJwtPayload(token: string): Record<string, unknown> {
  try {
    const parts = token.split(".")
    if (parts.length < 2) return {}
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    while (base64.length % 4 !== 0) base64 += "="
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    console.error("Error al parsear JWT payload:", e)
    return {}
  }
}

/**
 * GoogleCallbackClient
 *
 * Intercepta ?token= en la URL tras el flujo OAuth2 de Google (cliente).
 * Guarda la sesión en localStorage + Cookies, limpia la URL silenciosamente
 * y muestra la tienda de cliente de inmediato.
 */
export function GoogleCallbackClient({ children }: { children?: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get("token")

    if (!token) {
      setReady(true)
      return
    }

    const photoParam = params.get("photo") ?? params.get("picture") ?? ""
    const nameParam = params.get("name") ?? params.get("fullName") ?? ""

    const payload = parseJwtPayload(token)

    const email = (payload.email as string) || (payload.sub as string) || ""
    const fullName =
      nameParam ||
      (payload.fullName as string) ||
      (payload.name as string) ||
      (payload.nombre as string) ||
      ""

    const id: number | null =
      typeof payload.id === "number" ? payload.id
        : typeof payload.userId === "number" ? payload.userId
          : null

    const photo =
      toHttps(photoParam) ||
      toHttps(payload.profilePhotoUrl as string) ||
      toHttps(payload.photo as string) ||
      toHttps(payload.picture as string) ||
      ""

    const accountType = (payload.accountType as string) || "CLIENT"

    saveAuthSession(
      {
        id: id ?? undefined,
        token,
        email,
        fullName,
        profilePhoto: photo || undefined,
        photo: photo || undefined,
        fotoPerfil: photo || undefined,
        accountType,
      },
      "customer",
      { name: fullName, email }
    )

    toast.success(`¡Bienvenido${fullName ? `, ${fullName}` : ""}!`)

    // Limpiar la URL sin recargar la página
    window.history.replaceState({}, "", window.location.pathname)

    setReady(true)
  }, [])

  if (!ready) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando portal...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
