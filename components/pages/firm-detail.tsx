"use client"

import { getFirmById } from "@/lib/storage"
import { getSubscriptionByFirmId, getCreditTransactions, getPlanDetails } from "@/lib/subscription-service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Edit, Coins } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface FirmDetailPageProps {
  firmId: string
  onNavigate: (page: string) => void
}

export function FirmDetailPage({ firmId, onNavigate }: FirmDetailPageProps) {
  const firm = getFirmById(firmId)
  const subscription = getSubscriptionByFirmId(firmId)
  const creditTransactions = getCreditTransactions(firmId)
  const planDetails = subscription ? getPlanDetails(subscription.plan) : null

  if (!firm) {
    return <div>Firm not found</div>
  }

  const creditUtilization =
    subscription && subscription.creditsPerMonth > 0
      ? (subscription.creditsUsedThisMonth / subscription.creditsPerMonth) * 100
      : 0

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => onNavigate("firm-database")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Database
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{firm.name}</h1>
          <p className="text-muted-foreground">SRA: {firm.sraNumber}</p>
        </div>
        <Button>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      {subscription && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Subscription Details
                </CardTitle>
                <CardDescription>Current plan and credit usage</CardDescription>
              </div>
              <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                {subscription.status === "trial" ? "Free Trial" : subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="text-lg font-bold">{planDetails?.name}</p>
                <p className="text-sm text-muted-foreground">£{subscription.monthlyPrice}/mo</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Credits This Month</p>
                <p className="text-lg font-bold">
                  {subscription.creditsRemaining} / {subscription.creditsPerMonth}
                </p>
                <Progress value={creditUtilization} className="h-1 mt-1" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Utilization</p>
                <p className="text-lg font-bold">{Math.round(creditUtilization)}%</p>
                <p className="text-sm text-muted-foreground">{subscription.creditsUsedThisMonth} used</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Billing</p>
                <p className="text-lg font-bold">{formatDate(subscription.nextBillingDate)}</p>
                <p className="text-sm text-muted-foreground">
                  {subscription.status === "trial" ? "Trial ends" : "Renews"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Change Plan
              </Button>
              <Button variant="outline" size="sm">
                Add Credits
              </Button>
              {subscription.status === "trial" && (
                <Button size="sm" variant="default">
                  Activate Subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Firm Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-semibold">{firm.address}</p>
              <p className="font-semibold">{firm.postcode}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-semibold">{firm.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-semibold">{firm.email}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Practice Areas</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {firm.practiceAreas.map((area, i) => (
                  <Badge key={i} variant="secondary">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Response Rate</p>
              <p className="text-2xl font-bold">{firm.responseRate}%</p>
            </div>
            {firm.lastContact && (
              <div>
                <p className="text-sm text-muted-foreground">Last Contact</p>
                <p className="font-semibold">{formatDate(firm.lastContact)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Contact History</CardTitle>
              <Button size="sm">Add Log</Button>
            </div>
          </CardHeader>
          <CardContent>
            {firm.contactHistory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Response</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {firm.contactHistory.map((contact, i) => (
                    <TableRow key={i}>
                      <TableCell>{formatDate(contact.date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{contact.method}</Badge>
                      </TableCell>
                      <TableCell>{contact.response}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No contact history</p>
            )}
          </CardContent>
        </Card>
      </div>

      {subscription && creditTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Credit Transaction History</CardTitle>
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
                {creditTransactions.slice(0, 15).map((transaction) => (
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
    </div>
  )
}
