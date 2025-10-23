"use client"

import { useState } from "react"
import type { User } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { format, differenceInDays } from "date-fns"
import { adminChangeSubscriptionTier, adminExtendTrial, adminReactivateSubscription } from "@/lib/subscription-service"
import { toast } from "sonner"

interface ManageSubscriptionModalProps {
  open: boolean
  onClose: () => void
  firm: any
  currentUser: User
}

export function ManageSubscriptionModal({ open, onClose, firm, currentUser }: ManageSubscriptionModalProps) {
  const [newTier, setNewTier] = useState(firm.subscriptionTier)
  const [extendTrial, setExtendTrial] = useState(0)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChangeTier = () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for this change")
      return
    }

    setLoading(true)
    try {
      adminChangeSubscriptionTier(
        currentUser.id,
        currentUser.fullName,
        firm.primaryAdmin?.id || "",
        firm.primaryAdmin?.fullName || "",
        firm.id,
        firm.name,
        firm.subscriptionTier,
        newTier,
        reason,
      )

      toast.success(`Subscription changed to ${newTier}`)
      onClose()
    } catch (error) {
      toast.error("Failed to change subscription")
    } finally {
      setLoading(false)
    }
  }

  const handleExtendTrial = () => {
    if (extendTrial <= 0 || !reason.trim()) {
      toast.error("Please provide days and reason")
      return
    }

    setLoading(true)
    try {
      adminExtendTrial(
        currentUser.id,
        currentUser.fullName,
        firm.primaryAdmin?.id || "",
        firm.primaryAdmin?.fullName || "",
        firm.id,
        firm.name,
        extendTrial,
        firm.trialEndsAt || new Date().toISOString(),
        reason,
      )

      toast.success(`Trial extended by ${extendTrial} days`)
      onClose()
    } catch (error) {
      toast.error("Failed to extend trial")
    } finally {
      setLoading(false)
    }
  }

  const handleReactivate = () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason")
      return
    }

    setLoading(true)
    try {
      adminReactivateSubscription(
        currentUser.id,
        currentUser.fullName,
        firm.primaryAdmin?.id || "",
        firm.primaryAdmin?.fullName || "",
        firm.id,
        firm.name,
        reason,
      )

      toast.success("Subscription reactivated")
      onClose()
    } catch (error) {
      toast.error("Failed to reactivate subscription")
    } finally {
      setLoading(false)
    }
  }

  const getDaysUntil = (dateString?: string) => {
    if (!dateString) return 0
    return differenceInDays(new Date(dateString), new Date())
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Subscription - {firm.name}</DialogTitle>
          <DialogDescription>Admin controls for subscription management</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Subscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tier:</span>
                <Badge className="capitalize">{firm.subscriptionTier}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={firm.subscriptionStatus === "active" ? "default" : "secondary"}>
                  {firm.subscriptionStatus}
                </Badge>
              </div>
              {firm.subscriptionStatus === "trial" && firm.trialEndsAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Trial Ends:</span>
                  <span className="text-sm font-semibold">
                    {format(new Date(firm.trialEndsAt), "MMM dd, yyyy")} ({getDaysUntil(firm.trialEndsAt)} days)
                  </span>
                </div>
              )}
              {firm.nextBillingDate && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Next Billing:</span>
                  <span className="text-sm">{format(new Date(firm.nextBillingDate), "MMM dd, yyyy")}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Change Tier */}
          <div className="space-y-3">
            <Label>Change Subscription Tier</Label>
            <Select value={newTier} onValueChange={setNewTier}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Subscription</SelectItem>
                <SelectItem value="starter">Starter (£45/mo, 12 credits)</SelectItem>
                <SelectItem value="professional">Professional (£95/mo, 25 credits)</SelectItem>
              </SelectContent>
            </Select>
            {newTier !== firm.subscriptionTier && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Changing tier will take effect immediately.
                  {newTier !== "none" && " Credits will be adjusted to match new tier."}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Extend Trial */}
          {firm.subscriptionStatus === "trial" && (
            <div className="space-y-3">
              <Label>Extend Trial Period</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Days"
                  value={extendTrial || ""}
                  onChange={(e) => setExtendTrial(Number.parseInt(e.target.value) || 0)}
                  className="w-32"
                />
                <Button onClick={handleExtendTrial} disabled={loading}>
                  Extend Trial
                </Button>
              </div>
            </div>
          )}

          {/* Reactivate */}
          {(firm.subscriptionStatus === "expired" || firm.subscriptionStatus === "cancelled") && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This subscription is {firm.subscriptionStatus}. You can reactivate it below.
              </AlertDescription>
            </Alert>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason for Change *</Label>
            <Textarea
              placeholder="Explain why you're making this change..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">This will be logged in the admin activity log</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {firm.subscriptionStatus === "expired" || firm.subscriptionStatus === "cancelled" ? (
            <Button onClick={handleReactivate} disabled={loading}>
              {loading ? "Reactivating..." : "Reactivate Subscription"}
            </Button>
          ) : (
            <Button onClick={handleChangeTier} disabled={loading || newTier === firm.subscriptionTier}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
