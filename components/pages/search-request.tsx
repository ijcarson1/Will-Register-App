"use client"

import type React from "react"

import { useState } from "react"
import type { User, SearchType } from "@/types"
import { addSearch } from "@/lib/storage"
import { generateId } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus, X, CheckCircle } from "lucide-react"

interface SearchRequestPageProps {
  currentUser: User
  onNavigate: (page: string, data?: any) => void
}

export function SearchRequestPage({ currentUser, onNavigate }: SearchRequestPageProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    deceasedName: "",
    dob: "",
    deathDate: "",
    caseReference: "",
  })
  const [addresses, setAddresses] = useState<string[]>([""])
  const [searchType, setSearchType] = useState<SearchType>("basic")
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [searchId, setSearchId] = useState("")

  const handleAddAddress = () => {
    setAddresses([...addresses, ""])
  }

  const handleRemoveAddress = (index: number) => {
    if (addresses.length > 1) {
      setAddresses(addresses.filter((_, i) => i !== index))
    }
  }

  const handleAddressChange = (index: number, value: string) => {
    const newAddresses = [...addresses]
    newAddresses[index] = value
    setAddresses(newAddresses)
  }

  const isFormValid = () => {
    return formData.deceasedName.trim() && formData.dob && formData.deathDate && addresses.some((a) => a.trim())
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isFormValid()) {
      setShowPaymentModal(true)
    }
  }

  const handlePayment = () => {
    // Simulate payment processing
    setTimeout(() => {
      const newSearchId = generateId("SR")
      const search = {
        id: newSearchId,
        deceasedName: formData.deceasedName,
        dob: formData.dob,
        deathDate: formData.deathDate,
        addresses: addresses.filter((a) => a.trim()),
        caseReference: formData.caseReference || `EST-${Date.now()}`,
        searchType,
        price: searchType === "advanced" ? 65 : 35,
        status: "payment-confirmed" as const,
        firmId: currentUser.firmId,
        requestedBy: currentUser.userName,
        requestDate: new Date().toISOString(),
        willFound: false,
        progressLog: [
          {
            status: "received",
            timestamp: new Date().toISOString(),
            notes: "Search request received",
          },
          {
            status: "payment-confirmed",
            timestamp: new Date().toISOString(),
            notes: `Payment of £${searchType === "advanced" ? 65 : 35} confirmed`,
          },
        ],
      }

      addSearch(search)
      setSearchId(newSearchId)
      setShowPaymentModal(false)
      setShowSuccessModal(true)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Search Request</h1>
        <p className="text-muted-foreground">Request a will search for a deceased person</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Deceased Person Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deceasedName">Full Name *</Label>
                <Input
                  id="deceasedName"
                  value={formData.deceasedName}
                  onChange={(e) => setFormData({ ...formData, deceasedName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth *</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deathDate">Date of Death *</Label>
                <Input
                  id="deathDate"
                  type="date"
                  value={formData.deathDate}
                  onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="caseReference">Case Reference (Optional)</Label>
                <Input
                  id="caseReference"
                  value={formData.caseReference}
                  onChange={(e) => setFormData({ ...formData, caseReference: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Known Addresses *</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddAddress}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Address
                </Button>
              </div>
              {addresses.map((address, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={address}
                    onChange={(e) => handleAddressChange(index, e.target.value)}
                    placeholder="Enter address"
                    required={index === 0}
                  />
                  {addresses.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveAddress(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Search Type</CardTitle>
            <CardDescription>Choose the level of search you require</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={searchType} onValueChange={(value) => setSearchType(value as SearchType)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className={searchType === "basic" ? "border-primary" : ""}>
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="basic" id="basic" />
                      <div className="flex-1">
                        <Label htmlFor="basic" className="text-lg font-semibold cursor-pointer">
                          Basic Search - £35
                        </Label>
                        <p className="text-sm text-muted-foreground mt-2">Database search only</p>
                        <ul className="mt-3 space-y-1 text-sm">
                          <li>• WillReg database search</li>
                          <li>• 1 hour completion</li>
                          <li>• Certificate of search</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={searchType === "advanced" ? "border-primary" : ""}>
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="advanced" id="advanced" />
                      <div className="flex-1">
                        <Label htmlFor="advanced" className="text-lg font-semibold cursor-pointer">
                          Advanced Search - £65
                        </Label>
                        <p className="text-sm text-muted-foreground mt-2">Database + professional outreach</p>
                        <ul className="mt-3 space-y-1 text-sm">
                          <li>• WillReg database search</li>
                          <li>• Contact local solicitor firms</li>
                          <li>• Multi-tier outreach (email, phone)</li>
                          <li>• 2-5 days completion</li>
                          <li>• Detailed report with evidence</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What to Expect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Sources Searched</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• WillReg national database</li>
                {searchType === "advanced" && (
                  <>
                    <li>• Solicitor firms within 15-mile radius</li>
                    <li>• Professional networks and associations</li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Timeline</h4>
              <p className="text-sm text-muted-foreground">
                {searchType === "basic"
                  ? "Results typically within 1 hour of payment confirmation"
                  : "Results typically within 2-5 business days"}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Success Probability</h4>
              <p className="text-sm text-muted-foreground">Based on historical data: ~65% of searches locate a will</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">No Will Found Policy</h4>
              <p className="text-sm text-muted-foreground">
                If no will is found, you will receive a certificate of search detailing all sources checked. This can be
                used as evidence in probate proceedings.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={!isFormValid()} size="lg">
            Proceed to Payment
          </Button>
          <Button type="button" variant="outline" onClick={() => onNavigate("dashboard")}>
            Cancel
          </Button>
        </div>
      </form>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment</DialogTitle>
            <DialogDescription>
              {searchType === "advanced" ? "Advanced" : "Basic"} Search - £{searchType === "advanced" ? 65 : 35}
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Search Type:</span>
                <span className="font-semibold">{searchType === "advanced" ? "Advanced" : "Basic"}</span>
              </div>
              <div className="flex justify-between">
                <span>Deceased:</span>
                <span className="font-semibold">{formData.deceasedName}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total:</span>
                <span>£{searchType === "advanced" ? 65 : 35}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Mock payment - Click "Pay Now" to simulate payment
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button onClick={handlePayment}>Pay Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent>
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <DialogTitle className="text-center">Payment Successful</DialogTitle>
            <DialogDescription className="text-center">Your search request has been submitted</DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">Search ID:</p>
            <p className="text-lg font-mono font-bold">{searchId}</p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowSuccessModal(false)
                onNavigate("dashboard")
              }}
            >
              Return to Dashboard
            </Button>
            <Button
              onClick={() => {
                setShowSuccessModal(false)
                onNavigate("search-detail", { searchId })
              }}
            >
              Track Progress
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
