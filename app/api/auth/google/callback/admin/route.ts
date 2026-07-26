import { NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE_MAX_AGE_SEC } from "@/lib/auth/constants"

/**
 * Route Handler: GET /api/auth/google/callback/admin
 *
 * El backend de Spring Security redirige aquí tras el OAuth2 de Google (admin):
 *   302 Location: http://localhost:3000/?token={jwt}&photo={url}
 *
 * NOTA: Como el backend ya redirige directamente a "/" con los params,
 * este handler sirve como alternativa si el backend se configura para
 * redirigir a /api/auth/google/callback/admin en su lugar.
 *
 * También puede usarse para setear la cookie HttpOnly si se desea.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  const photo = searchParams.get("photo") ?? ""

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=no_token", request.url))
  }

  // Setear cookie HttpOnly para que el Server Component la lea en "/"
  const response = NextResponse.redirect(
    new URL(`/?token=${encodeURIComponent(token)}&photo=${encodeURIComponent(photo)}`, request.url)
  )

  response.cookies.set("biz-admin-token", "authenticated", {
    httpOnly: false,          // false para que JS pueda leerla (igual que la cookie original)
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE_SEC,
    sameSite: "lax",
  })

  return response
}
