"use client"

import { useState, useMemo } from "react"
import type { User } from "@/types"
import { getUsers, getFirms } from "@/lib/storage"
import { getSubscriptions, getPlanDetails } from "@/lib/subscription-service"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { MoreVertical, Settings, Coins, Receipt, History, Ban } from "lucide-react"
import { differenceInDays, format } from "date-fns"
import { cn } from "@/lib/utils"
import { ManageSubscriptionModal } from "./manage-subscription-modal"
import { AdjustCreditsModal } from "./adjust-credits-modal"
import { BillingHistoryModal } from "./billing-history-modal"
import { ActivityLogModal } from "./activity-log-modal"

interface AdminFirmManagementProps {
  currentUser: User
}

export function AdminFirmManagement({ currentUser }: AdminFirmManagementProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>("all")
  const [selectedFirm, setSelectedFirm] = useState<any | null>(null)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [showBillingHistoryModal, setShowBillingHistoryModal] = useState(false)
  const [showActivityLogModal, setShowActivityLogModal] = useState(false)

  const firms = getFirms()
  const users = getUsers()
  const subscriptions = getSubscriptions()

  const firmData = useMemo(() => {
    return firms.map((firm) => {
      const firmUsers = users.filter((u) => u.firmId === firm.id)
      const primaryAdmin = firmUsers.find((u) => u.isPrimaryAdmin)
      const subscription = subscriptions.find((s) => s.firmId === firm.id)

      return {
        ...firm,
        primaryAdmin,
        totalUsers: firmUsers.length,
        subscription,
        subscriptionTier: subscription?.plan || "none",
        subscriptionStatus: subscription?.status || "none",
        availableCredits: subscription?.creditsRemaining || 0,
        totalCreditsUsed: subscription?.totalCreditsUsed || 0,
        totalCreditsEarned: subscription?.creditsPerMonth || 0,
        nextBillingDate: subscription?.nextBillingDate,
        trialEndsAt: subscription?.trialEndDate,
      }
    })
  }, [firms, users, subscriptions])

  const filteredFirms = useMemo(() => {
    return firmData.filter((firm) => {
      const matchesSearch =
        firm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        firm.sraNumber.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesFilter =
        subscriptionFilter === "all" ||
        firm.subscriptionTier === subscriptionFilter ||
        firm.subscriptionStatus === subscriptionFilter

      return matchesSearch && matchesFilter
    })
  }, [firmData, searchQuery, subscriptionFilter])

  const getCreditUsagePercentage = (firm: (typeof firmData)[0]) => {
    if (firm.totalCreditsEarned === 0) return 0
    return Math.round((firm.totalCreditsUsed / firm.totalCreditsEarned) * 100)
  }

  const getDaysUntil = (dateString?: string) => {
    if (!dateString) return null
    return differenceInDays(new Date(dateString), new Date())
  }

  const totalMRR = firmData
    .filter((f) => f.subscriptionStatus === "active")
    .reduce((sum, f) => {
      const plan = f.subscription ? getPlanDetails(f.subscription.plan) : null
      return sum + (plan?.price || 0)
    }, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Firm Management</h1>
          <p className="text-muted-foreground">Manage subscriptions, credits, and billing</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search firms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Subscription" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subscriptions</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="none">No Subscription</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total Firms</div>
            <div className="text-2xl font-bold">{firmData.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Active Subscriptions</div>
            <div className="text-2xl font-bold">{firmData.filter((f) => f.subscriptionStatus === "active").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Trial Accounts</div>
            <div className="text-2xl font-bold">{firmData.filter((f) => f.subscriptionStatus === "trial").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">MRR</div>
            <div className="text-2xl font-bold">£{totalMRR}</div>
          </CardContent>
        </Card>
      </div>

      {/* Firms Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Firm Name</TableHead>
              <TableHead>Primary Admin</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Billing</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFirms.map((firm) => {
              const daysUntilBilling = getDaysUntil(firm.nextBillingDate)
              const daysUntilTrialEnd = getDaysUntil(firm.trialEndsAt)
              const usagePercentage = getCreditUsagePercentage(firm)

              return (
                <TableRow key={firm.id}>
                  <TableCell>
                    <div>
                      <div className="font-semibold">{firm.name}</div>
                      <div className="text-sm text-muted-foreground">{firm.sraNumber || "No SRA"}</div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {firm.primaryAdmin ? (
                      <div>
                        <div className="text-sm">{firm.primaryAdmin.fullName}</div>
                        <div className="text-xs text-muted-foreground">{firm.primaryAdmin.email}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No admin</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {firm.subscriptionTier && firm.subscriptionTier !== "none" ? (
                      <div>
                        <Badge variant="default" className="capitalize">
                          {firm.subscriptionTier}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          £{getPlanDetails(firm.subscriptionTier as any)?.price}/mo
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline">No Subscription</Badge>
                    )}
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        firm.subscriptionStatus === "active"
                          ? "default"
                          : firm.subscriptionStatus === "trial"
                            ? "secondary"
                            : firm.subscriptionStatus === "expired"
                              ? "destructive"
                              : "outline"
                      }
                    >
                      {firm.subscriptionStatus}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div>
                      <div className="font-semibold">{firm.availableCredits}</div>
                      <div className="text-xs text-muted-foreground">
                        {firm.totalCreditsUsed} used / {firm.totalCreditsEarned} total
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Progress value={usagePercentage} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground w-10">{usagePercentage}%</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {firm.subscriptionStatus === "trial" && daysUntilTrialEnd !== null ? (
                      <div>
                        <div className="text-sm font-semibold">Trial</div>
                        <div
                          className={cn(
                            "text-xs",
                            daysUntilTrialEnd <= 7 ? "text-destructive font-semibold" : "text-muted-foreground",
                          )}
                        >
                          {daysUntilTrialEnd} days left
                        </div>
                      </div>
                    ) : firm.nextBillingDate && daysUntilBilling !== null ? (
                      <div>
                        <div className="text-sm">{format(new Date(firm.nextBillingDate), "MMM dd, yyyy")}</div>
                        <div className="text-xs text-muted-foreground">in {daysUntilBilling} days</div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedFirm(firm)
                            setShowSubscriptionModal(true)
                          }}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Manage Subscription
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedFirm(firm)
                            setShowCreditModal(true)
                          }}
                        >
                          <Coins className="mr-2 h-4 w-4" />
                          Adjust Credits
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedFirm(firm)
                            setShowBillingHistoryModal(true)
                          }}
                        >
                          <Receipt className="mr-2 h-4 w-4" />
                          Billing History
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedFirm(firm)
                            setShowActivityLogModal(true)
                          }}
                        >
                          <History className="mr-2 h-4 w-4" />
                          Activity Log
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            // Handle cancel subscription
                          }}
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Cancel Subscription
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Modals */}
      {selectedFirm && (
        <>
          <ManageSubscriptionModal
            open={showSubscriptionModal}
            onClose={() => setShowSubscriptionModal(false)}
            firm={selectedFirm}
            currentUser={currentUser}
          />

          <AdjustCreditsModal
            open={showCreditModal}
            onClose={() => setShowCreditModal(false)}
            firm={selectedFirm}
            currentUser={currentUser}
          />

          <BillingHistoryModal
            open={showBillingHistoryModal}
            onClose={() => setShowBillingHistoryModal(false)}
            firm={selectedFirm}
          />

          <ActivityLogModal
            open={showActivityLogModal}
            onClose={() => setShowActivityLogModal(false)}
            firm={selectedFirm}
          />
        </>
      )}
    </div>
  )
}
