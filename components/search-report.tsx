"use client"

import { format, parseISO } from "date-fns"
import type { SearchRequest } from "@/types"
import { getWills, getFirmById } from "@/lib/storage"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Info, FileText } from "lucide-react"

interface SearchReportProps {
  search: SearchRequest
}

export function SearchReport({ search }: SearchReportProps) {
  const wills = getWills()
  const matchedWill = search.matchedWillId ? wills.find((w) => w.id === search.matchedWillId) : null
  const requestingFirm = getFirmById(search.firmId)

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd MMM yyyy HH:mm")
    } catch {
      return "N/A"
    }
  }

  const formatDateOnly = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd MMM yyyy")
    } catch {
      return "N/A"
    }
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 space-y-6 print:p-4">
      {/* Header */}
      <div className="text-center space-y-2 border-b pb-6">
        <div className="flex items-center justify-center gap-2">
          <FileText className="h-8 w-8" />
          <h1 className="text-3xl font-bold">WillReg</h1>
        </div>
        <Badge variant={search.willFound ? "default" : "secondary"} className="text-sm">
          {search.searchType === "advanced" ? "Advanced" : "Basic"} Search Report
        </Badge>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Report ID: {search.reportId || `RPT-${search.id}`}</p>
          <p>Generated: {formatDate(search.completionDate || new Date().toISOString())}</p>
        </div>
      </div>

      {/* Search Request Summary */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h2 className="text-xl font-semibold">Search Request Summary</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Case Reference</p>
              <p className="font-medium">{search.caseReference}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Requested By</p>
              <p className="font-medium">{requestingFirm?.name || search.requestedBy}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Request Date</p>
              <p className="font-medium">{formatDate(search.requestDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Completion Date</p>
              <p className="font-medium">{formatDate(search.completionDate || new Date().toISOString())}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Search Type</p>
              <p className="font-medium capitalize">{search.searchType}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Fee Paid</p>
              <p className="font-medium">£{search.price}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deceased Details */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h2 className="text-xl font-semibold">Deceased Person Details</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Full Name</p>
              <p className="font-medium text-lg">{search.deceasedName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">Date of Birth</p>
                <p className="font-medium">{formatDateOnly(search.dob)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date of Death</p>
                <p className="font-medium">{formatDateOnly(search.deathDate)}</p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Known Addresses</p>
              <ul className="mt-1 space-y-1">
                {search.addresses.map((addr, i) => (
                  <li key={i} className="font-medium">
                    • {addr}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Search Section */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h2 className="text-xl font-semibold">Database Search</h2>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">Database Searched</p>
                <p className="font-medium">WillReg National Will Registry</p>
              </div>
              <div>
                <p className="text-muted-foreground">Records Searched</p>
                <p className="font-medium">{wills.length.toLocaleString()} registered wills</p>
              </div>
              <div>
                <p className="text-muted-foreground">Search Criteria</p>
                <p className="font-medium">Name, DOB, Address</p>
              </div>
              <div>
                <p className="text-muted-foreground">Search Result</p>
                <p className="font-medium">{search.willFound ? "Found" : "Not Found"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Search - Professional Outreach */}
      {search.searchType === "advanced" && search.firmsContacted && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-xl font-semibold">Professional Outreach Summary</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Firms Contacted</p>
                  <p className="font-medium text-2xl">{search.firmsContacted.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Firms Responded</p>
                  <p className="font-medium text-2xl">
                    {search.firmsContacted.filter((f) => f.finalStatus !== "no-response").length}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Response Rate</p>
                  <p className="font-medium text-2xl">
                    {Math.round(
                      (search.firmsContacted.filter((f) => f.finalStatus !== "no-response").length /
                        search.firmsContacted.length) *
                        100,
                    )}
                    %
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Firms Contacted</h3>
                <div className="space-y-2 text-sm">
                  {search.firmsContacted.map((firm, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div>
                        <p className="font-medium">{firm.firmName}</p>
                        <p className="text-xs text-muted-foreground">{firm.distance} from known address</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={firm.finalStatus === "no-match" ? "secondary" : "default"}>
                          {firm.finalStatus === "no-match" ? "No Match" : firm.finalStatus}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {firm.contactMethods.map((m) => m.method).join(", ")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outcome Section */}
      <Card className={search.willFound ? "border-green-500" : "border-amber-500"}>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-3">
            {search.willFound ? (
              <>
                <CheckCircle className="h-8 w-8 text-green-500" />
                <h2 className="text-2xl font-semibold text-green-700">Will Registration Located</h2>
              </>
            ) : (
              <>
                <Info className="h-8 w-8 text-amber-500" />
                <h2 className="text-2xl font-semibold text-amber-700">No Will Registration Found</h2>
              </>
            )}
          </div>

          {search.willFound && matchedWill ? (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">A will registration has been located for {search.deceasedName}</p>
              <div className="bg-muted/50 p-4 rounded space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-muted-foreground">Will Date</p>
                    <p className="font-medium">{formatDateOnly(matchedWill.willDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Registration Date</p>
                    <p className="font-medium">{formatDateOnly(matchedWill.registeredDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Will Location</p>
                    <p className="font-medium">{matchedWill.willLocation}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Solicitor</p>
                    <p className="font-medium">{matchedWill.solicitorName}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                After comprehensive search, no will registration was located for {search.deceasedName}
              </p>
              <div className="bg-muted/50 p-4 rounded space-y-2">
                <h4 className="font-semibold">What This Means</h4>
                <p className="text-muted-foreground">
                  This search certificate confirms that reasonable steps were taken to locate a will. However, this does
                  not definitively prove that no will exists.
                </p>
                <h4 className="font-semibold mt-3">Recommendations</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Check the deceased's personal effects and safe deposit boxes</li>
                  <li>• Contact any solicitors the deceased may have used</li>
                  <li>• Search local probate registries</li>
                  <li>• Consider intestacy procedures if no will is found</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Due Diligence Statement */}
      <Card>
        <CardContent className="pt-6 space-y-3 text-sm">
          <h2 className="text-lg font-semibold">Due Diligence Statement</h2>
          <p className="text-muted-foreground">
            This report certifies that all reasonable steps were taken to locate a will registration for the deceased
            person named above. The search was conducted in accordance with professional standards and covered the
            sources listed in this report.
          </p>
          <p className="text-muted-foreground">
            Date Range Covered: All records up to {formatDateOnly(new Date().toISOString())}
          </p>
          {search.searchType === "advanced" && (
            <p className="text-muted-foreground">Geographic Area: 15-mile radius from known addresses</p>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground space-y-1 border-t pt-4">
        <p>Report generated by WillReg Platform</p>
        <p>Report ID: {search.reportId || `RPT-${search.id}`}</p>
        <p className="italic">
          This search was conducted with reasonable care but does not guarantee that no will exists. This certificate
          may be used as evidence in probate proceedings.
        </p>
      </div>
    </div>
  )
}
