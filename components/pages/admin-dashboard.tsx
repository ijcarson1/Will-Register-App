"use client"

import type { User } from "@/types"
import { getSearches } from "@/lib/storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ClipboardList, Database, Clock, CheckCircle } from "lucide-react"

interface AdminDashboardPageProps {
  currentUser: User
  onNavigate: (page: string, data?: any) => void
}

export function AdminDashboardPage({ currentUser, onNavigate }: AdminDashboardPageProps) {
  const searches = getSearches()
  const pendingSearches = searches.filter((s) => s.status !== "complete")
  const todaySearches = searches.filter((s) => {
    const date = new Date(s.requestDate)
    const today = new Date()
    return date.toDateString() === today.toDateString()
  })
  const completedToday = searches.filter((s) => {
    if (!s.completionDate) return false
    const date = new Date(s.completionDate)
    const today = new Date()
    return date.toDateString() === today.toDateString()
  })

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

  const formatStatus = (status: string) => {
    return status
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Backend search processing and management</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Searches</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSearches.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Received Today</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySearches.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedToday.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{searches.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={() => onNavigate("search-queue")}>
            <ClipboardList className="mr-2 h-4 w-4" />
            View Search Queue
          </Button>
          <Button onClick={() => onNavigate("firm-database")} variant="outline">
            <Database className="mr-2 h-4 w-4" />
            Manage Firms
          </Button>
        </CardContent>
      </Card>

      {/* Pending Searches Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Searches</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Deceased Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingSearches.slice(0, 10).map((search) => (
                <TableRow key={search.id}>
                  <TableCell className="font-mono text-sm">{search.id}</TableCell>
                  <TableCell className="font-medium">{search.deceasedName}</TableCell>
                  <TableCell>
                    <Badge variant={search.searchType === "advanced" ? "default" : "secondary"}>
                      {search.searchType === "advanced" ? "Advanced" : "Basic"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(search.status)}>{formatStatus(search.status)}</Badge>
                  </TableCell>
                  <TableCell>
                    {search.priority && (
                      <Badge variant={search.priority === "high" ? "destructive" : "outline"}>{search.priority}</Badge>
                    )}
                  </TableCell>
                  <TableCell>{search.assignedTo || "-"}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigate("process-search", { searchId: search.id })}
                    >
                      Process
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {pendingSearches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No pending searches
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
