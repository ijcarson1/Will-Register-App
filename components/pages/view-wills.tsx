"use client"

import { useState, useMemo } from "react"
import type { User, WillRegistration } from "@/types"
import { getWills } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Eye, ChevronLeft, ChevronRight, Download } from "lucide-react"
import { format, isValid, parseISO } from "date-fns"
import { SortableTableHead } from "@/components/ui/sortable-table-head"
import { useSortableTable } from "@/lib/table-sort"

interface ViewWillsPageProps {
  currentUser: User
  onNavigate: (page: string) => void
}

const formatDate = (dateValue: string | undefined, formatString: string): string => {
  if (!dateValue) return "N/A"
  const date = typeof dateValue === "string" ? parseISO(dateValue) : new Date(dateValue)
  if (!isValid(date)) return "Invalid Date"
  return format(date, formatString)
}

export function ViewWillsPage({ currentUser, onNavigate }: ViewWillsPageProps) {
  const [wills, setWills] = useState<WillRegistration[]>(getWills())

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [firmFilter, setFirmFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  // Modal state
  const [selectedWill, setSelectedWill] = useState<WillRegistration | null>(null)

  // Get unique firms for filter
  const firms = useMemo(() => {
    const uniqueFirms = new Set(wills.map((w) => w.firmName).filter(Boolean))
    return Array.from(uniqueFirms).sort()
  }, [wills])

  // Filter wills
  const filteredWills = useMemo(() => {
    let filtered = [...wills]

    // Search filter (testator name or solicitor name)
    if (searchQuery) {
      filtered = filtered.filter(
        (will) =>
          will.testatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          will.solicitorName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Firm filter
    if (firmFilter !== "all") {
      filtered = filtered.filter((will) => will.firmName === firmFilter)
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter((will) => new Date(will.registeredDate) >= new Date(dateFrom))
    }
    if (dateTo) {
      filtered = filtered.filter((will) => new Date(will.registeredDate) <= new Date(dateTo))
    }

    return filtered
  }, [wills, searchQuery, firmFilter, dateFrom, dateTo])

  const { sortedData: sortedWills, sortConfig, requestSort } = useSortableTable<WillRegistration>(filteredWills)

  // Pagination - use sortedWills instead of filteredWills
  const totalPages = Math.ceil(sortedWills.length / itemsPerPage)
  const paginatedWills = sortedWills.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleViewWill = (will: WillRegistration) => {
    setSelectedWill(will)
  }

  const handleExport = () => {
    // Create CSV content
    const headers = [
      "Testator Name",
      "Date of Birth",
      "Will Date",
      "Solicitor Name",
      "Registration Date",
      "Registered By",
      "Firm",
    ]
    const rows = sortedWills.map((will) => [
      will.testatorName,
      formatDate(will.dob, "dd/MM/yyyy"),
      formatDate(will.willDate, "dd/MM/yyyy"),
      will.solicitorName,
      formatDate(will.registeredDate, "dd/MM/yyyy HH:mm"),
      will.registeredBy,
      will.firmName || "N/A",
    ])

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `wills-export-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">View Wills</h1>
          <p className="text-muted-foreground">All registered wills across all firms</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Wills</p>
          <p className="text-2xl font-bold">{wills.length.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Filtered Results</p>
          <p className="text-2xl font-bold">{sortedWills.length.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Firms</p>
          <p className="text-2xl font-bold">{firms.length}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">This Month</p>
          <p className="text-2xl font-bold">
            {
              wills.filter((w) => {
                const regDate = new Date(w.registeredDate)
                const now = new Date()
                return regDate.getMonth() === now.getMonth() && regDate.getFullYear() === now.getFullYear()
              }).length
            }
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label>Search</Label>
          <Input
            placeholder="Testator or solicitor name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>Firm</Label>
          <Select
            value={firmFilter}
            onValueChange={(value) => {
              setFirmFilter(value)
              setCurrentPage(1)
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Firms</SelectItem>
              {firms.map((firm) => (
                <SelectItem key={firm} value={firm}>
                  {firm}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Date From</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>Date To</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <SortableTableHead column="testatorName" sortConfig={sortConfig} onSort={requestSort}>
                  Testator Name
                </SortableTableHead>
                <SortableTableHead column="dob" sortConfig={sortConfig} onSort={requestSort}>
                  Date of Birth
                </SortableTableHead>
                <SortableTableHead column="willDate" sortConfig={sortConfig} onSort={requestSort}>
                  Will Date
                </SortableTableHead>
                <SortableTableHead column="solicitorName" sortConfig={sortConfig} onSort={requestSort}>
                  Solicitor Name
                </SortableTableHead>
                <SortableTableHead column="registeredDate" sortConfig={sortConfig} onSort={requestSort}>
                  Registration Date
                </SortableTableHead>
                <SortableTableHead column="registeredBy" sortConfig={sortConfig} onSort={requestSort}>
                  Registered By
                </SortableTableHead>
                <SortableTableHead column="firmName" sortConfig={sortConfig} onSort={requestSort}>
                  Firm
                </SortableTableHead>
                <th className="p-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedWills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <p className="text-muted-foreground">No wills found matching your filters</p>
                  </td>
                </tr>
              ) : (
                paginatedWills.map((will) => (
                  <tr
                    key={will.id}
                    className="border-t hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleViewWill(will)}
                  >
                    <td className="p-3 font-semibold">{will.testatorName}</td>
                    <td className="p-3">{formatDate(will.dob, "dd MMM yyyy")}</td>
                    <td className="p-3">{formatDate(will.willDate, "dd MMM yyyy")}</td>
                    <td className="p-3">{will.solicitorName}</td>
                    <td className="p-3">{formatDate(will.registeredDate, "dd MMM yyyy")}</td>
                    <td className="p-3">{will.registeredBy}</td>
                    <td className="p-3">
                      <Badge variant="outline">{will.firmName || "N/A"}</Badge>
                    </td>
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewWill(will)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {sortedWills.length > 0 && (
          <div className="flex items-center justify-between border-t p-4">
            <div className="flex items-center gap-2">
              <Label>Items per page:</Label>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value))
                  setCurrentPage(1)
                }}
              >
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
                {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, sortedWills.length)} of{" "}
                {sortedWills.length} results
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Will Detail Modal */}
      <Dialog open={!!selectedWill} onOpenChange={(open) => !open && setSelectedWill(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Will Registration Details - {selectedWill?.testatorName}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Testator Information</h3>
              <div className="space-y-2">
                <Label>Full Name</Label>
                <p className="text-sm">{selectedWill?.testatorName}</p>
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <p className="text-sm">{formatDate(selectedWill?.dob, "dd MMM yyyy")}</p>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <p className="text-sm">{selectedWill?.address}</p>
              </div>
              <div className="space-y-2">
                <Label>Postcode</Label>
                <p className="text-sm">{selectedWill?.postcode}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Will Information</h3>
              <div className="space-y-2">
                <Label>Will Date</Label>
                <p className="text-sm">{formatDate(selectedWill?.willDate, "dd MMM yyyy")}</p>
              </div>
              <div className="space-y-2">
                <Label>Will Location</Label>
                <p className="text-sm">{selectedWill?.willLocation}</p>
              </div>
              <div className="space-y-2">
                <Label>Solicitor Name</Label>
                <p className="text-sm">{selectedWill?.solicitorName}</p>
              </div>
              <div className="space-y-2">
                <Label>Executor Name</Label>
                <p className="text-sm">{selectedWill?.executorName || "Not specified"}</p>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <h3 className="font-semibold text-lg">Registration Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Certificate ID</Label>
                  <p className="text-sm font-mono">{selectedWill?.id}</p>
                </div>
                <div className="space-y-2">
                  <Label>Firm</Label>
                  <p className="text-sm">{selectedWill?.firmName || "N/A"}</p>
                </div>
                <div className="space-y-2">
                  <Label>Registered By</Label>
                  <p className="text-sm">{selectedWill?.registeredBy}</p>
                </div>
                <div className="space-y-2">
                  <Label>Registration Date</Label>
                  <p className="text-sm">{formatDate(selectedWill?.registeredDate, "dd MMM yyyy HH:mm")}</p>
                </div>
                <div className="space-y-2">
                  <Label>Last Updated</Label>
                  <p className="text-sm">{formatDate(selectedWill?.updatedAt, "dd MMM yyyy HH:mm")}</p>
                </div>
                <div className="space-y-2">
                  <Label>Version</Label>
                  <p className="text-sm">
                    <Badge variant="secondary">v{selectedWill?.version}</Badge>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
