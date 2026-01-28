'use client'

import { Users, AlertTriangle, Activity, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { DetectionStats } from '@/lib/types/detection'
import { cn } from '@/lib/utils'

interface StatsPanelProps {
  stats: DetectionStats
  sessionDuration: number // in seconds
  alertCount: number
  className?: string
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function StatsPanel({ stats, sessionDuration, alertCount, className }: StatsPanelProps) {
  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-3", className)}>
      {/* Student Count */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Students
              </p>
              <p className="text-2xl font-bold text-foreground">
                {stats.totalDetected}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Count */}
      <Card className={cn(
        "bg-card border-border transition-colors",
        alertCount > 0 && "border-warning/50 bg-warning/5"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              alertCount > 0 ? "bg-warning/20" : "bg-secondary"
            )}>
              <AlertTriangle className={cn(
                "h-5 w-5",
                alertCount > 0 ? "text-warning" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Alerts
              </p>
              <p className={cn(
                "text-2xl font-bold",
                alertCount > 0 ? "text-warning" : "text-foreground"
              )}>
                {alertCount}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Duration */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Duration
              </p>
              <p className="text-2xl font-bold font-mono text-foreground">
                {formatDuration(sessionDuration)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FPS / Performance */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              stats.fps >= 20 ? "bg-success/10" : stats.fps >= 10 ? "bg-warning/10" : "bg-destructive/10"
            )}>
              <Activity className={cn(
                "h-5 w-5",
                stats.fps >= 20 ? "text-success" : stats.fps >= 10 ? "text-warning" : "text-destructive"
              )} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Performance
              </p>
              <p className={cn(
                "text-2xl font-bold font-mono",
                stats.fps >= 20 ? "text-success" : stats.fps >= 10 ? "text-warning" : "text-destructive"
              )}>
                {stats.fps} <span className="text-sm font-normal">FPS</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
