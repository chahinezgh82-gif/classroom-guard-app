'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { CameraState } from '@/lib/types/detection'

interface UseCameraOptions {
  onStream?: (stream: MediaStream) => void
  preferredFacingMode?: 'user' | 'environment'
}

// Detect if running as PWA (standalone mode)
function isPWA(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  )
}

// Detect mobile device
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

export function useCamera(options: UseCameraOptions = {}) {
  const { onStream, preferredFacingMode = 'environment' } = options
  
  const [state, setState] = useState<CameraState>({
    isActive: false,
    hasPermission: null,
    error: null,
    facingMode: preferredFacingMode,
  })
  
  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const retryCountRef = useRef(0)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setState(prev => ({ ...prev, isActive: false }))
    retryCountRef.current = 0
  }, [])

  const startCamera = useCallback(async (facingMode?: 'user' | 'environment') => {
    try {
      // Stop any existing stream
      stopCamera()
      
      const mode = facingMode || state.facingMode
      const isMobile = isMobileDevice()
      const isStandalone = isPWA()

      // For PWA/standalone mode, we need to be more careful with constraints
      // Some mobile browsers in PWA mode have stricter requirements
      let constraints: MediaStreamConstraints

      if (isStandalone && isMobile) {
        // PWA mode on mobile - use simpler constraints first
        constraints = {
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
          },
          audio: false,
        }
      } else if (isMobile) {
        // Mobile browser - use moderate constraints
        constraints = {
          video: {
            facingMode: mode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30, max: 30 },
          },
          audio: false,
        }
      } else {
        // Desktop - use full constraints
        constraints = {
          video: {
            facingMode: mode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
          audio: false,
        }
      }

      let stream: MediaStream

      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch (initialError) {
        // If initial constraints fail, try with minimal constraints
        console.log('[v0] Initial camera constraints failed, trying fallback')
        stream = await navigator.mediaDevices.getUserMedia({
          video: isMobile ? { facingMode: { ideal: mode } } : true,
          audio: false,
        })
      }

      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // Important for iOS Safari and PWA
        videoRef.current.setAttribute('playsinline', 'true')
        videoRef.current.setAttribute('webkit-playsinline', 'true')
        
        // Try to play - important for PWA on iOS
        try {
          await videoRef.current.play()
        } catch (playError) {
          console.log('[v0] Auto-play failed, user interaction may be needed')
        }
      }
      
      setState({
        isActive: true,
        hasPermission: true,
        error: null,
        facingMode: mode,
      })
      
      onStream?.(stream)
      retryCountRef.current = 0
      
      return stream
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to access camera'
      const errorName = error instanceof Error ? error.name : ''
      
      let userFriendlyError = errorMessage
      
      if (errorName === 'NotAllowedError' || errorMessage.includes('Permission denied')) {
        if (isPWA()) {
          userFriendlyError = 'Camera permission denied. Please open Settings > Privacy > Camera and enable access for this app, then restart.'
        } else {
          userFriendlyError = 'Camera permission denied. Please allow camera access in your browser settings and refresh the page.'
        }
      } else if (errorName === 'NotFoundError' || errorMessage.includes('NotFoundError')) {
        userFriendlyError = 'No camera found on this device.'
      } else if (errorName === 'NotReadableError' || errorMessage.includes('NotReadableError')) {
        userFriendlyError = 'Camera is already in use by another application. Please close other apps using the camera.'
      } else if (errorName === 'OverconstrainedError') {
        userFriendlyError = 'Camera does not support the requested settings. Trying with basic settings...'
        // Auto-retry with basic constraints
        if (retryCountRef.current < 2) {
          retryCountRef.current++
          return startCamera(facingMode)
        }
      } else if (errorName === 'SecurityError') {
        userFriendlyError = 'Camera access requires a secure connection (HTTPS). Please ensure you are using HTTPS.'
      }
      
      setState(prev => ({
        ...prev,
        isActive: false,
        hasPermission: false,
        error: userFriendlyError,
      }))
      
      return null
    }
  }, [state.facingMode, stopCamera, onStream])

  const switchCamera = useCallback(async () => {
    const newFacingMode = state.facingMode === 'user' ? 'environment' : 'user'
    await startCamera(newFacingMode)
  }, [state.facingMode, startCamera])

  const setVideoRef = useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element
    if (element && streamRef.current) {
      element.srcObject = streamRef.current
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return {
    ...state,
    startCamera,
    stopCamera,
    switchCamera,
    setVideoRef,
    videoRef,
    stream: streamRef.current,
  }
}
