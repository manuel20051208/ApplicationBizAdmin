import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string
  change: string
  changeType: "positive" | "negative" | "neutral"
  icon: LucideIcon
}

export function StatCard({ title, value, change, changeType, icon: Icon }: StatCardProps) {
  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{value}</div>
        <p className={cn(
          "text-sm mt-1",
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
