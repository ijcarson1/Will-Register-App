"use client"

import { useState, useEffect } from "react"
import type { User } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { getFirms } from "@/lib/storage"
import { Search, Building2 } from "lucide-react"

interface FirmSelectionPageProps {
  currentUser: User
  onFirmSelected: (firm: any, context: string, notes: string) => void
  onCancel: () => void
}

export function FirmSelectionPage({ currentUser, onFirmSelected, onCancel }: FirmSelectionPageProps) {
  const [firms, setFirms] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFirm, setSelectedFirm] = useState<any | null>(null)
  const [uploadContext, setUploadContext] = useState<string>("onboarding")
  const [customContext, setCustomContext] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    const allFirms = getFirms()
    setFirms(allFirms)
  }, [])

  const filteredFirms = firms.filter(
    (firm) =>
      firm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      firm.sraNumber.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const recentFirms = firms.slice(0, 5)

  const handleContinue = () => {
    if (!selectedFirm) return

    const contextValue = uploadContext === "other" ? customContext : uploadContext
    onFirmSelected(selectedFirm, contextValue, notes)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Register Will - Select Firm</h1>
        <p className="text-muted-foreground">Choose which firm to register wills for</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Firm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Firm Search */}
          <div className="space-y-2">
            <Label htmlFor="firm-search">Search Firms *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="firm-search"
                placeholder="Search by name or SRA number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Search Results */}
          {searchQuery && (
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {filteredFirms.length > 0 ? (
                <div className="divide-y">
                  {filteredFirms.slice(0, 10).map((firm) => (
                    <button
                      key={firm.id}
                      onClick={() => setSelectedFirm(firm)}
                      className={`w-full p-4 text-left hover:bg-muted transition-colors ${
                        selectedFirm?.id === firm.id ? "bg-muted" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{firm.name}</div>
                          <div className="text-sm text-muted-foreground">
                            SRA: {firm.sraNumber} • {firm.willCount || 0} wills
                          </div>
                        </div>
                        {selectedFirm?.id === firm.id && (
                          <div className="ml-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">No firms found</div>
              )}
            </div>
          )}

          {/* Recent Firms */}
          {!searchQuery && (
            <div className="space-y-3">
              <Label>Recent Firms</Label>
              <div className="space-y-2">
                {recentFirms.map((firm) => (
                  <button
                    key={firm.id}
                    onClick={() => setSelectedFirm(firm)}
                    className={`w-full p-3 text-left border rounded-lg hover:bg-muted transition-colors ${
                      selectedFirm?.id === firm.id ? "bg-muted border-primary" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{firm.name}</div>
                        <div className="text-xs text-muted-foreground">{firm.willCount || 0} wills</div>
                      </div>
                      {selectedFirm?.id === firm.id && (
                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Upload Context */}
          <div className="space-y-3">
            <Label>Upload Context (optional)</Label>
            <RadioGroup value={uploadContext} onValueChange={setUploadContext}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="onboarding" id="onboarding" />
                <Label htmlFor="onboarding" className="font-normal cursor-pointer">
                  Onboarding - Initial Data Migration
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="regular" id="regular" />
                <Label htmlFor="regular" className="font-normal cursor-pointer">
                  Regular Upload - Routine Update
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="correction" id="correction" />
                <Label htmlFor="correction" className="font-normal cursor-pointer">
                  Data Correction - Fixing Errors
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other" className="font-normal cursor-pointer">
                  Other
                </Label>
              </div>
            </RadioGroup>

            {uploadContext === "other" && (
              <Input
                placeholder="Specify context..."
                value={customContext}
                onChange={(e) => setCustomContext(e.target.value)}
              />
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder='e.g., "Historical wills from legacy system"'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button onClick={handleContinue} disabled={!selectedFirm}>
              Continue to Registration
            </Button>
            <Button onClick={onCancel} variant="outline">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
