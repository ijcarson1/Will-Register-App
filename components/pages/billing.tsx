"use client"

import type { User } from "@/types"
import { getSearches } from "@/lib/storage"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CreditCard, Download } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface BillingPageProps {
  currentUser: User
}

export function BillingPage({ currentUser }: BillingPageProps) {
  const searches = getSearches()
  const thisMonthSearches = searches.filter((s) => {
    const date = new Date(s.requestDate)
    const now = new Date()
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  })

  const totalSpent = thisMonthSearches.reduce((sum, s) => sum + s.price, 0)
  const basicCount = thisMonthSearches.filter((s) => s.searchType === "basic").length
  const advancedCount = thisMonthSearches.filter((s) => s.searchType === "advanced").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and billing</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">Free Trial</p>
              <p className="text-sm text-muted-foreground">6 months remaining</p>
            </div>
            <Badge variant="secondary">Active</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Your free trial includes unlimited will registrations and pay-as-you-go searches.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage This Month</CardTitle>
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
              <p className="text-sm text-muted-foreground">£{basicCount * 35}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Advanced Searches</p>
              <p className="text-2xl font-bold">{advancedCount}</p>
              <p className="text-sm text-muted-foreground">£{advancedCount * 65}</p>
            </div>
          </div>
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Total Amount</p>
              <p className="text-2xl font-bold">£{totalSpent}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Options</CardTitle>
          <CardDescription>Upgrade to a monthly plan for better rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xl font-bold">Professional Plan</p>
                <p className="text-sm text-muted-foreground">Best for active firms</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">£45</p>
                <p className="text-sm text-muted-foreground">per month</p>
              </div>
            </div>
            <ul className="space-y-2 mb-6">
              <li className="text-sm">• Unlimited will registrations</li>
              <li className="text-sm">• Discounted search rates (£30 basic, £55 advanced)</li>
              <li className="text-sm">• Priority processing</li>
              <li className="text-sm">• Dedicated support</li>
            </ul>
            <Button className="w-full">Upgrade to Professional</Button>
          </div>
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {thisMonthSearches.slice(0, 5).map((search) => (
                <TableRow key={search.id}>
                  <TableCell>{formatDate(search.requestDate)}</TableCell>
                  <TableCell>
                    {search.searchType === "advanced" ? "Advanced" : "Basic"} Search - {search.deceasedName}
                  </TableCell>
                  <TableCell>£{search.price}</TableCell>
                  <TableCell>
                    <Badge variant="default">Paid</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
