'use client'

import { X, Smartphone, Eye, Hand, RotateCcw, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { SuspiciousBehavior, SuspiciousBehaviorType } from '@/lib/types/detection'
import { cn } from '@/lib/utils'

interface AlertsPanelProps {
  behaviors: SuspiciousBehavior[]
  onDismiss: (id: string) => void
  onClearAll: () => void
  className?: string
}

const behaviorConfig: Record<SuspiciousBehaviorType, {
  icon: typeof Smartphone
  label: string
  severity: 'high' | 'medium' | 'low'
}> = {
  phone_detected: {
    icon: Smartphone,
    label: 'Phone Detected',
    severity: 'high',
  },
  looking_down: {
    icon: Eye,
    label: 'Looking Down',
    severity: 'medium',
  },
  suspicious_hand_movement: {
    icon: Hand,
    label: 'Hand Movement',
    severity: 'medium',
  },
  head_movement: {
    icon: RotateCcw,
    label: 'Head Movement',
    severity: 'low',
  },
  looking_away: {
    icon: Eye,
    label: 'Looking Away',
    severity: 'medium',
  },
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function AlertItem({ behavior, onDismiss }: { behavior: SuspiciousBehavior; onDismiss: () => void }) {
  const config = behaviorConfig[behavior.type]
  const Icon = config.icon

  const severityColors = {
    high: 'bg-destructive/10 border-destructive/30 text-destructive',
    medium: 'bg-warning/10 border-warning/30 text-warning',
    low: 'bg-muted border-border text-muted-foreground',
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border transition-all",
        severityColors[config.severity]
      )}
    >
      <div className={cn(
        "p-1.5 rounded-md",
        config.severity === 'high' && "bg-destructive/20",
        config.severity === 'medium' && "bg-warning/20",
        config.severity === 'low' && "bg-muted-foreground/20"
      )}>
        <Icon className="h-4 w-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground">
            {behavior.studentName || `Student`}
          </span>
          <Badge 
            variant="outline" 
            className={cn(
              "text-[10px] px-1.5 py-0",
              config.severity === 'high' && "border-destructive/50 text-destructive",
              config.severity === 'medium' && "border-warning/50 text-warning",
              config.severity === 'low' && "border-muted-foreground/50 text-muted-foreground"
            )}
          >
            {config.label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {behavior.description}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-muted-foreground font-mono">
            {formatTime(behavior.timestamp)}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {Math.round(behavior.confidence * 100)}% confidence
          </span>
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={onDismiss}
      >
        <X className="h-3 w-3" />
        <span className="sr-only">Dismiss alert</span>
      </Button>
    </div>
  )
}

export function AlertsPanel({ behaviors, onDismiss, onClearAll, className }: AlertsPanelProps) {
  const sortedBehaviors = [...behaviors].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  )

  const highSeverityCount = behaviors.filter(
    b => behaviorConfig[b.type].severity === 'high'
  ).length

  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className={cn(
              "h-4 w-4",
              highSeverityCount > 0 ? "text-destructive" : "text-muted-foreground"
            )} />
            <CardTitle className="text-base font-semibold text-foreground">
              Behavior Alerts
            </CardTitle>
            {behaviors.length > 0 && (
              <Badge 
                variant={highSeverityCount > 0 ? "destructive" : "secondary"}
                className="ml-1"
              >
                {behaviors.length}
              </Badge>
            )}
          </div>
          {behaviors.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={onClearAll}
            >
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {behaviors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 rounded-full bg-muted mb-3">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No suspicious behaviors detected
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Alerts will appear here when detected
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] lg:h-[400px] pr-3">
            <div className="space-y-2">
              {sortedBehaviors.map(behavior => (
                <AlertItem
                  key={behavior.id}
                  behavior={behavior}
                  onDismiss={() => onDismiss(behavior.id)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
