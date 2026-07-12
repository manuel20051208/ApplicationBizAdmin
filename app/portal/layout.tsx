"use client"

import { PortalHeader } from "@/components/portal/portal-header"

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <PortalHeader />
      <main className="mx-auto max-w-[1440px] p-6 pb-28">
        {children}
      </main>
    </div>
  )
}
