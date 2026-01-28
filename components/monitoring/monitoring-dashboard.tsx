'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useCamera } from '@/hooks/use-camera'
import { useDetection } from '@/hooks/use-detection'
import { VideoFeed, VideoFeedHandle } from './video-feed'
import { StatsPanel } from './stats-panel'
import { AlertsPanel } from './alerts-panel'
import { ControlsPanel } from './controls-panel'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, AlertCircle } from 'lucide-react'

export function MonitoringDashboard() {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)
  const [sessionDuration, setSessionDuration] = useState(0)
  const [totalAlerts, setTotalAlerts] = useState(0)
  const sessionStartRef = useRef<Date | null>(null)
  const videoFeedRef = useRef<VideoFeedHandle>(null)

  const {
    isActive: cameraActive,
    hasPermission,
    error: cameraError,
    facingMode,
    startCamera,
    stopCamera,
    switchCamera,
    setVideoRef,
  } = useCamera()

  const {
    detectedPersons,
    suspiciousBehaviors,
    stats,
    isModelLoaded,
    loadingProgress,
    loadModel,
    clearBehaviors,
    dismissBehavior,
  } = useDetection({
    videoElement,
    isActive: cameraActive,
    detectionInterval: 150,
  })

  // Load AI model on mount
  useEffect(() => {
    loadModel()
  }, [loadModel])

  // Track session duration
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (cameraActive) {
      if (!sessionStartRef.current) {
        sessionStartRef.current = new Date()
      }
      
      interval = setInterval(() => {
        if (sessionStartRef.current) {
          const elapsed = Math.floor(
            (Date.now() - sessionStartRef.current.getTime()) / 1000
          )
          setSessionDuration(elapsed)
        }
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [cameraActive])

  // Track total alerts
  useEffect(() => {
    if (suspiciousBehaviors.length > totalAlerts) {
      setTotalAlerts(suspiciousBehaviors.length)
    }
  }, [suspiciousBehaviors.length, totalAlerts])

  const handleVideoRef = useCallback((element: HTMLVideoElement | null) => {
    setVideoRef(element)
    setVideoElement(element)
  }, [setVideoRef])

  const handleStart = useCallback(async () => {
    await startCamera()
    sessionStartRef.current = new Date()
    setSessionDuration(0)
    setTotalAlerts(0)
    clearBehaviors()
  }, [startCamera, clearBehaviors])

  const handleStop = useCallback(() => {
    stopCamera()
  }, [stopCamera])

  const handleFullscreen = useCallback(() => {
    const videoContainer = document.querySelector('[data-video-container]')
    if (videoContainer && document.fullscreenEnabled) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        videoContainer.requestFullscreen()
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-background safe-area-inset">
      <div className="container mx-auto px-3 py-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
        {/* Controls */}
        <ControlsPanel
          isActive={cameraActive}
          isModelLoaded={isModelLoaded}
          loadingProgress={loadingProgress}
          facingMode={facingMode}
          onStart={handleStart}
          onStop={handleStop}
          onSwitchCamera={switchCamera}
          onFullscreen={handleFullscreen}
        />

        {/* Stats */}
        <StatsPanel
          stats={stats}
          sessionDuration={sessionDuration}
          alertCount={suspiciousBehaviors.length}
        />

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* Video feed - takes up 2 columns on large screens */}
          <div className="lg:col-span-2 order-1" data-video-container>
            {cameraError ? (
              <Card className="bg-card border-border">
                <CardContent className="flex flex-col items-center justify-center min-h-[200px] sm:aspect-video p-4 sm:p-8">
                  <div className="p-4 rounded-full bg-destructive/10 mb-4">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Camera Error
                  </h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    {cameraError}
                  </p>
                </CardContent>
              </Card>
            ) : !cameraActive ? (
              <Card className="bg-card border-border">
                <CardContent className="flex flex-col items-center justify-center min-h-[200px] sm:aspect-video p-4 sm:p-8">
                  <div className="p-4 rounded-full bg-muted mb-4">
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Camera Not Active
                  </h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Click &quot;Start Monitoring&quot; to begin real-time student detection and behavior analysis.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <VideoFeed
                ref={videoFeedRef}
                detectedPersons={detectedPersons}
                suspiciousBehaviors={suspiciousBehaviors}
                onVideoRef={handleVideoRef}
              />
            )}
          </div>

          {/* Alerts panel */}
          <div className="lg:col-span-1 order-2">
            <AlertsPanel
              behaviors={suspiciousBehaviors}
              onDismiss={dismissBehavior}
              onClearAll={clearBehaviors}
            />
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-muted-foreground py-4 border-t border-border">
          <p>
            All processing happens locally in your browser. No video data is transmitted.
          </p>
          <p className="mt-1">
            This system is for educational monitoring and assistance only.
          </p>
        </div>
      </div>
    </div>
  )
}
