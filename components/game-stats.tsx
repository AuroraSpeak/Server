import type React from "react"
import { BarChart, ArrowUp, ArrowDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface GameStatsProps {
  stats: {
    name: string
    value: string | number
    change?: number
    icon?: React.ReactNode
    color?: string
  }[]
  title: string
}

export default function GameStats({ stats, title }: GameStatsProps) {
  return (
    <Card className="border-gaming-border bg-gaming-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2 border-b border-gaming-border">
        <CardTitle className="text-base flex items-center">
          <BarChart size={16} className="mr-2 text-gaming-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  {stat.icon || <div className="w-4 h-4 mr-2" />}
                  <span>{stat.name}</span>
                </div>
                <div className="flex items-center">
                  <span className={`text-sm font-medium ${stat.color || "text-white"}`}>{stat.value}</span>
                  {stat.change !== undefined && (
                    <span className={`ml-1 text-xs ${stat.change > 0 ? "text-gaming-success" : "text-gaming-accent"}`}>
                      {stat.change > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    </span>
                  )}
                </div>
              </div>
              <Progress
                value={typeof stat.value === "number" ? stat.value : 70}
                className="h-1.5"
                indicatorClassName={
                  stat.color === "text-gaming-primary"
                    ? "bg-gaming-primary"
                    : stat.color === "text-gaming-secondary"
                      ? "bg-gaming-secondary"
                      : stat.color === "text-gaming-accent"
                        ? "bg-gaming-accent"
                        : stat.color === "text-gaming-success"
                          ? "bg-gaming-success"
                          : "bg-white"
                }
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

