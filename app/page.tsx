import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { Separator } from "@/components/ui/separator"
import { GoogleCallbackAdmin } from "@/components/auth/GoogleCallbackAdmin"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; photo?: string }>
}) {
  const params = await searchParams
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("biz-admin-token")

  // Permitir acceso si viene con token de Google OAuth2 en la URL
  const hasOAuthToken = Boolean(params.token)

  if (!sessionCookie && !hasOAuthToken) {
    redirect("/login")
  }

  return (
    <GoogleCallbackAdmin>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/10 bg-background px-3 sm:h-16 sm:px-4">
            <SidebarTrigger className="-ml-1 hidden md:inline-flex" />
            <Separator orientation="vertical" className="mr-2 hidden h-4 md:block" />
            
            <div className="flex-1" />
            

          </header>
          
          <DashboardContent />
        </SidebarInset>
      </SidebarProvider>
    </GoogleCallbackAdmin>
  )
}
