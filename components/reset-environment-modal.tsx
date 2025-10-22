"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2, CheckCircle2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface ResetEnvironmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  stayLoggedIn?: boolean
}

export function ResetEnvironmentModal({
  open,
  onOpenChange,
  onConfirm,
  stayLoggedIn = true,
}: ResetEnvironmentModalProps) {
  const [isResetting, setIsResetting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")

  const handleReset = async () => {
    setIsResetting(true)
    setProgress(0)

    // Simulate progress steps
    const steps = [
      { label: "Clearing old data", duration: 300 },
      { label: "Generating searches (100)", duration: 800 },
      { label: "Generating wills (50)", duration: 500 },
      { label: "Generating firms (25)", duration: 400 },
      { label: "Complete!", duration: 200 },
    ]

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(steps[i].label)
      setProgress(((i + 1) / steps.length) * 100)
      await new Promise((resolve) => setTimeout(resolve, steps[i].duration))
    }

    onConfirm()
    setIsResetting(false)
    setProgress(0)
    setCurrentStep("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isResetting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-warning" />
            )}
            {isResetting ? "Resetting Environment..." : "Reset Demo Environment?"}
          </DialogTitle>
          <div className="text-muted-foreground text-sm">
            {isResetting ? (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    {progress === 100 ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    <span>{currentStep}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <p>This will:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Clear all current data</li>
                  <li>Generate fresh mock data (~100 searches, 50 wills, 25 firms)</li>
                  <li>Reset to initial state</li>
                </ul>
                <p className="text-sm pt-2">
                  {stayLoggedIn
                    ? "Your current role and session will be preserved."
                    : "You will be returned to the login screen."}
                </p>
              </div>
            )}
          </div>
        </DialogHeader>
        {!isResetting && (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              Reset Environment
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
