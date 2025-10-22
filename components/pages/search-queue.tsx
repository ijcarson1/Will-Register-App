"use client"

import { useState, useMemo } from "react"
import type { User, SearchRequest } from "@/types"
import { getSearches, updateSearch, getFirms } from "@/lib/storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  Download,
  Eye,
  FileText,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  TrendingUp,
  Clock,
  CheckCircle2,
  Activity,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { format, parseISO, differenceInHours, differenceInDays, differenceInMinutes } from "date-fns"

interface SearchQueuePageProps {
  currentUser: User
  onNavigate: (page: string, data?: any) => void
}

export function SearchQueuePage({ currentUser, onNavigate }: SearchQueuePageProps) {
  const { toast } = useToast()

  const [statusFilter, setStatusFilter] = useState<"active" | "completed" | "all">("active")
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [assignedFilter, setAssignedFilter] = useState<string>("all")
  const [outcomeFilter, setOutcomeFilter] = useState<string>("all")
  const [showStats, setShowStats] = useState(true)
  const [sortBy, setSortBy] = useState<string>("requestDate")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [selectedSearch, setSelectedSearch] = useState<SearchRequest | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const allSearches = getSearches()
  const firms = getFirms()

  const calculateDuration = (requestDate: string, completionDate?: string) => {
    if (!completionDate) return null

    const start = parseISO(requestDate)
    const end = parseISO(completionDate)
    const minutes = differenceInMinutes(end, start)
    const hours = differenceInHours(end, start)
    const days = differenceInDays(end, start)

    if (minutes < 60) return `${minutes} mins`
    if (hours < 24) return `${hours} hours`
    if (days === 0) return `${hours} hours`
    return `${days}.${Math.floor((hours % 24) / 2.4)} days`
  }

  const filteredByStatus = useMemo(() => {
    if (statusFilter === "active") {
      return allSearches.filter((s) => s.status !== "complete")
    } else if (statusFilter === "completed") {
      return allSearches.filter((s) => s.status === "complete")
    }
    return allSearches
  }, [allSearches, statusFilter])

  const filteredSearches = useMemo(() => {
    let result = filteredByStatus

    // Search query filter
    if (searchQuery) {
      result = result.filter(
        (s) =>
          s.deceasedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.caseReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.id.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Type filter
    if (typeFilter !== "all") {
      result = result.filter((s) => s.searchType === typeFilter)
    }

    // Assigned filter
    if (assignedFilter !== "all") {
      result = result.filter((s) => s.assignedTo === assignedFilter)
    }

    // Outcome filter (for completed/all)
    if (outcomeFilter !== "all" && (statusFilter === "completed" || statusFilter === "all")) {
      if (outcomeFilter === "found") {
        result = result.filter((s) => s.willFound === true)
      } else if (outcomeFilter === "not-found") {
        result = result.filter((s) => s.willFound === false)
      }
    }

    return result
  }, [filteredByStatus, searchQuery, typeFilter, assignedFilter, outcomeFilter, statusFilter])

  const sortedSearches = useMemo(() => {
    const sorted = [...filteredSearches].sort((a, b) => {
      let aVal: any, bVal: any

      switch (sortBy) {
        case "requestDate":
          aVal = new Date(a.requestDate).getTime()
          bVal = new Date(b.requestDate).getTime()
          break
        case "completionDate":
          aVal = a.completionDate ? new Date(a.completionDate).getTime() : 0
          bVal = b.completionDate ? new Date(b.completionDate).getTime() : 0
          break
        case "client":
          aVal = a.deceasedName.toLowerCase()
          bVal = b.deceasedName.toLowerCase()
          break
        case "duration":
          aVal = a.completionDate ? differenceInMinutes(parseISO(a.completionDate), parseISO(a.requestDate)) : 0
          bVal = b.completionDate ? differenceInMinutes(parseISO(b.completionDate), parseISO(b.requestDate)) : 0
          break
        default:
          return 0
      }

      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    return sorted
  }, [filteredSearches, sortBy, sortDirection])

  const totalPages = Math.ceil(sortedSearches.length / itemsPerPage)
  const paginatedSearches = sortedSearches.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const stats = useMemo(() => {
    const activeCount = allSearches.filter((s) => s.status !== "complete").length
    const completedToday = allSearches.filter((s) => {
      if (!s.completionDate) return false
      const today = new Date().toDateString()
      return new Date(s.completionDate).toDateString() === today
    }).length

    const completedLast30Days = allSearches.filter((s) => {
      if (!s.completionDate) return false
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return new Date(s.completionDate) >= thirtyDaysAgo
    })

    const foundCount = completedLast30Days.filter((s) => s.willFound).length
    const notFoundCount = completedLast30Days.filter((s) => !s.willFound).length
    const successRate = completedLast30Days.length > 0 ? Math.round((foundCount / completedLast30Days.length) * 100) : 0

    const completedWithDuration = allSearches.filter((s) => s.completionDate)
    const avgMinutes =
      completedWithDuration.length > 0
        ? completedWithDuration.reduce((sum, s) => {
            return sum + differenceInMinutes(parseISO(s.completionDate!), parseISO(s.requestDate))
          }, 0) / completedWithDuration.length
        : 0

    const basicSearches = completedWithDuration.filter((s) => s.searchType === "basic")
    const advancedSearches = completedWithDuration.filter((s) => s.searchType === "advanced")

    const avgBasicMinutes =
      basicSearches.length > 0
        ? basicSearches.reduce((sum, s) => {
            return sum + differenceInMinutes(parseISO(s.completionDate!), parseISO(s.requestDate))
          }, 0) / basicSearches.length
        : 0

    const avgAdvancedMinutes =
      advancedSearches.length > 0
        ? advancedSearches.reduce((sum, s) => {
            return sum + differenceInMinutes(parseISO(s.completionDate!), parseISO(s.requestDate))
          }, 0) / advancedSearches.length
        : 0

    const oldestActive = allSearches
      .filter((s) => s.status !== "complete")
      .sort((a, b) => new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime())[0]

    const oldestPendingDays = oldestActive ? differenceInDays(new Date(), parseISO(oldestActive.requestDate)) : 0

    return {
      activeCount,
      completedToday,
      successRate,
      foundCount,
      notFoundCount,
      avgDuration:
        avgMinutes < 60
          ? `${Math.round(avgMinutes)} mins`
          : avgMinutes < 1440
            ? `${Math.round(avgMinutes / 60)} hours`
            : `${(avgMinutes / 1440).toFixed(1)} days`,
      avgBasic:
        avgBasicMinutes < 60 ? `${Math.round(avgBasicMinutes)} mins` : `${Math.round(avgBasicMinutes / 60)} hours`,
      avgAdvanced:
        avgAdvancedMinutes < 1440
          ? `${Math.round(avgAdvancedMinutes / 60)} hours`
          : `${(avgAdvancedMinutes / 1440).toFixed(1)} days`,
      oldestPending: oldestPendingDays > 0 ? `${oldestPendingDays} days` : "None",
    }
  }, [allSearches])

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortDirection("desc")
    }
  }

  const handleAssign = (searchId: string, assignee: string) => {
    updateSearch(searchId, { assignedTo: assignee })
    toast({
      title: "Search Assigned",
      description: `Assigned to ${assignee}`,
    })
  }

  const handlePriority = (searchId: string, priority: "high" | "medium" | "low") => {
    updateSearch(searchId, { priority })
    toast({
      title: "Priority Updated",
      description: `Set to ${priority}`,
    })
  }

  const handleViewDetails = (search: SearchRequest) => {
    setSelectedSearch(search)
    setShowDetailModal(true)
  }

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

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return null
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Search Queue</h1>
        <p className="text-muted-foreground">Manage and process search requests</p>
      </div>

      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Searches</p>
                  <p className="text-2xl font-bold">{stats.activeCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Oldest: {stats.oldestPending}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed Today</p>
                  <p className="text-2xl font-bold">{stats.completedToday}</p>
                  <p className="text-xs text-muted-foreground mt-1">Success: {stats.successRate}%</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Completion Time</p>
                  <p className="text-2xl font-bold">{stats.avgDuration}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Basic: {stats.avgBasic} | Adv: {stats.avgAdvanced}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate (30d)</p>
                  <p className="text-2xl font-bold">{stats.successRate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.foundCount} found / {stats.notFoundCount} not found
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => setShowStats(!showStats)}>
          {showStats ? "Hide" : "Show"} Statistics
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">
                Active ({allSearches.filter((s) => s.status !== "complete").length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({allSearches.filter((s) => s.status === "complete").length})
              </TabsTrigger>
              <TabsTrigger value="all">All Searches ({allSearches.length})</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Client name or case reference..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Search Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assigned To</Label>
              <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  <SelectItem value="System">System (Auto)</SelectItem>
                  <SelectItem value="Admin User 1">Admin User 1</SelectItem>
                  <SelectItem value="Admin User 2">Admin User 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(statusFilter === "completed" || statusFilter === "all") && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Outcome</Label>
                <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Outcomes</SelectItem>
                    <SelectItem value="found">Will Found</SelectItem>
                    <SelectItem value="not-found">No Will Found</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Queue ({sortedSearches.length} {sortedSearches.length === 1 ? "result" : "results"})
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("id")}>
                    ID <SortIcon column="id" />
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("client")}>
                    Client <SortIcon column="client" />
                  </TableHead>
                  <TableHead>Type</TableHead>
                  {statusFilter === "active" && <TableHead>Status</TableHead>}
                  {(statusFilter === "completed" || statusFilter === "all") && <TableHead>Outcome</TableHead>}
                  <TableHead className="cursor-pointer" onClick={() => handleSort("requestDate")}>
                    Request Date <SortIcon column="requestDate" />
                  </TableHead>
                  {(statusFilter === "completed" || statusFilter === "all") && (
                    <>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("completionDate")}>
                        Completion Date <SortIcon column="completionDate" />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("duration")}>
                        Duration <SortIcon column="duration" />
                      </TableHead>
                    </>
                  )}
                  <TableHead>Assigned To</TableHead>
                  {statusFilter === "active" && <TableHead>Priority</TableHead>}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSearches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No searches match your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSearches.map((search) => (
                    <TableRow key={search.id}>
                      <TableCell className="font-mono text-sm">{search.id}</TableCell>
                      <TableCell className="font-medium">{search.deceasedName}</TableCell>
                      <TableCell>
                        <Badge variant={search.searchType === "advanced" ? "default" : "secondary"}>
                          {search.searchType === "advanced" ? "Advanced" : "Basic"}
                        </Badge>
                      </TableCell>
                      {statusFilter === "active" && (
                        <TableCell>
                          <Badge className={getStatusColor(search.status)}>{formatStatus(search.status)}</Badge>
                        </TableCell>
                      )}
                      {(statusFilter === "completed" || statusFilter === "all") && (
                        <TableCell>
                          {search.status === "complete" ? (
                            <Badge
                              variant={search.willFound ? "default" : "secondary"}
                              className={search.willFound ? "bg-green-500" : "bg-amber-500"}
                            >
                              {search.willFound ? "Found" : "Not Found"}
                            </Badge>
                          ) : (
                            <Badge className={getStatusColor(search.status)}>{formatStatus(search.status)}</Badge>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="text-sm">{format(parseISO(search.requestDate), "dd MMM yyyy")}</TableCell>
                      {(statusFilter === "completed" || statusFilter === "all") && (
                        <>
                          <TableCell className="text-sm">
                            {search.completionDate ? format(parseISO(search.completionDate), "dd MMM yyyy") : "-"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {calculateDuration(search.requestDate, search.completionDate) || "-"}
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        {statusFilter === "active" ? (
                          <Select
                            value={search.assignedTo || "unassigned"}
                            onValueChange={(value) => handleAssign(search.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Unassigned</SelectItem>
                              <SelectItem value="Admin User 1">Admin User 1</SelectItem>
                              <SelectItem value="Admin User 2">Admin User 2</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-sm">{search.assignedTo || "Unassigned"}</span>
                        )}
                      </TableCell>
                      {statusFilter === "active" && (
                        <TableCell>
                          <Select
                            value={search.priority || "medium"}
                            onValueChange={(value) => handlePriority(search.id, value as any)}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex gap-2">
                          {statusFilter === "active" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onNavigate("process-search", { searchId: search.id })}
                            >
                              Process
                            </Button>
                          ) : (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleViewDetails(search)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {search.reportGenerated && (
                                <Button variant="ghost" size="sm">
                                  <FileText className="h-4 w-4" />
                                </Button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>Download Report</DropdownMenuItem>
                                  <DropdownMenuItem>Export Data</DropdownMenuItem>
                                  <DropdownMenuItem>View Timeline</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <Label>Items per page:</Label>
                <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(Number(v))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, sortedSearches.length)} of {sortedSearches.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Search Details - {selectedSearch?.id}</DialogTitle>
          </DialogHeader>
          {selectedSearch && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Deceased Name</p>
                  <p className="font-semibold">{selectedSearch.deceasedName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Case Reference</p>
                  <p className="font-semibold">{selectedSearch.caseReference}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Search Type</p>
                  <Badge variant={selectedSearch.searchType === "advanced" ? "default" : "secondary"}>
                    {selectedSearch.searchType === "advanced" ? "Advanced" : "Basic"} - £{selectedSearch.price}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Outcome</p>
                  <Badge
                    variant={selectedSearch.willFound ? "default" : "secondary"}
                    className={selectedSearch.willFound ? "bg-green-500" : "bg-amber-500"}
                  >
                    {selectedSearch.willFound ? "Will Found" : "No Will Found"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Request Date</p>
                  <p className="font-semibold">{format(parseISO(selectedSearch.requestDate), "dd MMM yyyy HH:mm")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completion Date</p>
                  <p className="font-semibold">
                    {selectedSearch.completionDate
                      ? format(parseISO(selectedSearch.completionDate), "dd MMM yyyy HH:mm")
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-semibold">
                    {calculateDuration(selectedSearch.requestDate, selectedSearch.completionDate) || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assigned To</p>
                  <p className="font-semibold">{selectedSearch.assignedTo || "Unassigned"}</p>
                </div>
              </div>

              {selectedSearch.willFound && selectedSearch.sourcesFirm && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="font-semibold text-green-700">Will Located</p>
                  <p className="text-sm text-green-600 mt-1">Found at: {selectedSearch.sourcesFirm}</p>
                  {selectedSearch.matchedWillId && (
                    <p className="text-sm text-green-600">Will ID: {selectedSearch.matchedWillId}</p>
                  )}
                </div>
              )}

              <div>
                <p className="text-sm font-semibold mb-2">Progress Timeline</p>
                <div className="space-y-2">
                  {selectedSearch.progressLog.map((log, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <div className="w-32 text-muted-foreground">
                        {format(parseISO(log.timestamp), "dd MMM HH:mm")}
                      </div>
                      <div className="flex-1">
                        <Badge className={getStatusColor(log.status)} variant="outline">
                          {formatStatus(log.status)}
                        </Badge>
                        <p className="text-muted-foreground mt-1">{log.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedSearch.reportGenerated && (
                <div className="flex gap-2">
                  <Button className="flex-1">
                    <FileText className="h-4 w-4 mr-2" />
                    View Report
                  </Button>
                  <Button variant="outline" className="flex-1 bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
