'use client'

import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react'
import type { DetectedPerson, SuspiciousBehavior } from '@/lib/types/detection'
import { cn } from '@/lib/utils'

interface VideoFeedProps {
  detectedPersons: DetectedPerson[]
  suspiciousBehaviors: SuspiciousBehavior[]
  onVideoRef?: (element: HTMLVideoElement | null) => void
  className?: string
}

export interface VideoFeedHandle {
  getVideoElement: () => HTMLVideoElement | null
}

export const VideoFeed = forwardRef<VideoFeedHandle, VideoFeedProps>(
  function VideoFeed({ detectedPersons, suspiciousBehaviors, onVideoRef, className }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 })

    useImperativeHandle(ref, () => ({
      getVideoElement: () => videoRef.current,
    }))

    // Pass video ref to parent
    useEffect(() => {
      onVideoRef?.(videoRef.current)
    }, [onVideoRef])

    // Handle video metadata load to get actual dimensions
    useEffect(() => {
      const video = videoRef.current
      if (!video) return

      const handleLoadedMetadata = () => {
        setVideoDimensions({
          width: video.videoWidth,
          height: video.videoHeight,
        })
      }

      const handleResize = () => {
        if (video.videoWidth && video.videoHeight) {
          setVideoDimensions({
            width: video.videoWidth,
            height: video.videoHeight,
          })
        }
      }

      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      window.addEventListener('resize', handleResize)
      window.addEventListener('orientationchange', handleResize)

      // Check if video already has dimensions
      if (video.videoWidth && video.videoHeight) {
        handleLoadedMetadata()
      }

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('orientationchange', handleResize)
      }
    }, [])

    // Draw detection overlays on canvas
    useEffect(() => {
      const canvas = canvasRef.current
      const video = videoRef.current
      if (!canvas || !video) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const draw = () => {
        // Match canvas size to video display size
        const rect = video.getBoundingClientRect()
        canvas.width = rect.width
        canvas.height = rect.height

        // Clear previous drawings
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Calculate scale factors
        const scaleX = canvas.width / (video.videoWidth || 1)
        const scaleY = canvas.height / (video.videoHeight || 1)

        // Draw bounding boxes for detected persons
        detectedPersons.forEach((person, index) => {
          const { boundingBox } = person
          const x = boundingBox.x * scaleX
          const y = boundingBox.y * scaleY
          const width = boundingBox.width * scaleX
          const height = boundingBox.height * scaleY

          // Check if this person has suspicious behavior
          const hasSuspiciousBehavior = suspiciousBehaviors.some(
            b => b.personId === person.id
          )

          // Set colors based on behavior
          const boxColor = hasSuspiciousBehavior ? '#ef4444' : '#22c55e'
          const bgColor = hasSuspiciousBehavior ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)'

          // Draw filled background
          ctx.fillStyle = bgColor
          ctx.fillRect(x, y, width, height)

          // Draw bounding box
          ctx.strokeStyle = boxColor
          ctx.lineWidth = 2
          ctx.strokeRect(x, y, width, height)

          // Draw label background
          const label = person.studentName || `Student ${index + 1}`
          ctx.font = 'bold 12px Inter, sans-serif'
          const labelWidth = ctx.measureText(label).width + 16
          const labelHeight = 24

          ctx.fillStyle = boxColor
          ctx.fillRect(x, y - labelHeight, labelWidth, labelHeight)

          // Draw label text
          ctx.fillStyle = '#ffffff'
          ctx.fillText(label, x + 8, y - 7)

          // Draw confidence indicator
          const confidenceWidth = 40
          const confidenceHeight = 4
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
          ctx.fillRect(x + width - confidenceWidth - 4, y + 4, confidenceWidth, confidenceHeight)
          ctx.fillStyle = boxColor
          ctx.fillRect(
            x + width - confidenceWidth - 4,
            y + 4,
            confidenceWidth * person.confidence,
            confidenceHeight
          )

          // Draw warning icon if suspicious
          if (hasSuspiciousBehavior) {
            ctx.fillStyle = '#fbbf24'
            ctx.beginPath()
            ctx.moveTo(x + width - 20, y + 16)
            ctx.lineTo(x + width - 10, y + 32)
            ctx.lineTo(x + width - 30, y + 32)
            ctx.closePath()
            ctx.fill()
            
            ctx.fillStyle = '#000000'
            ctx.font = 'bold 10px Inter, sans-serif'
            ctx.fillText('!', x + width - 18, y + 29)
          }
        })
      }

      // Draw on each animation frame
      const animationFrame = requestAnimationFrame(function loop() {
        draw()
        requestAnimationFrame(loop)
      })

      return () => cancelAnimationFrame(animationFrame)
    }, [detectedPersons, suspiciousBehaviors])

    // Calculate aspect ratio from video dimensions
    const aspectRatio = videoDimensions.width && videoDimensions.height 
      ? videoDimensions.width / videoDimensions.height 
      : 16 / 9

    return (
      <div 
        ref={containerRef}
        className={cn(
          "relative w-full bg-secondary rounded-lg overflow-hidden",
          // Use dynamic aspect ratio based on video, with mobile-friendly height constraints
          "max-h-[60dvh] sm:max-h-[70dvh] lg:max-h-none",
          className
        )}
        style={{
          // Use paddingBottom trick for aspect ratio that works better on mobile
          aspectRatio: `${aspectRatio}`,
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          // Critical attributes for iOS PWA camera
          // @ts-expect-error - webkit-playsinline is a non-standard attribute for iOS
          webkit-playsinline="true"
          className={cn(
            "absolute inset-0 w-full h-full",
            // object-contain ensures full video is visible without cropping
            // object-cover would fill the container but crop the video
            "object-contain"
          )}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
        
        {/* Recording indicator */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full z-10">
          <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-destructive" />
          </span>
          <span className="text-[10px] sm:text-xs font-medium text-foreground">LIVE</span>
        </div>

        {/* Video dimensions indicator (helpful for debugging) */}
        {videoDimensions.width > 0 && (
          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-background/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-muted-foreground z-10">
            {videoDimensions.width} x {videoDimensions.height}
          </div>
        )}
      </div>
    )
  }
)
