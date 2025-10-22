"use client"

import { useState, useMemo } from "react"
import type { User, WillRegistration } from "@/types"
import { getWills, updateWill, deleteWill } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Download, Plus, Eye, Edit, Trash2, ChevronLeft, ChevronRight, AlertTriangle, History } from "lucide-react"
import { format, isValid, parseISO } from "date-fns"
import { MOCK_FIRM_USERS } from "@/lib/mock-data"

interface ManageWillsPageProps {
  currentUser: User
  onNavigate: (page: string) => void
}

const formatDate = (dateValue: string | undefined, formatString: string): string => {
  if (!dateValue) return "N/A"

  const date = typeof dateValue === "string" ? parseISO(dateValue) : new Date(dateValue)

  if (!isValid(date)) return "Invalid Date"

  return format(date, formatString)
}

export function ManageWillsPage({ currentUser, onNavigate }: ManageWillsPageProps) {
  const { toast } = useToast()
  const [wills, setWills] = useState<WillRegistration[]>(getWills())

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [registeredBy, setRegisteredBy] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Modal states
  const [selectedWill, setSelectedWill] = useState<WillRegistration | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState<Partial<WillRegistration>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState("")
  const [showVersionHistory, setShowVersionHistory] = useState(false)

  // Filter and sort wills
  const filteredWills = useMemo(() => {
    let filtered = [...wills]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (will) =>
          will.testatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          will.postcode.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter((will) => new Date(will.registeredDate) >= new Date(dateFrom))
    }
    if (dateTo) {
      filtered = filtered.filter((will) => new Date(will.registeredDate) <= new Date(dateTo))
    }

    // Registered by filter
    if (registeredBy !== "all") {
      filtered = filtered.filter((will) => will.registeredBy === registeredBy)
    }

    // Sort
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.registeredDate).getTime() - new Date(a.registeredDate).getTime())
        break
      case "oldest":
        filtered.sort((a, b) => new Date(a.registeredDate).getTime() - new Date(b.registeredDate).getTime())
        break
      case "updated":
        filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        break
      case "name-asc":
        filtered.sort((a, b) => a.testatorName.localeCompare(b.testatorName))
        break
      case "name-desc":
        filtered.sort((a, b) => b.testatorName.localeCompare(a.testatorName))
        break
    }

    return filtered
  }, [wills, searchQuery, dateFrom, dateTo, registeredBy, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredWills.length / itemsPerPage)
  const paginatedWills = filteredWills.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleViewWill = (will: WillRegistration) => {
    setSelectedWill(will)
    setEditFormData(will)
    setIsEditing(false)
  }

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditFormData(selectedWill || {})
  }

  const handleSaveEdit = async () => {
    if (!selectedWill) return

    // Validate required fields
    if (
      !editFormData.testatorName ||
      !editFormData.dob ||
      !editFormData.address ||
      !editFormData.postcode ||
      !editFormData.willLocation ||
      !editFormData.solicitorName ||
      !editFormData.willDate
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Simulate save delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const updatedWill: WillRegistration = {
      ...selectedWill,
      ...editFormData,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.email,
      version: selectedWill.version + 1,
    }

    updateWill(updatedWill)
    setWills(getWills())
    setSelectedWill(updatedWill)
    setIsEditing(false)

    toast({
      title: "Success",
      description: "Will updated successfully",
    })
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
    setDeleteConfirmId("")
  }

  const handleConfirmDelete = () => {
    if (!selectedWill || deleteConfirmId !== selectedWill.id) {
      return
    }

    deleteWill(selectedWill.id)
    setWills(getWills())
    setShowDeleteConfirm(false)
    setSelectedWill(null)

    toast({
      title: "Success",
      description: "Will registration deleted",
    })
  }

  const handleExport = (format: string) => {
    toast({
      title: "Export Started",
      description: `Exporting ${filteredWills.length} wills as ${format.toUpperCase()}`,
    })
  }

  const getUserName = (email: string) => {
    const user = MOCK_FIRM_USERS.find((u) => u.email === email)
    return user?.name || email
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage Wills</h1>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport("csv")}>Export as CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("excel")}>Export as Excel</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => onNavigate("register-will")}>
            <Plus className="mr-2 h-4 w-4" />
            Register New Will
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label>Search</Label>
          <Input
            placeholder="Search by testator name or postcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Date From</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Date To</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Registered By</Label>
          <Select value={registeredBy} onValueChange={setRegisteredBy}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {MOCK_FIRM_USERS.map((user) => (
                <SelectItem key={user.id} value={user.email}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Sort By</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="updated">Recently Updated</SelectItem>
              <SelectItem value="name-asc">Name A-Z</SelectItem>
              <SelectItem value="name-desc">Name Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-left font-medium">Testator Name</th>
                <th className="p-3 text-left font-medium">DOB</th>
                <th className="p-3 text-left font-medium">Postcode</th>
                <th className="p-3 text-left font-medium">Registered Date</th>
                <th className="p-3 text-left font-medium">Last Updated</th>
                <th className="p-3 text-left font-medium">Updated By</th>
                <th className="p-3 text-left font-medium">Version</th>
                <th className="p-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedWills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-muted-foreground">No wills registered yet</p>
                      <Button onClick={() => onNavigate("register-will")}>Register Will</Button>
                    </div>
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
                    <td className="p-3">{will.postcode}</td>
                    <td className="p-3">{formatDate(will.registeredDate, "dd MMM yyyy")}</td>
                    <td className="p-3">{formatDate(will.updatedAt, "dd MMM yyyy HH:mm")}</td>
                    <td className="p-3">{getUserName(will.updatedBy)}</td>
                    <td className="p-3">
                      <Badge variant="secondary">v{will.version}</Badge>
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
        {filteredWills.length > 0 && (
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
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredWills.length)} of{" "}
                {filteredWills.length} results
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
      <Dialog
        open={!!selectedWill && !showDeleteConfirm && !showVersionHistory}
        onOpenChange={(open) => !open && setSelectedWill(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Will Registration - {selectedWill?.testatorName}</DialogTitle>
              <Button
                variant={isEditing ? "outline" : "secondary"}
                size="sm"
                onClick={isEditing ? handleCancelEdit : handleEditClick}
              >
                {isEditing ? (
                  "Cancel"
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </>
                )}
              </Button>
            </div>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column - Will Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Will Information</h3>

              <div className="space-y-2">
                <Label>Testator Full Name *</Label>
                {isEditing ? (
                  <Input
                    value={editFormData.testatorName || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, testatorName: e.target.value })}
                  />
                ) : (
                  <p className="text-sm">{selectedWill?.testatorName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Date of Birth *</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editFormData.dob || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, dob: e.target.value })}
                  />
                ) : (
                  <p className="text-sm">{formatDate(selectedWill?.dob, "dd MMM yyyy")}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Address *</Label>
                {isEditing ? (
                  <Textarea
                    value={editFormData.address || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    rows={3}
                  />
                ) : (
                  <p className="text-sm">{selectedWill?.address}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Postcode *</Label>
                {isEditing ? (
                  <Input
                    value={editFormData.postcode || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, postcode: e.target.value })}
                  />
                ) : (
                  <p className="text-sm">{selectedWill?.postcode}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Will Location *</Label>
                {isEditing ? (
                  <Input
                    value={editFormData.willLocation || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, willLocation: e.target.value })}
                  />
                ) : (
                  <p className="text-sm">{selectedWill?.willLocation}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Solicitor Name *</Label>
                {isEditing ? (
                  <Input
                    value={editFormData.solicitorName || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, solicitorName: e.target.value })}
                  />
                ) : (
                  <p className="text-sm">{selectedWill?.solicitorName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Will Date *</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editFormData.willDate || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, willDate: e.target.value })}
                  />
                ) : (
                  <p className="text-sm">{formatDate(selectedWill?.willDate, "dd MMM yyyy")}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Executor Name</Label>
                {isEditing ? (
                  <Input
                    value={editFormData.executorName || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, executorName: e.target.value })}
                  />
                ) : (
                  <p className="text-sm">{selectedWill?.executorName || "Not specified"}</p>
                )}
              </div>

              {isEditing && (
                <Button onClick={handleSaveEdit} className="w-full">
                  Save Changes
                </Button>
              )}
            </div>

            {/* Right Column - Metadata */}
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2">
                <h4 className="font-semibold">Certificate Information</h4>
                <p className="text-sm font-mono">{selectedWill?.id}</p>
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  Download Certificate
                </Button>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <h4 className="font-semibold">Registration Details</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Registered:</span>{" "}
                    {formatDate(selectedWill?.registeredDate, "dd MMM yyyy HH:mm")}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Registered By:</span>{" "}
                    {selectedWill && getUserName(selectedWill.registeredBy)}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Current Version:</span>{" "}
                    <Badge variant="secondary">v{selectedWill?.version}</Badge>
                  </p>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <h4 className="font-semibold">Update History</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Last Updated:</span>{" "}
                    {formatDate(selectedWill?.updatedAt, "dd MMM yyyy HH:mm")}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Last Updated By:</span>{" "}
                    {selectedWill && getUserName(selectedWill.updatedBy)}
                  </p>
                  {selectedWill && selectedWill.version > 1 && (
                    <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => setShowVersionHistory(true)}>
                      <History className="mr-1 h-3 w-3" />
                      View Full History
                    </Button>
                  )}
                </div>
              </div>

              {currentUser.userRole === "primary-admin" && (
                <div className="rounded-lg border border-destructive/50 p-4 space-y-2">
                  <h4 className="font-semibold text-destructive">Danger Zone</h4>
                  <p className="text-sm text-muted-foreground">This action cannot be undone</p>
                  <Button variant="destructive" size="sm" className="w-full" onClick={handleDeleteClick}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Will Registration
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Version History Modal */}
      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Version History - {selectedWill?.testatorName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Mock version history */}
            {selectedWill && selectedWill.version >= 3 && (
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge>v3</Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(selectedWill.updatedAt, "dd MMM yyyy HH:mm")}
                  </span>
                </div>
                <p className="text-sm">
                  <span className="text-muted-foreground">Changed By:</span> {getUserName(selectedWill.updatedBy)}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Fields Modified:</span> Address, Postcode
                </p>
              </div>
            )}
            {selectedWill && selectedWill.version >= 2 && (
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge>v2</Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(
                      new Date(parseISO(selectedWill.registeredDate).getTime() + 86400000).toISOString(),
                      "dd MMM yyyy HH:mm",
                    )}
                  </span>
                </div>
                <p className="text-sm">
                  <span className="text-muted-foreground">Changed By:</span> {getUserName(selectedWill.registeredBy)}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Fields Modified:</span> Will Date, Executor Name
                </p>
              </div>
            )}
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Badge>v1</Badge>
                <span className="text-sm text-muted-foreground">
                  {formatDate(selectedWill?.registeredDate, "dd MMM yyyy HH:mm")}
                </span>
              </div>
              <p className="text-sm">
                <span className="text-muted-foreground">Created By:</span>{" "}
                {selectedWill && getUserName(selectedWill.registeredBy)}
              </p>
              <p className="text-sm text-muted-foreground">Initial registration</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <DialogTitle>Delete Will Registration?</DialogTitle>
            </div>
            <DialogDescription>
              This will permanently delete the will registration for {selectedWill?.testatorName}. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type the Will ID ({selectedWill?.id}) to confirm</Label>
              <Input
                value={deleteConfirmId}
                onChange={(e) => setDeleteConfirmId(e.target.value)}
                placeholder={selectedWill?.id}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleteConfirmId !== selectedWill?.id}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
