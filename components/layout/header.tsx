"use client"

import { useState, useEffect } from "react"
import type { User } from "@/types"
import { RoleSwitcher } from "@/components/role-switcher"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { RotateCcw, ChevronDown, Loader2 } from "lucide-react"
import { ResetEnvironmentModal } from "@/components/reset-environment-modal"
import { resetEnvironment } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"
import { getJobs, getActiveJobsCount } from "@/lib/job-manager"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface HeaderProps {
  currentUser: User
  onRoleChange: (role: User["userRole"]) => void
  onLogout?: () => void
  onNavigate?: (page: string) => void
}

export function Header({ currentUser, onRoleChange, onLogout, onNavigate }: HeaderProps) {
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetAndLogout, setResetAndLogout] = useState(false)
  const [activeJobsCount, setActiveJobsCount] = useState(0)
  const [showJobsDropdown, setShowJobsDropdown] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const updateJobsCount = () => {
      const count = getActiveJobsCount()
      setActiveJobsCount(count)
    }

    updateJobsCount()
    const interval = setInterval(updateJobsCount, 2000)

    return () => clearInterval(interval)
  }, [])

  const handleReset = (shouldLogout: boolean) => {
    setResetAndLogout(shouldLogout)
    setShowResetModal(true)
  }

  const handleConfirmReset = () => {
    resetEnvironment()
    toast({
      title: "Environment Reset",
      description: "Fresh demo data has been loaded successfully.",
    })

    if (resetAndLogout && onLogout) {
      setTimeout(() => {
        onLogout()
      }, 500)
    } else {
      // Refresh the page to reload data
      window.location.reload()
    }
  }

  const activeJobs = getJobs().filter((j) => j.status === "processing" || j.status === "queued")

  return (
    <header className="border-b bg-background p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{currentUser.userName}</h1>
          <p className="text-sm text-muted-foreground">{currentUser.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {activeJobsCount > 0 && (
            <DropdownMenu open={showJobsDropdown} onOpenChange={setShowJobsDropdown}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 relative bg-transparent">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{activeJobsCount} Active</span>
                  <Badge
                    variant="secondary"
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center"
                  >
                    {activeJobsCount}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">Active Jobs</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowJobsDropdown(false)
                        onNavigate?.("jobs")
                      }}
                    >
                      View All
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {activeJobs.slice(0, 3).map((job) => {
                      const progress = job.totalRecords > 0 ? (job.processedRecords / job.totalRecords) * 100 : 0
                      return (
                        <div key={job.id} className="space-y-2 p-2 bg-muted rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium truncate">{job.fileName}</p>
                              <p className="text-xs text-muted-foreground">
                                {job.processedRecords} / {job.totalRecords} records
                              </p>
                            </div>
                            <Badge variant={job.status === "processing" ? "default" : "secondary"} className="text-xs">
                              {job.status}
                            </Badge>
                          </div>
                          <Progress value={progress} className="h-1" />
                        </div>
                      )
                    })}
                    {activeJobs.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">+{activeJobs.length - 3} more jobs</p>
                    )}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <RoleSwitcher currentUser={currentUser} onRoleChange={onRoleChange} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <RotateCcw className="h-4 w-4" />
                Reset
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleReset(false)}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset & Stay Logged In
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleReset(true)}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset & Return to Login
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ResetEnvironmentModal
        open={showResetModal}
        onOpenChange={setShowResetModal}
        onConfirm={handleConfirmReset}
        stayLoggedIn={!resetAndLogout}
      />
    </header>
  )
}
