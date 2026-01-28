'use client'

import { Shield, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">
              ClassGuard
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              AI Classroom Monitor
            </p>
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Info className="h-4 w-4" />
              <span className="sr-only">About ClassGuard</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                About ClassGuard
              </DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-4 pt-4 text-sm text-muted-foreground">
                  <p>
                    ClassGuard is an AI-powered classroom monitoring system designed for educational use. 
                    It uses computer vision to detect and count students in real-time.
                  </p>
                  
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Features:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Real-time student detection and counting</li>
                      <li>Suspicious behavior monitoring</li>
                      <li>Phone detection alerts</li>
                      <li>Movement pattern analysis</li>
                      <li>Works on any device with a camera</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground mb-2">Privacy Notice:</h4>
                    <p>
                      All processing happens locally in your browser. No video data is sent to any server. 
                      This tool is intended for educational assistance only, not automatic punishment.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <p className="text-xs">
                      Powered by TensorFlow.js and COCO-SSD object detection model.
                    </p>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  )
}
