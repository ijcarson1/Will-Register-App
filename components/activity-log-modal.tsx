"use client"

import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Coins, Settings, Clock, RefreshCw, Ban, CheckCircle, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { getAdminActions } from "@/lib/subscription-service"

interface ActivityLogModalProps {
  open: boolean
  onClose: () => void
  firm: any
}

export function ActivityLogModal({ open, onClose, firm }: ActivityLogModalProps) {
  const [filter, setFilter] = useState<string>("all")

  const logs = getAdminActions()
    .filter((log) => log.targetFirmId === firm.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const filteredLogs = useMemo(() => {
    if (filter === "all") return logs
    return logs.filter((log) => log.action === filter)
  }, [logs, filter])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Admin Activity Log - {firm.name}</DialogTitle>
          <DialogDescription>History of admin actions for this firm</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filter */}
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filter actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="credit_adjustment">Credit Adjustments</SelectItem>
              <SelectItem value="subscription_change">Subscription Changes</SelectItem>
              <SelectItem value="trial_extension">Trial Extensions</SelectItem>
              <SelectItem value="refund">Refunds</SelectItem>
              <SelectItem value="subscription_cancel">Cancellations</SelectItem>
              <SelectItem value="subscription_reactivate">Reactivations</SelectItem>
            </SelectContent>
          </Select>

          {/* Activity Timeline */}
          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">No activity logs found</CardContent>
              </Card>
            ) : (
              filteredLogs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {log.action === "credit_adjustment" && <Coins className="h-5 w-5 text-primary" />}
                        {log.action === "subscription_change" && <Settings className="h-5 w-5 text-primary" />}
                        {log.action === "trial_extension" && <Clock className="h-5 w-5 text-primary" />}
                        {log.action === "refund" && <RefreshCw className="h-5 w-5 text-primary" />}
                        {log.action === "subscription_cancel" && <Ban className="h-5 w-5 text-destructive" />}
                        {log.action === "subscription_reactivate" && <CheckCircle className="h-5 w-5 text-green-600" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">
                            {log.action
                              .split("_")
                              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                              .join(" ")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(log.createdAt), "MMM dd, yyyy HH:mm")}
                          </p>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          By <span className="font-semibold">{log.adminName}</span>
                        </p>

                        {/* Details */}
                        {log.previousValue && log.newValue && (
                          <div className="flex items-center gap-2 text-sm mt-2">
                            <Badge variant="outline">{log.previousValue}</Badge>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <Badge variant="default">{log.newValue}</Badge>
                          </div>
                        )}

                        {/* Reason */}
                        <div className="mt-2 p-2 bg-muted rounded text-sm">
                          <span className="font-semibold">Reason: </span>
                          {log.reason}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
