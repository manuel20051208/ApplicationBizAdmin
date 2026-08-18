import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string
  change: string
  changeType: "positive" | "negative" | "neutral"
  icon: LucideIcon
  loading?: boolean
}

function StatCardSkeleton({ title, icon: Icon }: { title: string; icon: LucideIcon }) {
  return (
    <Card className="h-full min-h-[160px] gap-2 border-white/20 bg-card/60 py-3 backdrop-blur-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 -translate-y-2 flex-col justify-center">
        <div className="h-9 w-28 animate-pulse rounded-md bg-muted/60" />
        <div className="mt-2 h-4 w-24 animate-pulse rounded-md bg-muted/40" />
      </CardContent>
    </Card>
  )
}

export function StatCard({ title, value, change, changeType, icon: Icon, loading }: StatCardProps) {
  if (loading) {
    return <StatCardSkeleton title={title} icon={Icon} />
  }

  return (
    <Card className="h-full min-h-[160px] gap-2 border-white/20 bg-card/60 py-3 backdrop-blur-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 -translate-y-2 flex-col justify-center">
        <div className="text-3xl font-bold text-foreground animate-in fade-in-0 duration-500">{value}</div>
        <p className={cn(
          "text-sm mt-1 animate-in fade-in-0 duration-700",
          changeType === "positive" && "text-emerald-500",
          changeType === "negative" && "text-red-500",
          changeType === "neutral" && "text-muted-foreground"
        )}>
          {change}
        </p>
      </CardContent>
    </Card>
  )
}

