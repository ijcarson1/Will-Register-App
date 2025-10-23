"use client"

import { useState } from "react"
import type { User } from "@/types"
import { getFirmSubscriptionStats } from "@/lib/subscription-service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, DollarSign, Users, ArrowUpRight, Coins } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface AdminSubscriptionOverviewProps {
  currentUser: User
  onNavigate: (page: string, data?: any) => void
}

export function AdminSubscriptionOverview({ currentUser, onNavigate }: AdminSubscriptionOverviewProps) {
  const [selectedTab, setSelectedTab] = useState("overview")
  const firmStats = getFirmSubscriptionStats()

  // Calculate totals
  const totalMonthlyRevenue = firmStats.reduce((sum, firm) => sum + firm.monthlyRevenue, 0)
  const totalLifetimeRevenue = firmStats.reduce((sum, firm) => sum + firm.totalRevenue, 0)
  const totalActiveFirms = firmStats.filter((f) => f.status === "active").length
  const totalTrialFirms = firmStats.filter((f) => f.status === "trial").length
  const averageUtilization =
    firmStats.length > 0
      ? Math.round(firmStats.reduce((sum, firm) => sum + firm.utilizationRate, 0) / firmStats.length)
      : 0

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      trial: "secondary",
      expired: "destructive",
      cancelled: "outline",
    }
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>
  }

  const getPlanBadge = (plan: string) => {
    return (
      <Badge variant={plan === "professional" ? "default" : "secondary"}>
        {plan === "professional" ? "Professional" : "Starter"}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscription Overview</h1>
        <p className="text-muted-foreground">Monitor firm subscriptions, revenue, and usage</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{totalMonthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-600" />
              <span className="text-green-600">12% from last month</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lifetime Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{totalLifetimeRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Total revenue to date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Firms</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActiveFirms}</div>
            <p className="text-xs text-muted-foreground mt-1">{totalTrialFirms} in trial period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Utilization</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageUtilization}%</div>
            <Progress value={averageUtilization} className="h-1 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="firms">Firm Details</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Firm Subscriptions</CardTitle>
              <CardDescription>All firms with active or trial subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Firm Name</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Utilization</TableHead>
                    <TableHead>Monthly Revenue</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {firmStats.map((firm) => (
                    <TableRow key={firm.firmId}>
                      <TableCell className="font-medium">{firm.firmName}</TableCell>
                      <TableCell>{getPlanBadge(firm.plan)}</TableCell>
                      <TableCell>{getStatusBadge(firm.status)}</TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {firm.creditsRemaining}/{firm.creditsAllocated}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={firm.utilizationRate} className="h-2 w-16" />
                          <span className="text-sm text-muted-foreground">{firm.utilizationRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">£{firm.monthlyRevenue}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Firm Details Tab */}
        <TabsContent value="firms" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {firmStats.map((firm) => (
              <Card key={firm.firmId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{firm.firmName}</CardTitle>
                    {getStatusBadge(firm.status)}
                  </div>
                  <CardDescription>{getPlanBadge(firm.plan)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Monthly Revenue</p>
                      <p className="font-semibold text-lg">£{firm.monthlyRevenue}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Lifetime Value</p>
                      <p className="font-semibold text-lg">£{firm.lifetimeValue}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Credits Used</p>
                      <p className="font-semibold">
                        {firm.creditsUsed}/{firm.creditsAllocated}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Active Users</p>
                      <p className="font-semibold">{firm.activeUsers}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Credit Utilization</span>
                      <span className="font-semibold">{firm.utilizationRate}%</span>
                    </div>
                    <Progress value={firm.utilizationRate} className="h-2" />
                  </div>
                  <div className="pt-4 border-t text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Next Billing</span>
                      <span className="font-medium">{formatDate(firm.nextBillingDate)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-muted-foreground">Customer Since</span>
                      <span className="font-medium">{firm.daysSinceStart} days</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Revenue Analysis Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Professional Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{firmStats.filter((f) => f.plan === "professional").length}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  £{firmStats.filter((f) => f.plan === "professional").reduce((sum, f) => sum + f.monthlyRevenue, 0)}/mo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Starter Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{firmStats.filter((f) => f.plan === "starter").length}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  £{firmStats.filter((f) => f.plan === "starter").reduce((sum, f) => sum + f.monthlyRevenue, 0)}/mo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Avg. Revenue per Firm</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  £{firmStats.length > 0 ? Math.round(totalMonthlyRevenue / firmStats.length) : 0}
                </div>
                <p className="text-sm text-muted-foreground mt-1">per month</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue by Firm</CardTitle>
              <CardDescription>Sorted by lifetime value</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Firm Name</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Monthly Revenue</TableHead>
                    <TableHead>Lifetime Value</TableHead>
                    <TableHead>Searches (Total)</TableHead>
                    <TableHead>Days Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...firmStats]
                    .sort((a, b) => b.lifetimeValue - a.lifetimeValue)
                    .map((firm) => (
                      <TableRow key={firm.firmId}>
                        <TableCell className="font-medium">{firm.firmName}</TableCell>
                        <TableCell>{getPlanBadge(firm.plan)}</TableCell>
                        <TableCell className="font-semibold">£{firm.monthlyRevenue}</TableCell>
                        <TableCell className="font-semibold">£{firm.lifetimeValue}</TableCell>
                        <TableCell>{firm.searchesTotal}</TableCell>
                        <TableCell>{firm.daysSinceStart}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
