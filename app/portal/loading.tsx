import { Skeleton } from "@/components/ui/skeleton"

export default function PortalLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full max-w-md rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
        ))}
      </div>
    </div>
  )
}
