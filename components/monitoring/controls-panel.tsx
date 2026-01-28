'use client'

import { Camera, CameraOff, RefreshCw, Settings, Maximize, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ControlsPanelProps {
  isActive: boolean
  isModelLoaded: boolean
  loadingProgress: number
  facingMode: 'user' | 'environment'
  onStart: () => void
  onStop: () => void
  onSwitchCamera: () => void
  onFullscreen?: () => void
  className?: string
}

export function ControlsPanel({
  isActive,
  isModelLoaded,
  loadingProgress,
  facingMode,
  onStart,
  onStop,
  onSwitchCamera,
  onFullscreen,
  className,
}: ControlsPanelProps) {
  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Main control button */}
          {isActive ? (
            <Button
              variant="destructive"
              size="lg"
              onClick={onStop}
              className="gap-2"
            >
              <CameraOff className="h-4 w-4" />
              Stop Monitoring
            </Button>
          ) : (
            <Button
              variant="default"
              size="lg"
              onClick={onStart}
              disabled={!isModelLoaded}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Camera className="h-4 w-4" />
              {isModelLoaded ? 'Start Monitoring' : 'Loading AI...'}
            </Button>
          )}

          {/* Camera switch */}
          <Button
            variant="outline"
            size="icon"
            onClick={onSwitchCamera}
            disabled={!isActive}
            title="Switch Camera"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Switch camera</span>
          </Button>

          {/* Fullscreen */}
          {onFullscreen && (
            <Button
              variant="outline"
              size="icon"
              onClick={onFullscreen}
              disabled={!isActive}
              title="Fullscreen"
            >
              <Maximize className="h-4 w-4" />
              <span className="sr-only">Fullscreen</span>
            </Button>
          )}

          {/* Status badges */}
          <div className="flex items-center gap-2 ml-auto">
            {!isModelLoaded && loadingProgress > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {loadingProgress}%
                </span>
              </div>
            )}
            
            <Badge 
              variant={isModelLoaded ? "default" : "secondary"}
              className={cn(
                "text-xs",
                isModelLoaded && "bg-success text-success-foreground"
              )}
            >
              {isModelLoaded ? 'AI Ready' : 'Loading Model'}
            </Badge>
            
            <Badge variant="outline" className="text-xs capitalize">
              {facingMode === 'environment' ? 'Rear' : 'Front'} Camera
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
