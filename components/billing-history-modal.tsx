"use client"

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"

interface BillingHistoryModalProps {
  open: boolean
  onClose: () => void
  firm: any
}

export function BillingHistoryModal({ open, onClose, firm }: BillingHistoryModalProps) {
  // Mock payment data
  const payments = [
    {
      id: "PAY_001",
      date: "2025-01-15",
      type: "subscription",
      description: "Professional Plan - January 2025",
      amount: 95,
      status: "succeeded",
    },
    {
      id: "PAY_002",
      date: "2024-12-15",
      type: "subscription",
      description: "Professional Plan - December 2024",
      amount: 95,
      status: "succeeded",
    },
  ]

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Billing History - {firm.name}</DialogTitle>
          <DialogDescription>Payment and refund history for this firm</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total Paid</div>
                <div className="text-2xl font-bold">£{totalPaid}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total Refunded</div>
                <div className="text-2xl font-bold">£0</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Net Revenue</div>
                <div className="text-2xl font-bold">£{totalPaid}</div>
              </CardContent>
            </Card>
          </div>

          {/* Payments Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="text-sm">{format(new Date(payment.date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{payment.description}</TableCell>
                      <TableCell className="font-semibold">£{payment.amount}</TableCell>
                      <TableCell>
                        <Badge variant={payment.status === "succeeded" ? "default" : "secondary"}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
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
