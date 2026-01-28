'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { DetectedPerson, SuspiciousBehavior, DetectionStats, SuspiciousBehaviorType } from '@/lib/types/detection'
import * as cocoSsd from '@tensorflow-models/coco-ssd'
import * as tf from '@tensorflow/tfjs'

interface UseDetectionOptions {
  videoElement: HTMLVideoElement | null
  isActive: boolean
  detectionInterval?: number
  onDetection?: (persons: DetectedPerson[], behaviors: SuspiciousBehavior[]) => void
}

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9)

// Behavior detection thresholds
const LOOKING_DOWN_THRESHOLD = 0.6 // Head position ratio
const PHONE_CONFIDENCE_THRESHOLD = 0.5
const MOVEMENT_THRESHOLD = 50 // Pixels

export function useDetection(options: UseDetectionOptions) {
  const { videoElement, isActive, detectionInterval = 200, onDetection } = options
  
  const [detectedPersons, setDetectedPersons] = useState<DetectedPerson[]>([])
  const [suspiciousBehaviors, setSuspiciousBehaviors] = useState<SuspiciousBehavior[]>([])
  const [stats, setStats] = useState<DetectionStats>({
    totalDetected: 0,
    suspiciousCount: 0,
    lastUpdated: new Date(),
    fps: 0,
  })
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastDetectionTimeRef = useRef<number>(0)
  const previousPositionsRef = useRef<Map<string, { x: number, y: number, time: number }>>(new Map())
  const fpsCounterRef = useRef<number[]>([])

  // Load TensorFlow.js and COCO-SSD model
  const loadModel = useCallback(async () => {
    try {
      setLoadingProgress(10)
      
      // Set backend to webgl for better performance
      await tf.setBackend('webgl')
      await tf.ready()
      setLoadingProgress(30)
      
      // Load COCO-SSD model
      const model = await cocoSsd.load({
        base: 'lite_mobilenet_v2', // Lighter model for better performance
      })
      
      modelRef.current = model
      setIsModelLoaded(true)
      setLoadingProgress(100)
      
      console.log('[v0] COCO-SSD model loaded successfully')
      return model
    } catch (error) {
      console.error('[v0] Error loading detection model:', error)
      setLoadingProgress(0)
      return null
    }
  }, [])

  // Analyze behavior based on detections
  const analyzeBehavior = useCallback((
    predictions: cocoSsd.DetectedObject[],
    currentPersons: DetectedPerson[]
  ): SuspiciousBehavior[] => {
    const behaviors: SuspiciousBehavior[] = []
    
    // Check for phone detection
    const phoneDetections = predictions.filter(p => 
      p.class === 'cell phone' && p.score > PHONE_CONFIDENCE_THRESHOLD
    )
    
    phoneDetections.forEach((phone) => {
      // Find the closest person to this phone
      const closestPerson = currentPersons.reduce((closest, person) => {
        const phoneCenter = {
          x: phone.bbox[0] + phone.bbox[2] / 2,
          y: phone.bbox[1] + phone.bbox[3] / 2,
        }
        const personCenter = {
          x: person.boundingBox.x + person.boundingBox.width / 2,
          y: person.boundingBox.y + person.boundingBox.height / 2,
        }
        const distance = Math.sqrt(
          Math.pow(phoneCenter.x - personCenter.x, 2) +
          Math.pow(phoneCenter.y - personCenter.y, 2)
        )
        
        if (!closest || distance < closest.distance) {
          return { person, distance }
        }
        return closest
      }, null as { person: DetectedPerson, distance: number } | null)
      
      if (closestPerson && closestPerson.distance < 200) {
        behaviors.push({
          id: generateId(),
          personId: closestPerson.person.id,
          type: 'phone_detected',
          confidence: phone.score,
          timestamp: new Date(),
          description: 'Mobile phone detected near student',
          studentId: closestPerson.person.studentId,
          studentName: closestPerson.person.studentName,
        })
      }
    })
    
    // Check for suspicious movements (rapid position changes)
    currentPersons.forEach(person => {
      const prevPosition = previousPositionsRef.current.get(person.id)
      const currentCenter = {
        x: person.boundingBox.x + person.boundingBox.width / 2,
        y: person.boundingBox.y + person.boundingBox.height / 2,
      }
      
      if (prevPosition) {
        const timeDiff = Date.now() - prevPosition.time
        const distance = Math.sqrt(
          Math.pow(currentCenter.x - prevPosition.x, 2) +
          Math.pow(currentCenter.y - prevPosition.y, 2)
        )
        
        // Check for rapid head movement
        if (timeDiff < 500 && distance > MOVEMENT_THRESHOLD) {
          behaviors.push({
            id: generateId(),
            personId: person.id,
            type: 'head_movement',
            confidence: Math.min(distance / MOVEMENT_THRESHOLD, 1),
            timestamp: new Date(),
            description: 'Rapid head or body movement detected',
            studentId: person.studentId,
            studentName: person.studentName,
          })
        }
        
        // Simple "looking down" heuristic based on bbox position shift
        const yShift = currentCenter.y - prevPosition.y
        if (yShift > 30 && timeDiff > 1000) {
          behaviors.push({
            id: generateId(),
            personId: person.id,
            type: 'looking_down',
            confidence: LOOKING_DOWN_THRESHOLD,
            timestamp: new Date(),
            description: 'Student appears to be looking down frequently',
            studentId: person.studentId,
            studentName: person.studentName,
          })
        }
      }
      
      // Update previous position
      previousPositionsRef.current.set(person.id, {
        x: currentCenter.x,
        y: currentCenter.y,
        time: Date.now(),
      })
    })
    
    return behaviors
  }, [])

  // Run detection on video frame
  const detectFrame = useCallback(async () => {
    if (!modelRef.current || !videoElement || !isActive) return
    
    const now = performance.now()
    
    // Throttle detection to specified interval
    if (now - lastDetectionTimeRef.current < detectionInterval) {
      animationFrameRef.current = requestAnimationFrame(detectFrame)
      return
    }
    
    try {
      // Run detection
      const predictions = await modelRef.current.detect(videoElement)
      
      // Filter for persons
      const personDetections = predictions.filter(p => p.class === 'person')
      
      const persons: DetectedPerson[] = personDetections.map((detection, index) => ({
        id: `person-${index}`,
        boundingBox: {
          x: detection.bbox[0],
          y: detection.bbox[1],
          width: detection.bbox[2],
          height: detection.bbox[3],
        },
        confidence: detection.score,
      }))
      
      // Analyze behaviors
      const behaviors = analyzeBehavior(predictions, persons)
      
      // Calculate FPS
      fpsCounterRef.current.push(now)
      fpsCounterRef.current = fpsCounterRef.current.filter(t => now - t < 1000)
      const fps = fpsCounterRef.current.length
      
      // Update state
      setDetectedPersons(persons)
      setSuspiciousBehaviors(prev => {
        // Keep only recent behaviors (last 30 seconds)
        const recent = prev.filter(b => 
          new Date().getTime() - b.timestamp.getTime() < 30000
        )
        // Add new unique behaviors
        const newBehaviors = behaviors.filter(b => 
          !recent.some(r => 
            r.personId === b.personId && 
            r.type === b.type && 
            new Date().getTime() - r.timestamp.getTime() < 5000
          )
        )
        return [...recent, ...newBehaviors]
      })
      
      setStats({
        totalDetected: persons.length,
        suspiciousCount: behaviors.length,
        lastUpdated: new Date(),
        fps,
      })
      
      onDetection?.(persons, behaviors)
      
      lastDetectionTimeRef.current = now
    } catch (error) {
      console.error('[v0] Detection error:', error)
    }
    
    // Continue detection loop
    if (isActive) {
      animationFrameRef.current = requestAnimationFrame(detectFrame)
    }
  }, [videoElement, isActive, detectionInterval, analyzeBehavior, onDetection])

  // Start/stop detection loop
  useEffect(() => {
    if (isActive && isModelLoaded && videoElement) {
      detectFrame()
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isActive, isModelLoaded, videoElement, detectFrame])

  // Clear behaviors older than 30 seconds periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSuspiciousBehaviors(prev => 
        prev.filter(b => new Date().getTime() - b.timestamp.getTime() < 30000)
      )
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const clearBehaviors = useCallback(() => {
    setSuspiciousBehaviors([])
  }, [])

  const dismissBehavior = useCallback((behaviorId: string) => {
    setSuspiciousBehaviors(prev => prev.filter(b => b.id !== behaviorId))
  }, [])

  return {
    detectedPersons,
    suspiciousBehaviors,
    stats,
    isModelLoaded,
    loadingProgress,
    loadModel,
    clearBehaviors,
    dismissBehavior,
  }
}
