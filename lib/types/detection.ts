// Types for the classroom monitoring system
// Designed for future extensibility with student IDs and names

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface DetectedPerson {
  id: string
  boundingBox: BoundingBox
  confidence: number
  // Future extensibility: link to student database
  studentId?: string
  studentName?: string
}

export type SuspiciousBehaviorType = 
  | 'phone_detected'
  | 'looking_down'
  | 'suspicious_hand_movement'
  | 'head_movement'
  | 'looking_away'

export interface SuspiciousBehavior {
  id: string
  personId: string
  type: SuspiciousBehaviorType
  confidence: number
  timestamp: Date
  description: string
  // Future: link to student for reporting
  studentId?: string
  studentName?: string
}

export interface DetectionStats {
  totalDetected: number
  suspiciousCount: number
  lastUpdated: Date
  fps: number
}

export interface MonitoringSession {
  id: string
  startTime: Date
  endTime?: Date
  roomName?: string
  totalAlerts: number
  peakStudentCount: number
}

export interface CameraState {
  isActive: boolean
  hasPermission: boolean | null
  error: string | null
  facingMode: 'user' | 'environment'
}
