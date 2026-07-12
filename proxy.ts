import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Tokens de sesión
  const adminToken = request.cookies.get('biz-admin-token')
  const customerToken = request.cookies.get('biz-customer-token')

  // La página de login es pública para todos
  const isLoginRoute = pathname.startsWith('/login')

  // Imágenes de productos (proxy → Spring Boot); deben ser públicas para el portal de clientes
  if (pathname.startsWith('/uploads')) {
    return NextResponse.next()
  }

  // --- Rutas del Portal de Clientes (/portal) ---
  if (pathname.startsWith('/portal')) {
    // Si no tiene token de cliente, redirigir al login unificado
    if (!customerToken) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // --- Rutas del Admin (todo lo demás excepto login) ---
  if (!isLoginRoute) {
    // Si no hay token de admin, redirigir al login
    if (!adminToken) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // --- Ruta /login ---
  // Si ya tiene token de admin, redirigir al dashboard
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