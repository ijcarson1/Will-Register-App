"use client"

import { useState } from "react"
import type { User, ContactLogEntry, SearchNote } from "@/types"
import { getSearchById, updateSearch, getFirms } from "@/lib/storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, SearchIcon, Mail, Phone, ChevronDown, ChevronUp, StickyNote, Lock, Eye } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { EmailDialog, PhoneDialog } from "@/components/contact-dialogs"

interface ProcessSearchPageProps {
  searchId: string
  currentUser: User
  onNavigate: (page: string, data?: any) => void
}

export function ProcessSearchPage({ searchId, currentUser, onNavigate }: ProcessSearchPageProps) {
  const { toast } = useToast()
  const search = getSearchById(searchId)
  const [isSearching, setIsSearching] = useState(false)
  const [dbResult, setDbResult] = useState<"found" | "not-found" | null>(null)
  const [radius, setRadius] = useState("10")
  const [nearbyFirms, setNearbyFirms] = useState<any[]>([])
  const [expandedFirm, setExpandedFirm] = useState<string | null>(null)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false)
  const [selectedFirm, setSelectedFirm] = useState<any>(null)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [noteContent, setNoteContent] = useState("")
  const [noteType, setNoteType] = useState<"internal" | "client-visible">("internal")

  if (!search) {
    return <div>Search not found</div>
  }

  const contactLog = search.contactLog || []
  const searchNotes = search.searchNotes || []

  const handleStartDbSearch = () => {
    setIsSearching(true)
    setTimeout(() => {
      setIsSearching(false)
      const found = Math.random() < 0.2
      setDbResult(found ? "found" : "not-found")

      const newLog = {
        status: "db-search-complete",
        timestamp: new Date().toISOString(),
        notes: found ? "Will found in database" : "No match found in database",
      }

      updateSearch(searchId, {
        status: "db-search-complete",
        progressLog: [...search.progressLog, newLog],
      })

      toast({
        title: "Database Search Complete",
        description: found ? "Will found!" : "No match found",
      })
    }, 2000)
  }

  const handleGenerateFirmList = () => {
    const firms = getFirms()
    const identified = firms.slice(0, 8).map((f) => ({
      ...f,
      distance: `${Math.floor(Math.random() * 15) + 1} mi`,
      contactStatus: "not-contacted" as const,
    }))

    setNearbyFirms(identified)

    updateSearch(searchId, {
      firmsIdentified: identified.map((f) => ({
        firmId: f.id,
        firmName: f.name,
        distance: f.distance,
        postcode: f.postcode,
        responseRate: f.responseRate,
        identifiedAt: new Date().toISOString(),
      })),
    })

    toast({
      title: "Firm List Generated",
      description: `Found ${firms.length} firms within ${radius} miles`,
    })
  }

  const handleAddContactLog = (entry: Omit<ContactLogEntry, "id">) => {
    const newEntry: ContactLogEntry = {
      ...entry,
      id: `CL${Date.now()}`,
    }

    updateSearch(searchId, {
      contactLog: [...contactLog, newEntry],
    })
  }

  const handleAddNote = () => {
    if (!noteContent.trim()) return

    const newNote: SearchNote = {
      id: `SN${Date.now()}`,
      addedBy: currentUser.userName,
      addedAt: new Date().toISOString(),
      content: noteContent,
      noteType,
    }

    updateSearch(searchId, {
      searchNotes: [...searchNotes, newNote],
    })

    toast({
      title: "Note Added",
      description: `${noteType === "internal" ? "Internal" : "Client-visible"} note added`,
    })

    setNoteContent("")
    setNoteDialogOpen(false)
  }

  const getFirmContactHistory = (firmId: string) => {
    return contactLog.filter((entry) => entry.firmId === firmId)
  }

  const handleStartOutreach = () => {
    const newLog = {
      status: "professional-outreach",
      timestamp: new Date().toISOString(),
      notes: `Started professional outreach - ${nearbyFirms.length} firms identified`,
    }

    updateSearch(searchId, {
      status: "professional-outreach",
      progressLog: [...search.progressLog, newLog],
    })

    toast({
      title: "Outreach Started",
      description: "Professional outreach phase initiated",
    })
  }

  const handleMarkComplete = (willFound: boolean, firmName?: string) => {
    const newLog = {
      status: "complete",
      timestamp: new Date().toISOString(),
      notes: willFound ? `Will located at ${firmName}` : "Search complete - no will found",
    }

    updateSearch(searchId, {
      status: "complete",
      completionDate: new Date().toISOString(),
      willFound,
      sourcesFirm: firmName,
      progressLog: [...search.progressLog, newLog],
    })

    toast({
      title: "Search Complete",
      description: "Search has been marked as complete",
    })

    setTimeout(() => {
      onNavigate("search-queue")
    }, 1500)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        <Button variant="ghost" onClick={() => onNavigate("search-queue")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Queue
        </Button>

        <div>
          <h1 className="text-3xl font-bold">Process Search</h1>
          <p className="text-muted-foreground">ID: {search.id}</p>
        </div>

        {/* Step 1: Review Request */}
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Review Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Deceased Name</p>
                <p className="font-semibold">{search.deceasedName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Search Type</p>
                <Badge variant={search.searchType === "advanced" ? "default" : "secondary"}>
                  {search.searchType === "advanced" ? "Advanced" : "Basic"}
                </Badge>
              </div>
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
          </CardContent>
        </Card>

        {/* Step 2: Database Search */}
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Database Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!dbResult && (
              <Button onClick={handleStartDbSearch} disabled={isSearching}>
                <SearchIcon className="mr-2 h-4 w-4" />
                {isSearching ? "Searching..." : "Start DB Search"}
              </Button>
            )}

            {dbResult === "found" && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="font-semibold text-green-700">Will Found in Database!</p>
                  <p className="text-sm text-green-600 mt-1">Will ID: W001 - Registered by Thompson & Associates</p>
                </div>
                <Button onClick={() => handleMarkComplete(true, "Thompson & Associates")}>Mark Complete</Button>
              </div>
            )}

            {dbResult === "not-found" && (
              <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="font-semibold text-orange-700">No Match Found</p>
                  <p className="text-sm text-orange-600 mt-1">Will not found in WillReg database</p>
                </div>
                {search.searchType === "basic" ? (
                  <Button onClick={() => handleMarkComplete(false)}>Mark Complete (Basic Search)</Button>
                ) : (
                  <Button
                    onClick={() => {
                      const newLog = {
                        status: "db-search-complete",
                        timestamp: new Date().toISOString(),
                        notes: "Database search complete - proceeding to outreach",
                      }
                      updateSearch(searchId, {
                        status: "db-search-complete",
                        progressLog: [...search.progressLog, newLog],
                      })
                    }}
                  >
                    Proceed to Outreach
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Professional Outreach (Advanced only) */}
        {search.searchType === "advanced" && dbResult === "not-found" && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Professional Outreach</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="space-y-2">
                  <Label>Search Radius</Label>
                  <Select value={radius} onValueChange={setRadius}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 miles</SelectItem>
                      <SelectItem value="10">10 miles</SelectItem>
                      <SelectItem value="15">15 miles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleGenerateFirmList}>Generate Firm List</Button>
              </div>

              {nearbyFirms.length > 0 && (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Firm Name</TableHead>
                        <TableHead>Distance</TableHead>
                        <TableHead>Response Rate</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nearbyFirms.map((firm) => {
                        const firmHistory = getFirmContactHistory(firm.id)
                        const isExpanded = expandedFirm === firm.id

                        return (
                          <>
                            <TableRow key={firm.id}>
                              <TableCell className="font-medium">{firm.name}</TableCell>
                              <TableCell>{firm.distance}</TableCell>
                              <TableCell>{firm.responseRate}%</TableCell>
                              <TableCell>
                                <Badge variant={firmHistory.length > 0 ? "default" : "outline"}>
                                  {firmHistory.length > 0 ? `${firmHistory.length} contact(s)` : "Not Contacted"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedFirm(firm)
                                      setEmailDialogOpen(true)
                                    }}
                                  >
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedFirm(firm)
                                      setPhoneDialogOpen(true)
                                    }}
                                  >
                                    <Phone className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>
                                {firmHistory.length > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setExpandedFirm(isExpanded ? null : firm.id)}
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                            {isExpanded && firmHistory.length > 0 && (
                              <TableRow>
                                <TableCell colSpan={6} className="bg-muted/50">
                                  <div className="p-4 space-y-3">
                                    <h4 className="font-semibold text-sm">Contact Timeline</h4>
                                    {firmHistory.map((entry) => (
                                      <div key={entry.id} className="border-l-2 border-primary pl-4 space-y-1">
                                        <div className="flex items-center gap-2">
                                          {entry.contactMethod === "email" ? (
                                            <Mail className="h-3 w-3" />
                                          ) : (
                                            <Phone className="h-3 w-3" />
                                          )}
                                          <span className="font-medium text-sm capitalize">{entry.contactMethod}</span>
                                          <span className="text-xs text-muted-foreground">
                                            {formatDate(entry.contactedAt)}
                                          </span>
                                          <Badge variant="outline" className="text-xs">
                                            {entry.status}
                                          </Badge>
                                        </div>
                                        {entry.emailSubject && (
                                          <p className="text-xs text-muted-foreground">Subject: {entry.emailSubject}</p>
                                        )}
                                        {entry.responseReceived && entry.responseContent && (
                                          <div className="bg-background p-2 rounded text-xs mt-2">
                                            <p className="font-medium">Response from {entry.responseFrom}:</p>
                                            <p className="text-muted-foreground mt-1">{entry.responseContent}</p>
                                          </div>
                                        )}
                                        {entry.adminNotes && (
                                          <p className="text-xs text-muted-foreground">Notes: {entry.adminNotes}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        )
                      })}
                    </TableBody>
                  </Table>

                  <div className="flex gap-4">
                    <Button onClick={handleStartOutreach}>Start Outreach</Button>
                    <Button variant="outline" onClick={() => handleMarkComplete(true, "Cooper & Associates")}>
                      Mock: Will Found
                    </Button>
                    <Button variant="outline" onClick={() => handleMarkComplete(false)}>
                      Mock: Complete (Not Found)
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Sidebar - Search Notes */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Search Notes</CardTitle>
              <Button size="sm" onClick={() => setNoteDialogOpen(true)}>
                <StickyNote className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {searchNotes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes yet</p>
            ) : (
              searchNotes.map((note) => (
                <div key={note.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    {note.noteType === "internal" ? (
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <Eye className="h-3 w-3 text-muted-foreground" />
                    )}
                    <Badge variant={note.noteType === "internal" ? "secondary" : "default"} className="text-xs">
                      {note.noteType === "internal" ? "Internal" : "Client Visible"}
                    </Badge>
                  </div>
                  <p className="text-sm">{note.content}</p>
                  <div className="text-xs text-muted-foreground">
                    <p>By: {note.addedBy}</p>
                    <p>{formatDate(note.addedAt)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Add Note Dialog */}
        {noteDialogOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Add Search Note</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Note Type</Label>
                  <Select value={noteType} onValueChange={(v: any) => setNoteType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Internal Only</SelectItem>
                      <SelectItem value="client-visible">Client Visible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Note Content</Label>
                  <Textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={5}
                    placeholder="Enter your note..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddNote}>Save Note</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {selectedFirm && (
        <>
          <EmailDialog
            open={emailDialogOpen}
            onOpenChange={setEmailDialogOpen}
            firm={selectedFirm}
            deceasedName={search.deceasedName}
            searchId={search.id}
            caseReference={search.caseReference}
            onSave={handleAddContactLog}
          />
          <PhoneDialog
            open={phoneDialogOpen}
            onOpenChange={setPhoneDialogOpen}
            firm={selectedFirm}
            onSave={handleAddContactLog}
          />
        </>
      )}
    </div>
  )
}
