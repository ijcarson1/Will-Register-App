"use client"

import { useState } from "react"
import type { UserRole } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Users, UserCircle, RotateCcw } from "lucide-react"
import { ResetEnvironmentModal } from "@/components/reset-environment-modal"
import { resetEnvironment } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"

interface LoginPageProps {
  onRoleSelect: (role: UserRole) => void
}

export function LoginPage({ onRoleSelect }: LoginPageProps) {
  const [showResetModal, setShowResetModal] = useState(false)
  const { toast } = useToast()

  const handleReset = () => {
    resetEnvironment()
    toast({
      title: "Environment Reset",
      description: "Fresh demo data has been loaded successfully.",
    })
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-2xl relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 gap-2"
          onClick={() => setShowResetModal(true)}
        >
          <RotateCcw className="h-4 w-4" />
          Reset Demo
        </Button>

        <CardHeader className="text-center">
          <CardTitle className="text-3xl">WillReg Platform</CardTitle>
          <CardDescription>Select your role to continue</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-32 flex flex-col gap-2 bg-transparent"
            onClick={() => onRoleSelect("admin")}
          >
            <Users className="h-8 w-8" />
            <div className="font-semibold">Admin</div>
            <div className="text-xs text-muted-foreground">Backend processing</div>
          </Button>
          <Button
            variant="outline"
            className="h-32 flex flex-col gap-2 bg-transparent"
            onClick={() => onRoleSelect("firm")}
          >
            <Building2 className="h-8 w-8" />
            <div className="font-semibold">Firm User</div>
            <div className="text-xs text-muted-foreground">Law firm access</div>
          </Button>
          <Button
            variant="outline"
            className="h-32 flex flex-col gap-2 bg-transparent"
            onClick={() => onRoleSelect("individual")}
          >
            <UserCircle className="h-8 w-8" />
            <div className="font-semibold">Individual</div>
            <div className="text-xs text-muted-foreground">Consumer search</div>
          </Button>
        </CardContent>
      </Card>

      <ResetEnvironmentModal
        open={showResetModal}
        onOpenChange={setShowResetModal}
        onConfirm={handleReset}
        stayLoggedIn={false}
      />
    </div>
  )
}
