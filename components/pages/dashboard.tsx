"use client"

import type { User } from "@/types"
import { getWills, getSearches } from "@/lib/storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Search, Clock, DollarSign, FolderOpen } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface DashboardPageProps {
  currentUser: User
  onNavigate: (page: string) => void
}

export function DashboardPage({ currentUser, onNavigate }: DashboardPageProps) {
  const wills = getWills()
  const searches = getSearches()

  const userWills =
    currentUser.userRole === "primary-admin" ? wills : wills.filter((w) => w.registeredBy === currentUser.userName)

  const userSearches =
    currentUser.userRole === "primary-admin" ? searches : searches.filter((s) => s.requestedBy === currentUser.userName)

  const activeSearches = userSearches.filter((s) => s.status !== "complete")
  const thisMonthSearches = userSearches.filter((s) => {
    const date = new Date(s.requestDate)
    const now = new Date()
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  })

  const totalCost = thisMonthSearches.reduce((sum, s) => sum + s.price, 0)

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      received: "bg-gray-500",
      "payment-confirmed": "bg-blue-500",
      "db-search-complete": "bg-yellow-500",
      "professional-outreach": "bg-orange-500",
      "results-compilation": "bg-purple-500",
      complete: "bg-green-500",
    }
    return colors[status] || "bg-gray-500"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {currentUser.userName}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Wills</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userWills.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Searches This Month</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisMonthSearches.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Searches</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSearches.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cost This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{totalCost}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {(currentUser.userRole === "primary-admin" || currentUser.userRole === "standard") && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button onClick={() => onNavigate("register-will")}>
              <FileText className="mr-2 h-4 w-4" />
              Register Will
            </Button>
            <Button onClick={() => onNavigate("search-request")} variant="outline">
              <Search className="mr-2 h-4 w-4" />
              New Search
            </Button>
            <Button onClick={() => onNavigate("manage-wills")} variant="outline">
              <FolderOpen className="mr-2 h-4 w-4" />
              View All Wills
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Searches */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Searches</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deceased Name</TableHead>
                <TableHead>Case Reference</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userSearches.slice(0, 5).map((search) => (
                <TableRow key={search.id}>
                  <TableCell className="font-medium">{search.deceasedName}</TableCell>
                  <TableCell>{search.caseReference}</TableCell>
                  <TableCell>
                    <Badge variant={search.searchType === "advanced" ? "default" : "secondary"}>
                      {search.searchType === "advanced" ? "Advanced" : "Basic"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(search.status)}>{search.status.replace(/-/g, " ")}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(search.requestDate)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigate("search-detail", { searchId: search.id })}
                    >
                      View
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
