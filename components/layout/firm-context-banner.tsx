"use client"

import { Info, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FirmContextBannerProps {
  firm: {
    id: string
    name: string
    sraNumber: string
  }
  context?: string
  onChangeFirm: () => void
  onClose?: () => void
}

export function FirmContextBanner({ firm, context, onChangeFirm, onClose }: FirmContextBannerProps) {
  return (
    <div className="bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800 p-4 sticky top-0 z-10">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Info className="h-5 w-5 text-blue-600" />
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Registering for: </span>
            <span className="font-semibold">{firm.name}</span>
            {context && <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">• Context: {context}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onChangeFirm}>
            Change Firm
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
