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
          <header className="flex h-14 items-center gap-4 border-b border-border/50 bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            
            <div className="flex-1" />
            

          </header>
          
          <DashboardContent />
        </SidebarInset>
      </SidebarProvider>
    </GoogleCallbackAdmin>
  )
}
