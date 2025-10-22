export type UserRole = "primary-admin" | "standard" | "view-only" | "admin-staff"

export type SearchStatus =
  | "received"
  | "payment-confirmed"
  | "db-search-complete"
  | "professional-outreach"
  | "results-compilation"
  | "complete"

export type SearchType = "basic" | "advanced"

export type ContactMethod = "email" | "phone"

export type ContactStatus = "not-contacted" | "emailed" | "called" | "responded"

export interface User {
  id: string
  accountType: "firm" | "individual"

  // Personal info
  firstName: string
  lastName: string
  fullName: string // computed
  email: string
  phone?: string

  // Account status
  status: "active" | "inactive" | "pending-approval" | "trial" | "suspended"
  emailVerified: boolean
  emailVerifiedAt?: string

  // Security
  passwordLastChanged: string
  requirePasswordChange: boolean
  twoFactorEnabled: boolean

  // Firm association
  firmId?: string
  firmName?: string
  sraNumber?: string
  userRole?: UserRole // only if firm account
  positionInFirm?: string

  // Subscription (for firm accounts)
  subscriptionStatus?: "trial" | "active" | "expired" | "cancelled"
  trialEndsAt?: string
  subscriptionPlan?: "professional" | "individual"
  nextBillingDate?: string

  // Activity
  registeredAt: string
  lastLoginAt?: string
  searchCount: number
  activeSearchCount: number
  willCount: number

  // Admin
  createdBy?: string // 'self-registered' or admin user
  adminNotes: AdminNote[]
  flags: UserFlag[]

  uploadBatchCount?: number
  totalWillsUploaded?: number
}

export interface AdminNote {
  id: string
  content: string
  addedBy: string
  addedAt: string
  editedAt?: string
  editedBy?: string
}

export interface UserFlag {
  id: string
  type: "suspicious-activity" | "payment-issue" | "support-needed" | "high-value" | "other"
  reason: string
  flaggedBy: string
  flaggedAt: string
  resolvedAt?: string
  resolvedBy?: string
}

export interface AccessLogEntry {
  id: string
  timestamp: string
  action: string
  ipAddress: string
  device: string
  browser: string
}

export interface ActivityLogEntry {
  id: string
  timestamp: string
  action: string
  details: string
  performedBy: string
}

export interface WillRegistration {
  id: string
  testatorName: string
  dob: string
  address: string
  postcode: string
  willLocation: string
  solicitorName: string
  willDate: string
  executorName?: string
  certificateUrl: string
  registeredBy: string
  registeredDate: string
  updatedAt: string
  updatedBy: string
  version: number

  firmId?: string
  firmName?: string
  uploadBatchId?: string
  registrationMethod?: "individual" | "bulk-firm" | "bulk-admin"
  adminUploadedBy?: string
  adminUploadContext?: string
}

export interface UploadBatch {
  id: string
  firmId: string
  firmName: string
  uploadedBy: string
  uploadedByName: string
  uploadedByEmail: string
  uploadDate: string
  context: "onboarding" | "regular" | "correction" | "other"
  contextNotes?: string
  totalRecords: number
  successfulRecords: number
  failedRecords: number
  duplicatesSkipped: number
  processingTime: string
  status: "in-progress" | "complete" | "failed"
  importReport?: string
}

export interface ProgressLogEntry {
  status: string
  timestamp: string
  notes: string
}

export interface ContactHistory {
  date: string
  method: ContactMethod
  response: string
  notes: string
}

export interface ContactLogEntry {
  id: string
  firmId: string
  firmName: string
  contactMethod: "email" | "phone" | "letter"
  contactedAt: string
  contactedBy: string
  status: "sent" | "delivered" | "opened" | "responded" | "bounced" | "no-answer" | "voicemail"

  // Email specific
  emailSubject?: string
  emailOpened?: boolean
  emailOpenedAt?: string

  // Phone specific
  callDuration?: string
  callOutcome?: "answered" | "no-answer" | "voicemail" | "busy"

