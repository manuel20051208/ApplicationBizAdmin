/**
 * Hook: useGoogleOAuthCallback
 *
 * Detecta los query params ?token=JWT&photo=URL que el backend inyecta
 * tras completar el flujo OAuth2 de Google.
 *
 * Uso: llamar en el componente client-side de la página destino del redirect.
 */
import { useEffect } from "react"
import { saveAuthSession } from "@/lib/auth/session"
import { toHttps } from "@/lib/config"
import type { AuthRole } from "@/lib/auth/session"
import { toast } from "sonner"

/** Parsea el payload del JWT de forma segura soportando caracteres UTF-8. */
function parseJwtPayload(token: string): Record<string, unknown> {
  try {
    const parts = token.split(".")
    if (parts.length < 2) return {}
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    while (base64.length % 4 !== 0) {
      base64 += "="
    }
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

export function useGoogleOAuthCallback(role: AuthRole) {
  useEffect(() => {
    if (typeof window === "undefined") return

    const searchParams = new URLSearchParams(window.location.search)
    const token = searchParams.get("token")
    const photoParam = searchParams.get("photo") ?? searchParams.get("picture") ?? ""
    const nameParam = searchParams.get("name") ?? searchParams.get("fullName") ?? searchParams.get("nombre") ?? ""

    if (!token) return

    const payload = parseJwtPayload(token)

    const email: string =
      (payload.email as string) ||
      (payload.sub as string) ||
      ""

    const fullName: string =
      nameParam ||
      (payload.fullName as string) ||
      (payload.name as string) ||
      (payload.nombre as string) ||
      ""

    const id: number | null =
      typeof payload.id === "number"
        ? payload.id
        : typeof payload.userId === "number"
          ? payload.userId
          : null

    // Leer la foto de la URL o directamente del JWT payload
    const photo =
      toHttps(photoParam) ||
      toHttps(payload.profilePhotoUrl as string) ||
      toHttps(payload.photo as string) ||
      toHttps(payload.picture as string) ||
      ""

    const accountType = role === "admin" ? "ADMIN" : "CLIENT"

    // 1. Guardar la sesión de forma persistente (localStorage + Cookie)
    saveAuthSession(
      {
        id: id ?? undefined,
        token,
        email,
        fullName,
        profilePhoto: photo || undefined,
        photo:        photo || undefined,
        fotoPerfil:   photo || undefined,
        accountType,
      },
      role,
      { name: fullName, email }
    )

    toast.success(`¡Bienvenido${fullName ? `, ${fullName}` : ""}!`)

    // 2. Redirigir a la URL limpia (sin query params) forzando recarga para que Next.js lea las cookies de sesión
    const targetPath = role === "admin" ? "/" : "/portal"
    window.location.href = targetPath
  }, [role])
}
