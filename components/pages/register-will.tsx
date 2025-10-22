"use client"

import type React from "react"
import { FirmContextBanner } from "@/components/layout/firm-context-banner"
import { useState } from "react"
import type { User } from "@/types"
import { addWill, checkDuplicateWill } from "@/lib/storage"
import { generateId } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BulkUploadPage } from "./bulk-upload"

interface RegisterWillPageProps {
  currentUser: User
  onNavigate: (page: string) => void
  selectedFirmForUpload?: {
    id: string
    name: string
    sraNumber: string
  } | null
  uploadContext?: string
  uploadNotes?: string
  onChangeFirm?: () => void
}

export function RegisterWillPage({
  currentUser,
  onNavigate,
  selectedFirmForUpload,
  uploadContext,
  uploadNotes,
  onChangeFirm,
}: RegisterWillPageProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    testatorName: "",
    dob: "",
    address: "",
    postcode: "",
    willLocation: "",
    solicitorName: "",
    willDate: "",
    executorName: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [certificateId, setCertificateId] = useState("")

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors }

    if (["testatorName", "dob", "address", "postcode", "willLocation", "solicitorName", "willDate"].includes(name)) {
      if (!value.trim()) {
        newErrors[name] = "This field is required"
      } else {
        delete newErrors[name]
      }
    }

    setErrors(newErrors)
  }

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    validateField(name, value)
  }

  const handlePostcodeLookup = () => {
    // Mock postcode lookup
    setFormData((prev) => ({
      ...prev,
      address: "123 High Street, London",
    }))
    toast({
      title: "Address Found",
      description: "Address populated from postcode lookup",
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    console.log("[v0] Form submitted")
    console.log("[v0] Form data:", formData)
    console.log("[v0] Current user role:", currentUser.userRole)
    console.log("[v0] Selected firm:", selectedFirmForUpload)

    const requiredFields = ["testatorName", "dob", "address", "postcode", "willLocation", "solicitorName", "willDate"]
    const newErrors: Record<string, string> = {}

    requiredFields.forEach((field) => {
      if (!formData[field as keyof typeof formData].trim()) {
        newErrors[field] = "This field is required"
      }
    })

    if (Object.keys(newErrors).length > 0) {
      console.log("[v0] Validation errors:", newErrors)
      setErrors(newErrors)
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (checkDuplicateWill(formData.testatorName, formData.dob)) {
      console.log("[v0] Duplicate will found")
      setShowDuplicateModal(true)
      return
    }

    console.log("[v0] No validation errors, submitting will")
    submitWill()
  }

  const submitWill = () => {
    const willId = generateId("W")
    const now = new Date().toISOString()

    const isAdminUpload = currentUser.userRole === "admin-staff"
    const targetFirm =
      isAdminUpload && selectedFirmForUpload
        ? selectedFirmForUpload
        : {
            id: currentUser.firmId,
            name: currentUser.firmName,
          }

    console.log("[v0] Creating will with ID:", willId)
    console.log("[v0] Target firm:", targetFirm)
    console.log("[v0] Is admin upload:", isAdminUpload)

    const will = {
      id: willId,
      ...formData,
      certificateUrl: `/certificates/${willId}.pdf`,
      firmId: targetFirm.id,
      firmName: targetFirm.name,
      registeredBy: currentUser.userName,
      registeredDate: now,
      updatedAt: now,
      updatedBy: currentUser.email,
      version: 1,
      registrationMethod: "individual",
      adminUploadedBy: isAdminUpload ? currentUser.email : null,
      adminUploadContext: isAdminUpload ? uploadContext : null,
      uploadNotes: isAdminUpload ? uploadNotes : null,
    }

    console.log("[v0] Will object created:", will)

    try {
      addWill(will)
      console.log("[v0] Will added to storage successfully")
      setCertificateId(willId)
      setShowDuplicateModal(false)
      setShowSuccessModal(true)

      setFormData({
        testatorName: "",
        dob: "",
        address: "",
        postcode: "",
        willLocation: "",
        solicitorName: "",
        willDate: "",
        executorName: "",
      })
      setErrors({})

      toast({
        title: "Success",
        description: "Will registered successfully",
      })
    } catch (error) {
      console.error("[v0] Error adding will:", error)
      toast({
        title: "Error",
        description: "Failed to register will. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSuccessClose = () => {
    setShowSuccessModal(false)
    onNavigate("dashboard")
  }

  const isFormValid = () => {
    const requiredFields = ["testatorName", "dob", "address", "postcode", "willLocation", "solicitorName", "willDate"]
    return (
      requiredFields.every((field) => formData[field as keyof typeof formData].trim()) &&
      Object.keys(errors).length === 0
    )
  }

  return (
    <div className="space-y-6">
      {currentUser.userRole === "admin-staff" && selectedFirmForUpload && onChangeFirm && (
        <FirmContextBanner firm={selectedFirmForUpload} context={uploadContext} onChangeFirm={onChangeFirm} />
      )}

      <div>
        <h1 className="text-3xl font-bold">Register Will</h1>
        <p className="text-muted-foreground">
          {currentUser.userRole === "admin-staff" && selectedFirmForUpload
            ? `Registering wills for ${selectedFirmForUpload.name}`
            : "Register a new will in the database"}
        </p>
      </div>

      <Tabs defaultValue="individual">
        <TabsList>
          <TabsTrigger value="individual">Individual Registration</TabsTrigger>
          <TabsTrigger value="bulk">Bulk CSV Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="individual">
          <Card>
            <CardHeader>
              <CardTitle>Will Registration Form</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="testatorName">Testator Full Name *</Label>
                    <Input
                      id="testatorName"
                      value={formData.testatorName}
                      onChange={(e) => handleChange("testatorName", e.target.value)}
                      onBlur={(e) => validateField("testatorName", e.target.value)}
                    />
                    {errors.testatorName && <p className="text-sm text-red-500">{errors.testatorName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth *</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dob}
                      onChange={(e) => handleChange("dob", e.target.value)}
                      onBlur={(e) => validateField("dob", e.target.value)}
                    />
                    {errors.dob && <p className="text-sm text-red-500">{errors.dob}</p>}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      onBlur={(e) => validateField("address", e.target.value)}
                      rows={3}
                    />
                    {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postcode">Postcode *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="postcode"
                        value={formData.postcode}
                        onChange={(e) => handleChange("postcode", e.target.value)}
                        onBlur={(e) => validateField("postcode", e.target.value)}
                      />
                      <Button type="button" variant="outline" onClick={handlePostcodeLookup}>
                        Lookup
                      </Button>
                    </div>
                    {errors.postcode && <p className="text-sm text-red-500">{errors.postcode}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="willLocation">Will Location *</Label>
                    <Select
                      value={formData.willLocation}
                      onValueChange={(value) => handleChange("willLocation", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="With Solicitor">With Solicitor</SelectItem>
                        <SelectItem value="At Home">At Home</SelectItem>
                        <SelectItem value="Bank">Bank</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.willLocation && <p className="text-sm text-red-500">{errors.willLocation}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="solicitorName">Solicitor Name *</Label>
                    <Input
                      id="solicitorName"
                      value={formData.solicitorName}
                      onChange={(e) => handleChange("solicitorName", e.target.value)}
                      onBlur={(e) => validateField("solicitorName", e.target.value)}
                    />
                    {errors.solicitorName && <p className="text-sm text-red-500">{errors.solicitorName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="willDate">Will Date *</Label>
                    <Input
                      id="willDate"
                      type="date"
                      value={formData.willDate}
                      onChange={(e) => handleChange("willDate", e.target.value)}
                      onBlur={(e) => validateField("willDate", e.target.value)}
                    />
                    {errors.willDate && <p className="text-sm text-red-500">{errors.willDate}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="executorName">Executor Name (Optional)</Label>
                    <Input
                      id="executorName"
                      value={formData.executorName}
                      onChange={(e) => handleChange("executorName", e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={!isFormValid()}>
                    Register Will
                  </Button>
                  <Button type="button" variant="outline" onClick={() => onNavigate("dashboard")}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <BulkUploadPage
            currentUser={currentUser}
            onNavigate={onNavigate}
            selectedFirmForUpload={selectedFirmForUpload}
            uploadContext={uploadContext}
            uploadNotes={uploadNotes}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={showDuplicateModal} onOpenChange={setShowDuplicateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Will Found</DialogTitle>
            <DialogDescription>
              A will for {formData.testatorName} with the same date of birth already exists in the database. Do you want
              to proceed with registration anyway?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDuplicateModal(false)}>
              Cancel
            </Button>
            <Button onClick={submitWill}>Proceed Anyway</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Will Registered Successfully</DialogTitle>
            <DialogDescription>
              {currentUser.userRole === "admin-staff" && selectedFirmForUpload && (
                <div className="mb-2">Registered for: {selectedFirmForUpload.name}</div>
              )}
              Certificate ID: {certificateId}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                toast({
                  title: "Certificate Downloaded",
                  description: "Certificate PDF has been downloaded",
                })
              }}
              variant="outline"
            >
              Download Certificate
            </Button>
            {currentUser.userRole === "admin-staff" && selectedFirmForUpload ? (
              <>
                <Button
                  onClick={() => {
                    setShowSuccessModal(false)
                    setFormData({
                      testatorName: "",
                      dob: "",
                      address: "",
                      postcode: "",
                      willLocation: "",
                      solicitorName: "",
                      willDate: "",
                      executorName: "",
                    })
                  }}
                  variant="outline"
                >
                  Register Another for This Firm
                </Button>
                <Button onClick={onChangeFirm} variant="outline">
                  Register for Different Firm
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  setShowSuccessModal(false)
                  onNavigate("manage-wills")
                }}
                variant="outline"
              >
                View in Manage Wills
              </Button>
            )}
            <Button onClick={handleSuccessClose}>Return to Dashboard</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
