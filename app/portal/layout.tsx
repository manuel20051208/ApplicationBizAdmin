"use client"

import { PortalHeader } from "@/components/portal/portal-header"
import { GoogleCallbackClient } from "@/components/auth/GoogleCallbackClient"

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <GoogleCallbackClient>
        <PortalHeader />
        <main className="mx-auto max-w-[1440px] overflow-x-hidden p-3 pb-28 sm:p-6 sm:pb-28">
          {children}
        </main>
      </GoogleCallbackClient>
    </div>
  )
}
