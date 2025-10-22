"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { User } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Info,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import { parseCSVFile, detectColumnMapping, validateRow } from "@/lib/csv-parser"
import type { ParsedCSV, ColumnMapping, ValidatedRow } from "@/lib/csv-parser"
import { createUploadJob, processJobInBackground } from "@/lib/job-manager"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface BulkUploadPageProps {
  currentUser: User
  onNavigate: (page: string) => void
  selectedFirmForUpload?: {
    id: string
    name: string
    sraNumber: string
  } | null
  uploadContext?: string
  uploadNotes?: string
}

export function BulkUploadPage({
  currentUser,
  onNavigate,
  selectedFirmForUpload,
  uploadContext,
  uploadNotes,
}: BulkUploadPageProps) {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState<"upload" | "mapping" | "validation" | "review" | "complete">("upload")
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedCSV | null>(null)
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([])
  const [processingResults, setProcessingResults] = useState<{
    imported: number
    failed: number
    skipped: number
  } | null>(null)

  const downloadTemplate = () => {
    const csvContent =
      "testatorName,dob,address,postcode,willLocation,solicitorName,willDate,executorName\n" +
      "John Doe,15/03/1945,123 High Street London,SW1A 1AA,With Solicitor,Sarah Johnson,10/06/2020,Jane Doe\n" +
      "Jane Smith,22/08/1952,45 Park Lane Manchester,M1 4BT,At Home,David Brown,05/11/2021,\n" +
      "Robert Brown,10/12/1938,78 Oak Avenue Birmingham,B1 1BB,Bank,Emma Wilson,15/03/2019,Mary Brown"

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "will-registration-template.csv"
    a.click()

    toast({
      title: "Template Downloaded",
      description: "CSV template has been downloaded",
    })
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    try {
      const parsed = await parseCSVFile(selectedFile)
      setFile(selectedFile)
      setParsedData(parsed)

      // Auto-detect column mappings
      const mappings = detectColumnMapping(parsed.columns)
      setColumnMappings(mappings)

      toast({
        title: "File Loaded",
        description: `${parsed.totalRows} rows detected`,
      })

      setCurrentStep("mapping")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to parse CSV file",
        variant: "destructive",
      })
    }
  }

  const handleMappingComplete = (mappings: ColumnMapping[]) => {
    setColumnMappings(mappings)

    // Validate all rows
    if (parsedData) {
      const validated = parsedData.rows.map((row, index) => validateRow(row, index, mappings))
      setValidatedRows(validated)
    }

    setCurrentStep("validation")
  }

  const handleValidationComplete = (updatedRows: ValidatedRow[]) => {
    setValidatedRows(updatedRows)
    setCurrentStep("review")
  }

  const handleStartImport = () => {
    const validRows = validatedRows.filter((r) => r.status === "valid" || r.status === "warning")

    const isAdminUpload = currentUser.userRole === "admin-staff"
    const targetFirm =
      isAdminUpload && selectedFirmForUpload
        ? selectedFirmForUpload
        : {
            id: currentUser.firmId,
            name: currentUser.firmName,
          }

    // Create job
    const jobId = createUploadJob({
      fileName: file?.name || "bulk-upload.csv",
      totalRecords: validRows.length,
      firmId: targetFirm.id,
      firmName: targetFirm.name,
      userId: currentUser.email,
      userName: currentUser.userName,
      data: validRows.map((r) => ({
        ...r.data,
        registrationMethod: isAdminUpload ? "bulk-admin" : "bulk-firm",
        adminUploadedBy: isAdminUpload ? currentUser.email : null,
        adminUploadContext: isAdminUpload ? uploadContext : null,
        uploadNotes: isAdminUpload ? uploadNotes : null,
      })),
    })

    // Start background processing
    processJobInBackground(jobId, currentUser)

    // Show success toast
    toast({
      title: "Import Started",
      description: `Processing ${validRows.length} wills in the background. You can monitor progress from the Jobs page.`,
    })

    // Redirect to jobs page
    onNavigate("jobs")
  }

  const handleReset = () => {
    setCurrentStep("upload")
    setFile(null)
    setParsedData(null)
    setColumnMappings([])
    setValidatedRows([])
    setProcessingResults(null)
  }

  const stats =
    validatedRows.length > 0
      ? {
          total: validatedRows.length,
          valid: validatedRows.filter((r) => r.status === "valid").length,
          warnings: validatedRows.filter((r) => r.status === "warning").length,
          errors: validatedRows.filter((r) => r.status === "error").length,
        }
      : null

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {["upload", "mapping", "validation", "review", "complete"].map((step, index, arr) => (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  currentStep === step
                    ? "border-primary bg-primary text-primary-foreground"
                    : arr.indexOf(currentStep) > index
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted bg-background text-muted-foreground"
                }`}
              >
                {arr.indexOf(currentStep) > index ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
              </div>
              <span className="text-xs mt-2 capitalize">{step}</span>
            </div>
            {index < arr.length - 1 && (
              <div className={`h-0.5 flex-1 ${arr.indexOf(currentStep) > index ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {currentStep === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Will Registration</CardTitle>
            <p className="text-sm text-muted-foreground">Upload CSV file to register multiple wills</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Button onClick={downloadTemplate} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>

            <div className="border-2 border-dashed rounded-lg p-12 text-center">
              <Upload className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <div className="space-y-3">
                <p className="text-lg font-medium">Drag CSV file here or click to browse</p>
                <p className="text-sm text-muted-foreground">
                  Supported: CSV, Excel (.xlsx, .xls)
                  <br />
                  Maximum: 100MB (approximately 100,000 wills)
                </p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload">
                  <Button variant="default" asChild>
                    <span>Select File</span>
                  </Button>
                </label>
              </div>
            </div>

            {file && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {parsedData?.totalRows || 0} rows
                    </p>
                  </div>
                  <Button onClick={() => setFile(null)} variant="ghost" size="sm">
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {currentStep === "mapping" && parsedData && (
        <ColumnMappingStepInline
          parsedData={parsedData}
          initialMappings={columnMappings}
          onComplete={handleMappingComplete}
          onBack={() => setCurrentStep("upload")}
        />
      )}

      {currentStep === "validation" && parsedData && (
        <ValidationStepInline
          parsedData={parsedData}
          validatedRows={validatedRows}
          columnMappings={columnMappings}
          onComplete={handleValidationComplete}
          onBack={() => setCurrentStep("mapping")}
        />
      )}

      {currentStep === "review" && stats && (
        <ReviewStepInline stats={stats} onStartImport={handleStartImport} onBack={() => setCurrentStep("validation")} />
      )}
    </div>
  )
}

function ColumnMappingStepInline({
  parsedData,
  initialMappings,
  onComplete,
  onBack,
}: {
  parsedData: ParsedCSV
  initialMappings: ColumnMapping[]
  onComplete: (mappings: ColumnMapping[]) => void
  onBack: () => void
}) {
  const [mappings, setMappings] = useState<ColumnMapping[]>(initialMappings)

  const requiredFields = ["testatorName", "dob", "address", "postcode", "willLocation", "solicitorName", "willDate"]

  const allRequiredMapped = requiredFields.every((field) =>
    mappings.some((m) => m.willField === field && m.csvColumn !== null),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Column Mapping</CardTitle>
        <p className="text-sm text-muted-foreground">
          Map CSV columns to will registration fields. Required fields are marked with *
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          {mappings.map((mapping, index) => (
            <div key={mapping.willField} className="grid grid-cols-3 gap-4 items-center">
              <div>
                <Label className="text-sm font-medium">
                  {mapping.willField}
                  {requiredFields.includes(mapping.willField) && <span className="text-destructive ml-1">*</span>}
                </Label>
              </div>
              <Select
                value={typeof mapping.csvColumn === "string" ? mapping.csvColumn : mapping.csvColumn?.[0] || "none"}
                onValueChange={(value) => {
                  const newMappings = [...mappings]
                  newMappings[index].csvColumn = value === "none" ? null : value
                  setMappings(newMappings)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {parsedData.columns.map((col) => (
                    <SelectItem key={col.name} value={col.name}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                {mapping.csvColumn && <Badge variant="default">Mapped</Badge>}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between pt-4">
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={() => onComplete(mappings)} disabled={!allRequiredMapped}>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ValidationStepInline({
  parsedData,
  validatedRows,
  columnMappings,
  onComplete,
  onBack,
}: {
  parsedData: ParsedCSV
  validatedRows: ValidatedRow[]
  columnMappings: ColumnMapping[]
  onComplete: (rows: ValidatedRow[]) => void
  onBack: () => void
}) {
  const { toast } = useToast()
  const initialRows = Array.isArray(validatedRows) && validatedRows.length > 0 ? validatedRows : []
  const [rows, setRows] = useState<ValidatedRow[]>(initialRows)
  const [filter, setFilter] = useState<"all" | "valid" | "warning" | "error">("all")
  const [editingRow, setEditingRow] = useState<number | null>(null)
  const [editFormData, setEditFormData] = useState<any>({})
  const [showSkipModal, setShowSkipModal] = useState(false)
  const [showQuickFixModal, setShowQuickFixModal] = useState(false)
  const [quickFixType, setQuickFixType] = useState<"postcode" | "date" | null>(null)
  const [quickFixPreview, setQuickFixPreview] = useState<Array<{ rowIndex: number; before: string; after: string }>>([])

  useEffect(() => {
    if (Array.isArray(validatedRows) && validatedRows.length > 0) {
      setRows(validatedRows)
    }
  }, [validatedRows])

  const safeRows = Array.isArray(rows) && rows.length > 0 ? rows : []

  const filteredRows = safeRows.filter((row) => {
    if (!row || typeof row !== "object") return false
    return filter === "all" || row.status === filter
  })

  const stats = {
    total: safeRows.length,
    valid: safeRows.filter((r) => r && r.status === "valid").length,
    warnings: safeRows.filter((r) => r && r.status === "warning").length,
    errors: safeRows.filter((r) => r && r.status === "error").length,
  }

  const standardizePostcode = (postcode: string): string => {
    if (!postcode) return postcode
    const cleaned = postcode.replace(/\s/g, "").toUpperCase()
    if (cleaned.length >= 5) {
      return `${cleaned.slice(0, -3)} ${cleaned.slice(-3)}`
    }
    return postcode.toUpperCase()
  }

  const convertDateFormat = (date: string): string => {
    if (!date) return date
    // Try to detect US format (MM/DD/YYYY) and convert to UK (DD/MM/YYYY)
    const parts = date.split("/")
    if (parts.length === 3) {
      const [first, second, third] = parts
      // If first part > 12, it's likely already DD/MM/YYYY
      if (Number.parseInt(first) > 12) return date
      // If second part > 12, it's likely MM/DD/YYYY
      if (Number.parseInt(second) > 12) return `${second}/${first}/${third}`
    }
    return date
  }

  const handleEditRow = (rowIndex: number) => {
    setEditingRow(rowIndex)
    setEditFormData(rows[rowIndex].data)
  }

  const handleSaveEdit = () => {
    if (editingRow === null) return

    // Re-validate the edited row
    const validated = validateRow(editFormData, editingRow, columnMappings)

    // Update the row
    const newRows = [...rows]
    newRows[editingRow] = validated
    setRows(newRows)

    if (validated.status === "valid" || validated.status === "warning") {
      toast({
        title: "Row Fixed",
        description: `Row ${editingRow + 1} has been updated successfully`,
      })
    }

    setEditingRow(null)
    setEditFormData({})
  }

  const handleCancelEdit = () => {
    setEditingRow(null)
    setEditFormData({})
  }

  const handleQuickFixPostcodes = () => {
    const postcodeErrors = rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => row.errors?.some((e) => e.field === "postcode"))

    const preview = postcodeErrors.map(({ row, index }) => ({
      rowIndex: index,
      before: row.data.postcode || "",
      after: standardizePostcode(row.data.postcode || ""),
    }))

    setQuickFixType("postcode")
    setQuickFixPreview(preview)
    setShowQuickFixModal(true)
  }

  const handleQuickFixDates = () => {
    const dateErrors = rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => row.errors?.some((e) => e.field === "dob" || e.field === "willDate"))

    const preview = dateErrors.map(({ row, index }) => {
      const field = row.errors?.find((e) => e.field === "dob" || e.field === "willDate")?.field || "dob"
      return {
        rowIndex: index,
        before: row.data[field] || "",
        after: convertDateFormat(row.data[field] || ""),
      }
    })

    setQuickFixType("date")
    setQuickFixPreview(preview)
    setShowQuickFixModal(true)
  }

  const handleApplyQuickFix = () => {
    const newRows = [...rows]

    quickFixPreview.forEach(({ rowIndex, after }) => {
      const row = newRows[rowIndex]
      if (quickFixType === "postcode") {
        row.data.postcode = after
      } else if (quickFixType === "date") {
        const field = row.errors?.find((e) => e.field === "dob" || e.field === "willDate")?.field || "dob"
        row.data[field] = after
      }

      // Re-validate
      newRows[rowIndex] = validateRow(row.data, rowIndex, columnMappings)
    })

    setRows(newRows)
    setShowQuickFixModal(false)
    setQuickFixType(null)
    setQuickFixPreview([])

    toast({
      title: "Quick Fix Applied",
      description: `Fixed ${quickFixPreview.length} rows`,
    })
  }

  const handleSkipErrors = () => {
    setShowSkipModal(true)
  }

  const handleConfirmSkip = () => {
    const errorRows = rows.filter((r) => r.status === "error")
    const validRows = rows.filter((r) => r.status !== "error")

    // Generate error CSV
    const csvContent = generateErrorCSV(errorRows)
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `will_upload_errors_${Date.now()}.csv`
    a.click()

    setRows(validRows)
    setShowSkipModal(false)

    toast({
      title: "Errors Skipped",
      description: `Continuing with ${validRows.length} valid rows. Error CSV downloaded.`,
    })
  }

  const generateErrorCSV = (errorRows: ValidatedRow[]): string => {
    const headers = [
      "testatorName",
      "dob",
      "address",
      "postcode",
      "willLocation",
      "solicitorName",
      "willDate",
      "executorName",
      "Error_Reason",
      "Row_Number_Original",
    ]

    const csvRows = errorRows.map((row) => {
      const errorReason = row.errors?.map((e) => `${e.field}: ${e.message}`).join("; ") || ""
      return [
        row.data.testatorName || "",
        row.data.dob || "",
        row.data.address || "",
        row.data.postcode || "",
        row.data.willLocation || "",
        row.data.solicitorName || "",
        row.data.willDate || "",
        row.data.executorName || "",
        errorReason,
        row.rowIndex + 1,
      ]
        .map((field) => `"${field}"`)
        .join(",")
    })

    return [headers.join(","), ...csvRows].join("\n")
  }

  const getRecommendation = () => {
    if (stats.errors === 0) return null
    if (stats.errors <= 10) return "inline"
    if (stats.errors <= 50) return "bulk"
    return "export"
  }

  const recommendation = getRecommendation()

  if (safeRows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Validation & Preview</CardTitle>
          <p className="text-sm text-muted-foreground">Validating rows...</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Validation & Preview</CardTitle>
        <p className="text-sm text-muted-foreground">Review and fix any validation issues</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Rows</div>
          </div>
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.valid}</div>
            <div className="text-sm text-muted-foreground">Valid</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.warnings}</div>
            <div className="text-sm text-muted-foreground">Warnings</div>
          </div>
          <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.errors}</div>
            <div className="text-sm text-muted-foreground">Errors</div>
          </div>
        </div>

        {recommendation && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-blue-600">
                  {recommendation === "inline" && "✏️ Recommended: Fix inline"}
                  {recommendation === "bulk" && "⚡ Recommended: Use quick fixes + inline editing"}
                  {recommendation === "export" && "📥 Recommended: Export and fix externally"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {recommendation === "inline" &&
                    `You only have ${stats.errors} error${stats.errors > 1 ? "s" : ""}. Fix them now and continue!`}
                  {recommendation === "bulk" && "Try bulk fixes first, then edit remaining errors"}
                  {recommendation === "export" &&
                    `Fixing ${stats.errors} errors is faster in Excel. Export, fix, and re-upload.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {stats.errors > 0 && (
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleQuickFixPostcodes} variant="outline" size="sm">
              Fix All Postcodes
            </Button>
            <Button onClick={handleQuickFixDates} variant="outline" size="sm">
              Fix All Dates
            </Button>
            <Button onClick={handleSkipErrors} variant="outline" size="sm">
              Skip Errors & Export
            </Button>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2">
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
            All ({stats.total})
          </Button>
          <Button variant={filter === "valid" ? "default" : "outline"} size="sm" onClick={() => setFilter("valid")}>
            Valid ({stats.valid})
          </Button>
          <Button variant={filter === "warning" ? "default" : "outline"} size="sm" onClick={() => setFilter("warning")}>
            Warnings ({stats.warnings})
          </Button>
          <Button variant={filter === "error" ? "default" : "outline"} size="sm" onClick={() => setFilter("error")}>
            Errors ({stats.errors})
          </Button>
        </div>

        {/* Rows Preview */}
        <div className="border rounded-lg max-h-96 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted sticky top-0">
              <tr>
                <th className="p-2 text-left">Row</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Testator Name</th>
                <th className="p-2 text-left">DOB</th>
                <th className="p-2 text-left">Issues</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.slice(0, 100).map((row) => (
                <>
                  <tr key={row.rowIndex} className="border-t">
                    <td className="p-2">{row.rowIndex + 1}</td>
                    <td className="p-2">
                      {row.status === "valid" && <Badge variant="default">Valid</Badge>}
                      {row.status === "warning" && <Badge variant="secondary">Warning</Badge>}
                      {row.status === "error" && <Badge variant="destructive">Error</Badge>}
                    </td>
                    <td className="p-2">{row.data?.testatorName || "-"}</td>
                    <td className="p-2">{row.data?.dob || "-"}</td>
                    <td className="p-2">
                      {row.errors && Array.isArray(row.errors) && row.errors.length > 0 && (
                        <div className="text-xs text-destructive">{row.errors[0].message}</div>
                      )}
                    </td>
                    <td className="p-2">
                      {row.status === "error" && (
                        <Button onClick={() => handleEditRow(row.rowIndex)} variant="ghost" size="sm">
                          Edit
                        </Button>
                      )}
                    </td>
                  </tr>
                  {editingRow === row.rowIndex && (
                    <tr>
                      <td colSpan={6} className="p-4 bg-muted">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Testator Name *</Label>
                              <input
                                type="text"
                                value={editFormData.testatorName || ""}
                                onChange={(e) => setEditFormData({ ...editFormData, testatorName: e.target.value })}
                                className="w-full px-3 py-2 border rounded-md"
                              />
                            </div>
                            <div>
                              <Label>Date of Birth *</Label>
                              <input
                                type="text"
                                value={editFormData.dob || ""}
                                onChange={(e) => setEditFormData({ ...editFormData, dob: e.target.value })}
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder="DD/MM/YYYY"
                              />
                            </div>
                            <div>
                              <Label>Address *</Label>
                              <input
                                type="text"
                                value={editFormData.address || ""}
                                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                                className="w-full px-3 py-2 border rounded-md"
                              />
                            </div>
                            <div>
                              <Label>Postcode *</Label>
                              <input
                                type="text"
                                value={editFormData.postcode || ""}
                                onChange={(e) => setEditFormData({ ...editFormData, postcode: e.target.value })}
                                className="w-full px-3 py-2 border rounded-md"
                              />
                            </div>
                            <div>
                              <Label>Will Location *</Label>
                              <input
                                type="text"
                                value={editFormData.willLocation || ""}
                                onChange={(e) => setEditFormData({ ...editFormData, willLocation: e.target.value })}
                                className="w-full px-3 py-2 border rounded-md"
                              />
                            </div>
                            <div>
                              <Label>Solicitor Name *</Label>
                              <input
                                type="text"
                                value={editFormData.solicitorName || ""}
                                onChange={(e) => setEditFormData({ ...editFormData, solicitorName: e.target.value })}
                                className="w-full px-3 py-2 border rounded-md"
                              />
                            </div>
                            <div>
                              <Label>Will Date *</Label>
                              <input
                                type="text"
                                value={editFormData.willDate || ""}
                                onChange={(e) => setEditFormData({ ...editFormData, willDate: e.target.value })}
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder="DD/MM/YYYY"
                              />
                            </div>
                            <div>
                              <Label>Executor Name</Label>
                              <input
                                type="text"
                                value={editFormData.executorName || ""}
                                onChange={(e) => setEditFormData({ ...editFormData, executorName: e.target.value })}
                                className="w-full px-3 py-2 border rounded-md"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleSaveEdit} size="sm">
                              Save Changes
                            </Button>
                            <Button onClick={handleCancelEdit} variant="outline" size="sm">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRows.length > 100 && (
          <p className="text-sm text-muted-foreground text-center">Showing first 100 of {filteredRows.length} rows</p>
        )}

        <div className="flex justify-between pt-4">
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={() => onComplete(safeRows)} disabled={stats.errors > 0}>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {showQuickFixModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
              <h3 className="text-lg font-semibold mb-4">
                {quickFixType === "postcode" ? "Fix All Postcodes" : "Fix All Dates"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Preview of changes that will be applied. Review and confirm to proceed.
              </p>
              <div className="space-y-2 mb-6">
                {quickFixPreview.slice(0, 10).map((preview) => (
                  <div key={preview.rowIndex} className="flex items-center gap-4 text-sm p-2 bg-muted rounded">
                    <span className="text-muted-foreground">Row {preview.rowIndex + 1}:</span>
                    <span className="text-destructive line-through">{preview.before}</span>
                    <span>→</span>
                    <span className="text-green-600">{preview.after}</span>
                  </div>
                ))}
                {quickFixPreview.length > 10 && (
                  <p className="text-sm text-muted-foreground">...and {quickFixPreview.length - 10} more changes</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleApplyQuickFix}>Apply Changes ({quickFixPreview.length} rows)</Button>
                <Button
                  onClick={() => {
                    setShowQuickFixModal(false)
                    setQuickFixType(null)
                    setQuickFixPreview([])
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {showSkipModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Skip {stats.errors} Error Rows?</h3>
              <div className="space-y-4 mb-6">
                <p className="text-sm">You'll continue with:</p>
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded">
                  <p className="text-sm font-medium">✓ {stats.valid + stats.warnings} valid rows (will be imported)</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-950 rounded">
                  <p className="text-sm font-medium mb-2">Skipped rows:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {rows
                      .filter((r) => r.status === "error")
                      .slice(0, 5)
                      .map((r) => (
                        <li key={r.rowIndex}>
                          • Row {r.rowIndex + 1} - {r.errors?.[0]?.message}
                        </li>
                      ))}
                    {stats.errors > 5 && <li>...and {stats.errors - 5} more</li>}
                  </ul>
                </div>
                <p className="text-sm text-muted-foreground">
                  We'll create a CSV file with these {stats.errors} rows so you can fix and upload them later.
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleConfirmSkip}>Skip & Continue</Button>
                <Button onClick={() => setShowSkipModal(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ReviewStepInline({
  stats,
  onStartImport,
  onBack,
}: {
  stats: { total: number; valid: number; warnings: number; errors: number }
  onStartImport: () => void
  onBack: () => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review & Confirm</CardTitle>
        <p className="text-sm text-muted-foreground">Review the summary before importing</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <span className="font-medium">Total Wills to Import</span>
            <span className="text-2xl font-bold">{stats.valid + stats.warnings}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium">Valid Records</span>
              </div>
              <div className="text-2xl font-bold">{stats.valid}</div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="font-medium">Records with Warnings</span>
              </div>
              <div className="text-2xl font-bold">{stats.warnings}</div>
            </div>
          </div>

          {stats.errors > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-600">Records with Errors</span>
              </div>
              <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
              <p className="text-sm text-muted-foreground mt-2">These records will be skipped during import</p>
            </div>
          )}

          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              <div className="text-sm">
                <p className="font-medium text-blue-600">Background Processing</p>
                <p className="text-muted-foreground mt-1">
                  Wills will be processed in batches of 100 in the background. You can continue using the app and
                  monitor progress from the Jobs page.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={onStartImport}>
            Start Import
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Remove ProcessingStepInline and CompletionStepInline - no longer needed
// The original ProcessingStepInline and CompletionStepInline components are removed as their functionality is replaced by background job processing.
