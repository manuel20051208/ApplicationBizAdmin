import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { Separator } from "@/components/ui/separator"


import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("biz-admin-token")
  
  if (!token) {
    redirect("/login")
  }

  return (
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
  )
}
