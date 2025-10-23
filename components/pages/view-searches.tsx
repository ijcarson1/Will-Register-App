"use client"

import { TableHead } from "@/components/ui/table"

import { useState } from "react"
import type { User, SearchStatus, SearchRequest } from "@/types"
import { getSearches } from "@/lib/storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { SortableTableHead } from "@/components/ui/sortable-table-head"
import { formatDate } from "@/lib/utils"
import { useSortableTable } from "@/lib/table-sort"
import { Search } from "lucide-react"

interface ViewSearchesPageProps {
  currentUser: User
  onNavigate: (page: string, data?: any) => void
}

export function ViewSearchesPage({ currentUser, onNavigate }: ViewSearchesPageProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const searches = getSearches()

  const filteredSearches = searches.filter((search) => {
    const matchesStatus = statusFilter === "all" || search.status === statusFilter
    const matchesQuery =
      searchQuery === "" ||
      search.deceasedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      search.caseReference.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesStatus && matchesQuery
  })

  const { sortedData, sortConfig, requestSort } = useSortableTable<SearchRequest>(filteredSearches)

  const getStatusColor = (status: SearchStatus) => {
    const colors: Record<SearchStatus, string> = {
      received: "bg-gray-500",
      "payment-confirmed": "bg-blue-500",
      "db-search-complete": "bg-yellow-500",
      "professional-outreach": "bg-orange-500",
      "results-compilation": "bg-purple-500",
      complete: "bg-green-500",
    }
    return colors[status]
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
        <h1 className="text-3xl font-bold">View Searches</h1>
        <p className="text-muted-foreground">Track and manage all search requests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="payment-confirmed">Payment Confirmed</SelectItem>
                  <SelectItem value="db-search-complete">DB Search Complete</SelectItem>
                  <SelectItem value="professional-outreach">Professional Outreach</SelectItem>
                  <SelectItem value="results-compilation">Results Compilation</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or case reference..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Search Requests ({sortedData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead column="deceasedName" sortConfig={sortConfig} onSort={requestSort}>
                  Deceased Name
                </SortableTableHead>
                <SortableTableHead column="caseReference" sortConfig={sortConfig} onSort={requestSort}>
                  Case Reference
                </SortableTableHead>
                <SortableTableHead column="searchType" sortConfig={sortConfig} onSort={requestSort}>
                  Type
                </SortableTableHead>
                <SortableTableHead column="status" sortConfig={sortConfig} onSort={requestSort}>
                  Status
                </SortableTableHead>
                <SortableTableHead column="requestedBy" sortConfig={sortConfig} onSort={requestSort}>
                  Requested By
                </SortableTableHead>
                <SortableTableHead column="requestDate" sortConfig={sortConfig} onSort={requestSort}>
                  Date
                </SortableTableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((search) => (
                <TableRow key={search.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{search.deceasedName}</TableCell>
                  <TableCell>{search.caseReference}</TableCell>
                  <TableCell>
                    <Badge variant={search.searchType === "advanced" ? "default" : "secondary"}>
                      {search.searchType === "advanced" ? "Advanced" : "Basic"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(search.status)}>{formatStatus(search.status)}</Badge>
                  </TableCell>
                  <TableCell>{search.requestedBy}</TableCell>
                  <TableCell>{formatDate(search.requestDate)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigate("search-detail", { searchId: search.id })}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {sortedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No searches found matching your filters
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
