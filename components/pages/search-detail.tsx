"use client"

import type { User } from "@/types"
import { getSearchById } from "@/lib/storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatDate, formatDateTime } from "@/lib/utils"
import { Download, ArrowLeft, CheckCircle, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SearchDetailPageProps {
  searchId: string
  currentUser: User
  onNavigate: (page: string, data?: any) => void
}

export function SearchDetailPage({ searchId, currentUser, onNavigate }: SearchDetailPageProps) {
  const { toast } = useToast()
  const search = getSearchById(searchId)

  if (!search) {
    return (
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
    )
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
                      {search.status === "complete" && (
                        <p className="text-sm text-muted-foreground">12 firms contacted, 8 responses received</p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  )
}
