"use client"

import { useState } from "react"
import type { User } from "@/types"
import { getSearches } from "@/lib/storage"
import { getSubscriptionByFirmId, getCreditTransactions, getPlanDetails } from "@/lib/subscription-service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { CreditCard, Coins, ArrowUpCircle } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { SubscriptionUpgradeModal } from "@/components/subscription-upgrade-modal"

interface BillingPageProps {
  currentUser: User
}

export function BillingPage({ currentUser }: BillingPageProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const searches = getSearches()
  const subscription = currentUser.firmId ? getSubscriptionByFirmId(currentUser.firmId) : undefined
  const creditTransactions = currentUser.firmId ? getCreditTransactions(currentUser.firmId) : []

  const thisMonthSearches = searches.filter((s) => {
    const date = new Date(s.requestDate)
    const now = new Date()
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  })

  const totalSpent = thisMonthSearches.reduce((sum, s) => sum + s.price, 0)
  const basicCount = thisMonthSearches.filter((s) => s.searchType === "basic").length
  const advancedCount = thisMonthSearches.filter((s) => s.searchType === "advanced").length

  const planDetails = subscription ? getPlanDetails(subscription.plan) : null
  const creditUtilization =
    subscription && subscription.creditsPerMonth > 0
      ? (subscription.creditsUsedThisMonth / subscription.creditsPerMonth) * 100
      : 0

  const handleUpgrade = (plan: "starter" | "professional") => {
    console.log("[v0] Upgrading to plan:", plan)
    // In real implementation, this would call an API
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">Manage your subscription, credits, and billing</p>
      </div>

      {/* Current Plan */}
      {subscription ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Your subscription details and usage</CardDescription>
              </div>
              <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                {subscription.status === "trial" ? "Free Trial" : subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{planDetails?.name} Plan</p>
                <p className="text-sm text-muted-foreground">
                  {subscription.status === "trial"
                    ? `Trial ends ${formatDate(subscription.trialEndDate || "")}`
                    : `Next billing: ${formatDate(subscription.nextBillingDate)}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">£{subscription.monthlyPrice}</p>
                <p className="text-sm text-muted-foreground">per month</p>
              </div>
            </div>

            {/* Credits Overview */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Credits This Month</span>
                </div>
                <span className="text-2xl font-bold">
                  {subscription.creditsRemaining} / {subscription.creditsPerMonth}
                </span>
              </div>
              <Progress value={creditUtilization} className="h-2" />
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Used</p>
                  <p className="font-semibold">{subscription.creditsUsedThisMonth} credits</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Remaining</p>
                  <p className="font-semibold">{subscription.creditsRemaining} credits</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Resets</p>
                  <p className="font-semibold">{formatDate(subscription.nextBillingDate)}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setShowUpgradeModal(true)} variant="outline">
                <ArrowUpCircle className="mr-2 h-4 w-4" />
                {subscription.plan === "professional" ? "Change Plan" : "Upgrade Plan"}
              </Button>
              {subscription.status === "trial" && <Button>Activate Subscription</Button>}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Active Subscription</CardTitle>
            <CardDescription>Upgrade to a subscription plan for better rates and credits</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowUpgradeModal(true)}>
              <ArrowUpCircle className="mr-2 h-4 w-4" />
              View Plans
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Usage This Month */}
      <Card>
        <CardHeader>
          <CardTitle>Usage This Month</CardTitle>
          <CardDescription>Your search activity and costs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Searches</p>
              <p className="text-2xl font-bold">{thisMonthSearches.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Basic Searches</p>
              <p className="text-2xl font-bold">{basicCount}</p>
              <p className="text-sm text-muted-foreground">{basicCount} credits used</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Advanced Searches</p>
              <p className="text-2xl font-bold">{advancedCount}</p>
              <p className="text-sm text-muted-foreground">{advancedCount * 2} credits used</p>
            </div>
          </div>
          {!subscription && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Total Amount (Pay-as-you-go)</p>
                <p className="text-2xl font-bold">£{totalSpent}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credit History */}
      {subscription && creditTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Credit History</CardTitle>
            <CardDescription>Recent credit allocations and usage</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditTransactions.slice(0, 10).map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={transaction.type === "allocation" ? "default" : "secondary"}>
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{transaction.reason}</TableCell>
                    <TableCell>
                      <span className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                        {transaction.amount > 0 ? "+" : ""}
                        {transaction.amount}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold">{transaction.balance}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <CreditCard className="h-8 w-8 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-semibold">Visa ending in 4242</p>
              <p className="text-sm text-muted-foreground">Expires 12/2025</p>
            </div>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </div>
          <Button variant="outline" className="w-full bg-transparent">
            Add Payment Method
          </Button>
        </CardContent>
      </Card>

      <SubscriptionUpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={subscription?.plan}
        onUpgrade={handleUpgrade}
      />
    </div>
  )
}
