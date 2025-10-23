"use client"

import { useState, useMemo } from "react"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, ArrowRight, Plus, Minus, Edit } from "lucide-react"
import { format } from "date-fns"
import { adminAdjustCredits } from "@/lib/subscription-service"
import { getCreditTransactions } from "@/lib/subscription-service"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface AdjustCreditsModalProps {
  open: boolean
  onClose: () => void
  firm: any
  currentUser: User
}

export function AdjustCreditsModal({ open, onClose, firm, currentUser }: AdjustCreditsModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove" | "set">("add")
  const [amount, setAmount] = useState<number>(0)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  const creditHistory = getCreditTransactions(firm.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  const handleAdjustCredits = () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for this adjustment")
      return
    }

    if (amount <= 0) {
      toast.error("Amount must be greater than 0")
      return
    }

    setLoading(true)
    try {
      adminAdjustCredits(
        currentUser.id,
        currentUser.fullName,
        firm.primaryAdmin?.id || "",
        firm.primaryAdmin?.fullName || "",
        firm.id,
        firm.name,
        adjustmentType,
        amount,
        reason,
        firm.availableCredits,
      )

      const action = adjustmentType === "add" ? "added" : adjustmentType === "remove" ? "removed" : "set to"
      toast.success(`Credits ${action}: ${amount}`)
      onClose()
    } catch (error) {
      toast.error("Failed to adjust credits")
    } finally {
      setLoading(false)
    }
  }

  const previewBalance = useMemo(() => {
    const current = firm.availableCredits
    if (adjustmentType === "add") return current + amount
    if (adjustmentType === "remove") return Math.max(0, current - amount)
    return amount
  }, [adjustmentType, amount, firm.availableCredits])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adjust Credits - {firm.name}</DialogTitle>
          <DialogDescription>Manually add, remove, or set credit balance</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Balance */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-3xl font-bold">{firm.availableCredits}</p>
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">New Balance</p>
                  <p className="text-3xl font-bold text-primary">{previewBalance}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Adjustment Type */}
          <div className="space-y-3">
            <Label>Adjustment Type</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={adjustmentType === "add" ? "default" : "outline"}
                onClick={() => setAdjustmentType("add")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
              <Button
                variant={adjustmentType === "remove" ? "default" : "outline"}
                onClick={() => setAdjustmentType("remove")}
              >
                <Minus className="mr-2 h-4 w-4" />
                Remove
              </Button>
              <Button
                variant={adjustmentType === "set" ? "default" : "outline"}
                onClick={() => setAdjustmentType("set")}
              >
                <Edit className="mr-2 h-4 w-4" />
                Set To
              </Button>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>
              {adjustmentType === "add"
                ? "Credits to Add"
                : adjustmentType === "remove"
                  ? "Credits to Remove"
                  : "Set Balance To"}
            </Label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount || ""}
              onChange={(e) => setAmount(Number.parseInt(e.target.value) || 0)}
              min={0}
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason for Adjustment *</Label>
            <Textarea
              placeholder="Explain why you're making this adjustment..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This will be visible in the firm's credit history and admin logs
            </p>
          </div>

          {/* Warning for large removals */}
          {adjustmentType === "remove" && amount > firm.availableCredits && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Warning: You're removing more credits than available. Balance will be set to 0.
              </AlertDescription>
            </Alert>
          )}

          {/* Recent History */}
          <div className="space-y-2">
            <Label>Recent Credit History</Label>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creditHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No credit history
                        </TableCell>
                      </TableRow>
                    ) : (
                      creditHistory.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-xs">{format(new Date(tx.createdAt), "MMM dd, yyyy")}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                tx.type === "allocation" ? "default" : tx.type === "usage" ? "secondary" : "outline"
                              }
                            >
                              {tx.type}
                            </Badge>
                            {tx.adminAdjustment && (
                              <Badge variant="outline" className="ml-1">
                                Admin
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className={cn("font-semibold", tx.amount > 0 ? "text-green-600" : "text-red-600")}>
                            {tx.amount > 0 ? "+" : ""}
                            {tx.amount}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{tx.reason}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdjustCredits} disabled={loading || amount <= 0}>
            {loading ? "Adjusting..." : "Apply Adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
