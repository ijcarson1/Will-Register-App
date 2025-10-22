import Papa from "papaparse"

export interface CSVColumn {
  name: string
  index: number
  sampleValues: string[]
}

export interface ParsedCSV {
  columns: CSVColumn[]
  rows: any[]
  totalRows: number
}

export function parseCSVFile(file: File): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      complete: (results) => {
        const columns: CSVColumn[] =
          results.meta.fields?.map((field, index) => ({
            name: field,
            index,
            sampleValues: results.data.slice(0, 5).map((row: any) => row[field] || ""),
          })) || []

        resolve({
          columns,
          rows: results.data,
          totalRows: results.data.length,
        })
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}

export interface ColumnMapping {
  csvColumn: string | string[] | null
  willField: string
  required: boolean
  combineWith?: string[] // for multi-column merge
  separator?: string // for multi-column merge
  fixedValue?: string // for fixed values
}

export const WILL_FIELDS: Array<{
  field: string
  label: string
  required: boolean
  type: "text" | "date" | "select"
  options?: string[]
}> = [
  { field: "testatorName", label: "Testator Full Name", required: true, type: "text" },
  { field: "dob", label: "Date of Birth", required: true, type: "date" },
  { field: "address", label: "Address", required: true, type: "text" },
  { field: "postcode", label: "Postcode", required: true, type: "text" },
  {
    field: "willLocation",
    label: "Will Location",
    required: true,
    type: "select",
    options: ["With Solicitor", "At Home", "Bank", "Other"],
  },
  { field: "solicitorName", label: "Solicitor Name", required: true, type: "text" },
  { field: "willDate", label: "Will Date", required: true, type: "date" },
  { field: "executorName", label: "Executor Name", required: false, type: "text" },
]

export function detectColumnMapping(columns: CSVColumn[]): ColumnMapping[] {
  const mappings: ColumnMapping[] = []

  WILL_FIELDS.forEach((field) => {
    const csvColumn = findBestMatch(field.field, field.label, columns)
    mappings.push({
      csvColumn: csvColumn?.name || null,
      willField: field.field,
      required: field.required,
    })
  })

  return mappings
}

function findBestMatch(fieldName: string, fieldLabel: string, columns: CSVColumn[]): CSVColumn | null {
  const variations: Record<string, string[]> = {
    testatorName: ["testator name", "name", "client name", "full name", "testator", "client"],
    dob: ["dob", "date of birth", "birth date", "date_birth", "birthdate"],
    address: ["address", "addr", "street address", "full address", "address1"],
    postcode: ["postcode", "post code", "postal code", "zip", "zipcode", "post_code"],
    willLocation: ["will location", "location", "will_location", "storage location"],
    solicitorName: ["solicitor name", "solicitor", "lawyer", "attorney", "solicitor_name"],
    willDate: ["will date", "date", "will_date", "execution date", "signed date"],
    executorName: ["executor name", "executor", "executor_name"],
  }

  const searchTerms = variations[fieldName] || [fieldName.toLowerCase()]

  for (const column of columns) {
    const columnLower = column.name.toLowerCase().trim()
    if (searchTerms.some((term) => columnLower === term || columnLower.includes(term))) {
      return column
    }
  }

  return null
}

export interface ValidationError {
  type: "error" | "warning"
  field: string
  message: string
  suggestion?: string
}

export interface ValidatedRow {
  rowIndex: number
  status: "valid" | "warning" | "error"
  data: any
  errors: ValidationError[]
}

export function validateRow(row: any, rowIndex: number, mappings: ColumnMapping[]): ValidatedRow {
  const errors: ValidationError[] = []
  const data: any = {}

  mappings.forEach((mapping) => {
    if (!mapping.csvColumn && !mapping.fixedValue) {
      if (mapping.required) {
        errors.push({
          type: "error",
          field: mapping.willField,
          message: "Required field not mapped",
        })
      }
      return
    }

    let value: string

    if (mapping.fixedValue) {
      value = mapping.fixedValue
    } else if (Array.isArray(mapping.csvColumn)) {
      // Multi-column merge
      value = mapping.csvColumn
        .map((col) => row[col] || "")
        .filter((v) => v.trim())
        .join(mapping.separator || ", ")
    } else {
      value = row[mapping.csvColumn] || ""
    }

    data[mapping.willField] = value

    // Validate required fields
    if (mapping.required && !value.trim()) {
      errors.push({
        type: "error",
        field: mapping.willField,
        message: "Required field is empty",
      })
    }

    // Field-specific validation
    if (value.trim()) {
      const fieldErrors = validateField(mapping.willField, value)
      errors.push(...fieldErrors)
    }
  })

  const status = errors.some((e) => e.type === "error") ? "error" : errors.length > 0 ? "warning" : "valid"

  return {
    rowIndex,
    status,
    data,
    errors,
  }
}

function validateField(fieldName: string, value: string): ValidationError[] {
  const errors: ValidationError[] = []

  switch (fieldName) {
    case "dob":
    case "willDate":
      if (!isValidDate(value)) {
        errors.push({
          type: "error",
          field: fieldName,
          message: "Invalid date format",
          suggestion: "Expected format: DD/MM/YYYY or YYYY-MM-DD",
        })
      }
      break

    case "postcode":
      const postcodeValidation = validatePostcode(value)
      if (!postcodeValidation.valid) {
        errors.push({
          type: postcodeValidation.canFix ? "warning" : "error",
          field: fieldName,
          message: postcodeValidation.message,
          suggestion: postcodeValidation.suggestion,
        })
      }
      break

    case "testatorName":
      if (value.trim().split(" ").length < 2) {
        errors.push({
          type: "warning",
          field: fieldName,
          message: "Name appears to be incomplete (single word)",
        })
      }
      break
  }

  return errors
}

function isValidDate(dateStr: string): boolean {
  // Support multiple date formats
  const formats = [
    /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
  ]

  return formats.some((format) => format.test(dateStr))
}

function validatePostcode(postcode: string): { valid: boolean; canFix: boolean; message: string; suggestion?: string } {
  const ukPostcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i

  if (ukPostcodeRegex.test(postcode)) {
    return { valid: true, canFix: false, message: "" }
  }

  // Check if it's just a formatting issue
  const normalized = postcode.toUpperCase().replace(/\s/g, "")
  if (ukPostcodeRegex.test(normalized)) {
    const formatted = normalized.replace(/^([A-Z]{1,2}\d{1,2}[A-Z]?)(\d[A-Z]{2})$/, "$1 $2")
    return {
      valid: false,
      canFix: true,
      message: "Postcode format issue",
      suggestion: formatted,
    }
  }

  return {
    valid: false,
    canFix: false,
    message: "Invalid UK postcode format",
  }
}

export function fixPostcode(postcode: string): string {
  const normalized = postcode.toUpperCase().replace(/\s/g, "")
  return normalized.replace(/^([A-Z]{1,2}\d{1,2}[A-Z]?)(\d[A-Z]{2})$/, "$1 $2")
}

export function fixDateFormat(dateStr: string): string {
  // Try to parse and convert to YYYY-MM-DD
  const ddmmyyyy = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (ddmmyyyy) {
    return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`
  }

  const ddmmyyyy2 = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (ddmmyyyy2) {
    return `${ddmmyyyy2[3]}-${ddmmyyyy2[2]}-${ddmmyyyy2[1]}`
  }

  return dateStr
}
