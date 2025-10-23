"use client"

import type { User, ContactLogEntry } from "@/types"
import { getSearchById, getFirms } from "@/lib/storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate, formatDateTime } from "@/lib/utils"
import {
  Download,
  ArrowLeft,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  FileText,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useState, useMemo } from "react"

interface SearchDetailPageProps {
  searchId: string
  currentUser: User
  onNavigate: (page: string, data?: any) => void
}

export function SearchDetailPage({ searchId, currentUser, onNavigate }: SearchDetailPageProps) {
  const { toast } = useToast()
  const search = getSearchById(searchId)
  const firms = getFirms()

  // State for firm contact log filtering and sorting
  const [contactFilter, setContactFilter] = useState<string>("all")
  const [contactSearch, setContactSearch] = useState("")
  const [expandedContacts, setExpandedContacts] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<"firmName" | "contactedAt" | "status">("contactedAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Helper functions for contact log display
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

  const getContactStatusBadge = (contact: ContactLogEntry) => {
    if (!contact.responseReceived) {
      return <Badge variant="destructive">No Response</Badge>
    }

    switch (contact.responseCategory) {
      case "will-found":
        return <Badge className="bg-green-500">Replied - Will Found</Badge>
      case "no-match":
        return <Badge variant="secondary">Replied - No Will</Badge>
      case "checking-records":
        return <Badge className="bg-yellow-500">Replied - Uncertain</Badge>
      case "need-more-info":
        return <Badge className="bg-blue-500">Awaiting Response</Badge>
      default:
        return <Badge variant="outline">Awaiting Response</Badge>
    }
  }

  const getContactMethodIcon = (method: string) => {
    switch (method) {
      case "email":
        return <Mail className="h-4 w-4" />
      case "phone":
        return <Phone className="h-4 w-4" />
      case "letter":
        return <FileText className="h-4 w-4" />
      default:
        return null
    }
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  const toggleContactExpanded = (contactId: string) => {
    const newExpanded = new Set(expandedContacts)
    if (newExpanded.has(contactId)) {
      newExpanded.delete(contactId)
    } else {
      newExpanded.add(contactId)
    }
    setExpandedContacts(newExpanded)
  }

  const handleSort = (field: "firmName" | "contactedAt" | "status") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  // Filtered and sorted contact log
  const filteredAndSortedContacts = useMemo(() => {
    if (!search.contactLog) return []

    let filtered = search.contactLog

    // Apply filter
    if (contactFilter !== "all") {
      filtered = filtered.filter((contact) => {
        switch (contactFilter) {
          case "responded":
            return contact.responseReceived
          case "no-response":
            return !contact.responseReceived
          case "will-found":
            return contact.responseCategory === "will-found"
          default:
            return true
        }
      })
    }

    // Apply search
    if (contactSearch) {
      filtered = filtered.filter((contact) => contact.firmName.toLowerCase().includes(contactSearch.toLowerCase()))
    }

    // Apply sort
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case "firmName":
          comparison = a.firmName.localeCompare(b.firmName)
          break
        case "contactedAt":
          comparison = new Date(a.contactedAt).getTime() - new Date(b.contactedAt).getTime()
          break
        case "status":
          const aStatus = a.responseReceived ? a.responseCategory || "responded" : "no-response"
          const bStatus = b.responseReceived ? b.responseCategory || "responded" : "no-response"
          comparison = aStatus.localeCompare(bStatus)
          break
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    return sorted
  }, [search.contactLog, contactFilter, contactSearch, sortField, sortDirection])

  // Contact log summary statistics
  const contactSummary = useMemo(() => {
    if (!search.contactLog) return null

    const total = search.contactLog.length
    const responded = search.contactLog.filter((c) => c.responseReceived).length
    const willFound = search.contactLog.filter((c) => c.responseCategory === "will-found").length

    return { total, responded, willFound }
  }, [search.contactLog])

  const handleDownloadReport = () => {
    toast({
      title: "Report Downloaded",
      description: "Search report PDF has been downloaded",
    })
  }

  const handleDownloadInvoice = () => {
    toast({
      title: "Invoice Downloaded",
      description: "Payment invoice PDF has been downloaded",
    })
  }

  return (
    <div className="space-y-6">
      {search ? (
        <>
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => onNavigate("view-searches")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Searches
            </Button>
            {currentUser.userRole === "admin-staff" && (
              <Button onClick={() => onNavigate("process-search", { searchId })}>View in Admin Panel</Button>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-bold">Search Details</h1>
            <p className="text-muted-foreground">ID: {search.id}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Request Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Deceased Name</p>
                    <p className="font-semibold">{search.deceasedName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Date of Birth</p>
                      <p className="font-semibold">{formatDate(search.dob)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date of Death</p>
                      <p className="font-semibold">{formatDate(search.deathDate)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Known Addresses</p>
                    <ul className="mt-1 space-y-1">
                      {search.addresses.map((address, i) => (
                        <li key={i} className="text-sm">
                          {address}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Case Reference</p>
                    <p className="font-semibold">{search.caseReference}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Search Type</p>
                    <Badge variant={search.searchType === "advanced" ? "default" : "secondary"}>
                      {search.searchType === "advanced" ? "Advanced" : "Basic"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Requested By</p>
                    <p className="font-semibold">{search.requestedBy}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount Paid</p>
                    <p className="text-2xl font-bold">£{search.price}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Date</p>
                    <p className="font-semibold">{formatDate(search.requestDate)}</p>
                  </div>
                  <Button variant="outline" onClick={handleDownloadInvoice} className="w-full bg-transparent">
                    <Download className="mr-2 h-4 w-4" />
                    Download Invoice
                  </Button>
                </CardContent>
              </Card>

              {search.status === "complete" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Search Result</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      {search.willFound ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="font-semibold text-green-500">Will Found</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-5 w-5 text-orange-500" />
                          <span className="font-semibold text-orange-500">No Will Found</span>
                        </>
                      )}
                    </div>
                    {search.willFound && search.sourcesFirm && (
                      <div>
                        <p className="text-sm text-muted-foreground">Located At</p>
                        <p className="font-semibold">{search.sourcesFirm}</p>
                      </div>
                    )}
                    <Button onClick={handleDownloadReport} className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Download Full Report
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Progress Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {search.progressLog.map((log, index) => {
                      const isLast = index === search.progressLog.length - 1
                      return (
                        <div key={index} className="relative">
                          {!isLast && <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-border" />}
                          <div className="flex gap-4">
                            <div
                              className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full ${
                                isLast ? getStatusColor(log.status) : "bg-muted"
                              }`}
                            >
                              {isLast && <CheckCircle className="h-4 w-4 text-white" />}
                            </div>
                            <div className="flex-1 pb-4">
                              <p className="font-semibold">{formatStatus(log.status)}</p>
                              <p className="text-sm text-muted-foreground">{formatDateTime(log.timestamp)}</p>
                              <p className="text-sm mt-1">{log.notes}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {search.searchType === "advanced" &&
                search.status !== "received" &&
                search.status !== "payment-confirmed" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Sources Checked</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">WillReg Database</span>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                      {search.status !== "db-search-complete" && (
                        <>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Professional Outreach</span>
                            {search.status === "complete" ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <Clock className="h-5 w-5 text-orange-500" />
                            )}
                          </div>
                          {contactSummary && (
                            <p className="text-sm text-muted-foreground">
                              {contactSummary.total} firms contacted, {contactSummary.responded} responses received
                            </p>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
            </div>
          </div>

          {/* Detailed Firm Contact Log section */}
          {search.contactLog && search.contactLog.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Firm Contact Log</CardTitle>
                  {contactSummary && (
                    <div className="text-sm text-muted-foreground">
                      {contactSummary.total} contacted | {contactSummary.responded} responded |{" "}
                      {contactSummary.willFound} will found
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters and Search */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Select value={contactFilter} onValueChange={setContactFilter}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Contacts</SelectItem>
                      <SelectItem value="responded">Responded</SelectItem>
                      <SelectItem value="no-response">No Response</SelectItem>
                      <SelectItem value="will-found">Will Found</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Search firms..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="flex-1"
                  />
                </div>

                {/* Contact Log Table */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-medium">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 hover:bg-transparent"
                              onClick={() => handleSort("firmName")}
                            >
                              Firm Name
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </th>
                          <th className="text-left p-3 font-medium">Method</th>
                          <th className="text-left p-3 font-medium">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 hover:bg-transparent"
                              onClick={() => handleSort("contactedAt")}
                            >
                              Date
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </th>
                          <th className="text-left p-3 font-medium">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 hover:bg-transparent"
                              onClick={() => handleSort("status")}
                            >
                              Status
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </th>
                          <th className="w-12"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAndSortedContacts.map((contact) => {
                          const isExpanded = expandedContacts.has(contact.id)
                          return (
                            <>
                              <tr key={contact.id} className="border-t hover:bg-muted/30">
                                <td className="p-3 font-medium">{contact.firmName}</td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    {getContactMethodIcon(contact.contactMethod)}
                                    <span className="capitalize">{contact.contactMethod}</span>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="text-sm">
                                    <div>{getRelativeTime(contact.contactedAt)}</div>
                                    <div className="text-muted-foreground">{formatDate(contact.contactedAt)}</div>
                                  </div>
                                </td>
                                <td className="p-3">{getContactStatusBadge(contact)}</td>
                                <td className="p-3">
                                  <Button variant="ghost" size="sm" onClick={() => toggleContactExpanded(contact.id)}>
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </Button>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="border-t bg-muted/20">
                                  <td colSpan={5} className="p-4">
                                    <div className="space-y-3 text-sm">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-muted-foreground">Contacted By</p>
                                          <p className="font-medium">{contact.contactedBy}</p>
                                        </div>
                                        {contact.responseReceived && contact.responseAt && (
                                          <div>
                                            <p className="text-muted-foreground">Response Date</p>
                                            <p className="font-medium">{formatDateTime(contact.responseAt)}</p>
                                          </div>
                                        )}
                                      </div>
                                      {contact.adminNotes && (
                                        <div>
                                          <p className="text-muted-foreground">Notes</p>
                                          <p className="mt-1">{contact.adminNotes}</p>
                                        </div>
                                      )}
                                      {contact.responseContent && (
                                        <div>
                                          <p className="text-muted-foreground">Response Summary</p>
                                          <p className="mt-1">{contact.responseContent}</p>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {filteredAndSortedContacts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No contacts match your filters</div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => onNavigate("view-searches")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Searches
          </Button>
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Search not found</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
