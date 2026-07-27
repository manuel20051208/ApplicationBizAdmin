import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Tokens de sesión
  const adminToken = request.cookies.get('biz-admin-token')
  const customerToken = request.cookies.get('biz-customer-token')

  // NUEVO: si viene un token de Google OAuth2 en la URL, dejar pasar
  // aunque todavía no exista la cookie (se va a crear del lado del cliente)
  const hasOAuthToken = request.nextUrl.searchParams.has('token')

  // La página de login es pública para todos
  const isLoginRoute = pathname.startsWith('/login')

  if (pathname.startsWith('/uploads')) {
    return NextResponse.next()
  }

  // --- Rutas del Portal de Clientes (/portal) ---
  if (pathname.startsWith('/portal')) {
    if (!customerToken && !hasOAuthToken) {   // CAMBIO: agregado !hasOAuthToken
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // --- Rutas del Admin (todo lo demás excepto login) ---
  if (!isLoginRoute) {
    if (!adminToken && !hasOAuthToken) {      // CAMBIO: agregado !hasOAuthToken
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  if (adminToken && isLoginRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

// Configurar en qué rutas debe ejecutarse este middleware
export const config = {
  matcher: [
    '/((?!api|dashboard-controller|uploads|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|.*\\.jpg|.*\\.jpeg|.*\\.webp|.*\\.gif).*)',
  ],
}