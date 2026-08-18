import { Skeleton } from "@/components/ui/skeleton"

export function AdminPageSkeleton({ variant = "table" }: { variant?: "dashboard" | "table" }) {
  if (variant === "dashboard") {
    return (
      <main className="flex-1 p-6">
        <Skeleton className="mb-2 h-8 w-40" />
        <Skeleton className="mb-6 h-4 w-72" />
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[340px] rounded-xl" />
          <Skeleton className="h-[340px] rounded-xl" />
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 p-6">
      <Skeleton className="mb-4 h-4 w-24" />
      <Skeleton className="mb-2 h-9 w-48" />
      <Skeleton className="mb-6 h-4 w-64" />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-[420px] rounded-xl" />
    </main>
  )
}