  // Response details
  responseReceived: boolean
  responseAt?: string
  responseMethod?: "email" | "phone" | "fax"
  responseFrom?: string
  responseContent?: string
  responseCategory?: "will-found" | "no-match" | "checking-records" | "no-response" | "need-more-info"

  // Follow-ups
  followUpRequired: boolean
  followUpDate?: string
  followUpCompleted?: boolean

  // Notes
  adminNotes: string
  clientNotes?: string
}

export interface SearchNote {
  id: string
  addedBy: string
  addedAt: string
  content: string
  noteType: "internal" | "client-visible"
  editedAt?: string
  editedBy?: string
}

export interface FirmIdentified {
  firmId: string
  firmName: string
  distance: string
  postcode: string
  responseRate: number
  identifiedAt: string
}

export interface OutreachSummary {
  totalFirmsIdentified: number
  totalFirmsContacted: number
  totalResponses: number
  responseRate: number
  averageResponseTime: string
  methodsUsed: string[]
  willFoundAtFirm?: string
}

export interface SearchRequest {
  id: string
  deceasedName: string
  dob: string
  deathDate: string
  addresses: string[]
  caseReference: string
  searchType: SearchType
  price: 35 | 65
  status: SearchStatus
  firmId: string
  requestedBy: string
  requestDate: string
  completionDate?: string
  willFound: boolean
  sourcesFirm?: string
  progressLog: ProgressLogEntry[]
  assignedTo?: string
  priority?: "high" | "medium" | "low"
  autoProcessed: boolean
  processingStarted?: string
  processingCompleted?: string
  firmsContacted?: FirmContact[]
  reportGenerated: boolean
  reportId?: string
  matchedWillId?: string
  upgradedFrom?: string

  firmsIdentified?: FirmIdentified[]
  contactLog?: ContactLogEntry[]
  searchNotes?: SearchNote[]
  outreachSummary?: OutreachSummary
}

export interface FirmContact {
  firmId: string
  firmName: string
  distance: string
  contactMethods: Array<{
    method: "email" | "phone"
    timestamp: string
    status: "sent" | "opened" | "responded" | "bounced"
    response?: string
    responseTimestamp?: string
  }>
  finalStatus: "no-match" | "match-found" | "no-response" | "uncertain"
}

export interface SolicitorFirm {
  id: string
  name: string
  address: string
  postcode: string
  phone: string
  email: string
  sraNumber: string
  practiceAreas: string[]
  responseRate: number
  lastContact?: string
  contactHistory: ContactHistory[]

  // Registration
  registeredAt?: string
  registeredBy?: string // userId of primary admin who created firm

  // Subscription
  subscriptionStatus?: "trial" | "active" | "expired" | "cancelled"
  trialStartDate?: string
  trialEndDate?: string
  subscriptionStartDate?: string
  billingCycle?: "monthly" | "annual"
  monthlyPrice?: number // 45

  // Stats
  userCount?: number
  searchCount?: number
  willCount?: number
  totalSpent?: number
}

export interface UserInvitation {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  positionInFirm?: string
  firmId: string
  firmName: string
  invitedBy: string
  invitedAt: string
  expiresAt: string
  status: "pending" | "accepted" | "expired" | "cancelled"
  token: string
  welcomeMessage?: string
}

export interface UploadJob {
  id: string // JOB_001
  type: "will-upload" | "search-batch"
  firmId: string
  firmName: string
  userId: string
  userName: string

  // Job details
  fileName: string
  totalRecords: number

  // Progress tracking
  status: "queued" | "processing" | "complete" | "failed" | "cancelled"
  processedRecords: number
  successfulRecords: number
  failedRecords: number
  currentBatch: number
  totalBatches: number

  // Timing
  startedAt: string
  completedAt?: string
  estimatedCompletion?: string
  duration?: string

  // Results
  errors: Array<{
    row: number
    reason: string
    data: any
  }>

  // Data
  data?: any[]

  // User feedback
  canCancel: boolean
  canRetry: boolean

  // Activity log
  activityLog: Array<{
    timestamp: string
    message: string
  }>
}
