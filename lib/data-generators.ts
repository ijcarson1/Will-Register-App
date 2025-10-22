import type {
  WillRegistration,
  SearchRequest,
  SolicitorFirm,
  FirmUser,
  ContactLog,
  SearchNote,
  User,
  UserInvitation,
  UserRole,
  UploadBatch,
} from "@/types"

// Random data pools
const FIRST_NAMES = [
  "James",
  "Mary",
  "John",
  "Patricia",
  "Robert",
  "Jennifer",
  "Michael",
  "Linda",
  "William",
  "Elizabeth",
  "David",
  "Barbara",
  "Richard",
  "Susan",
  "Joseph",
  "Jessica",
  "Thomas",
  "Sarah",
  "Christopher",
  "Karen",
  "Charles",
  "Nancy",
  "Daniel",
  "Margaret",
  "Matthew",
  "Lisa",
  "Anthony",
  "Betty",
  "Mark",
  "Dorothy",
  "Donald",
  "Sandra",
  "Steven",
  "Ashley",
  "Andrew",
  "Kimberly",
  "Paul",
  "Emily",
  "Joshua",
  "Donna",
  "Brian",
  "Amanda",
  "George",
  "Melissa",
  "Timothy",
  "Deborah",
]

const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Thompson",
  "White",
  "Harris",
  "Sanchez",
  "Clark",
  "Ramirez",
  "Lewis",
  "Robinson",
  "Walker",
  "Young",
  "Allen",
  "King",
  "Wright",
  "Scott",
  "Torres",
  "Nguyen",
  "Hill",
  "Flores",
  "Green",
  "Adams",
  "Nelson",
  "Baker",
  "Hall",
  "Rivera",
  "Campbell",
  "Mitchell",
  "Carter",
  "Roberts",
]

const FIRM_PREFIXES = [
  "Smith",
  "Jones",
  "Williams",
  "Davies",
  "Thompson",
  "Roberts",
  "Harrison",
  "Mitchell",
  "Cooper",
  "Baker",
  "Turner",
  "Phillips",
  "Campbell",
  "Parker",
  "Evans",
  "Edwards",
  "Collins",
  "Stewart",
  "Morris",
  "Rogers",
]

const FIRM_SUFFIXES = [
  "& Partners",
  "& Associates",
  "Legal Services",
  "Solicitors",
  "Law Firm",
  "& Co",
  "Legal Group",
  "Law Associates",
]

const STREET_NAMES = [
  "High Street",
  "Market Street",
  "King Street",
  "Queen Street",
  "Church Road",
  "Station Road",
  "Park Lane",
  "Victoria Road",
  "Bridge Street",
  "Castle Street",
  "Mill Lane",
  "Green Lane",
  "Manor Road",
  "York Road",
  "London Road",
]

const CITIES = [
  { name: "Manchester", postcodePrefix: "M" },
  { name: "Liverpool", postcodePrefix: "L" },
  { name: "Birmingham", postcodePrefix: "B" },
  { name: "Leeds", postcodePrefix: "LS" },
  { name: "Bristol", postcodePrefix: "BS" },
  { name: "Sheffield", postcodePrefix: "S" },
  { name: "Newcastle", postcodePrefix: "NE" },
  { name: "Nottingham", postcodePrefix: "NG" },
  { name: "Leicester", postcodePrefix: "LE" },
  { name: "Coventry", postcodePrefix: "CV" },
  { name: "Bradford", postcodePrefix: "BD" },
  { name: "Cardiff", postcodePrefix: "CF" },
  { name: "Edinburgh", postcodePrefix: "EH" },
  { name: "Glasgow", postcodePrefix: "G" },
  { name: "Southampton", postcodePrefix: "SO" },
]

const POSITIONS = [
  "Solicitor",
  "Partner",
  "Associate",
  "Legal Executive",
  "Paralegal",
  "Senior Partner",
  "Managing Partner",
  "Legal Assistant",
]

// Helper functions
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDate(startDaysAgo: number, endDaysAgo: number): Date {
  const now = new Date()
  const start = new Date(now.getTime() - startDaysAgo * 24 * 60 * 60 * 1000)
  const end = new Date(now.getTime() - endDaysAgo * 24 * 60 * 60 * 1000)
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

function formatDateTime(date: Date): string {
  return date.toISOString()
}

function generatePostcode(prefix: string): string {
  const num1 = randomInt(1, 9)
  const num2 = randomInt(1, 9)
  const letter1 = String.fromCharCode(65 + randomInt(0, 25))
  const letter2 = String.fromCharCode(65 + randomInt(0, 25))
  return `${prefix}${num1} ${num2}${letter1}${letter2}`
}

function generateFullName(): string {
  return `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`
}

function generateAddress(): { address: string; postcode: string; city: string } {
  const city = randomItem(CITIES)
  const streetNumber = randomInt(1, 150)
  const streetName = randomItem(STREET_NAMES)
  const address = `${streetNumber} ${streetName}, ${city.name}`
  const postcode = generatePostcode(city.postcodePrefix)
  return { address, postcode, city: city.name }
}

// Main generator functions
export function generateMockWills(
  count: number,
  firms: SolicitorFirm[],
  uploadBatches: UploadBatch[],
): WillRegistration[] {
  const wills: WillRegistration[] = []
  const users = ["Sarah Johnson", "David Brown", "Michael Chen", "Emma Wilson"]

  // 40% of wills come from admin upload batches
  const adminUploadCount = Math.floor(count * 0.4)
  const firmUploadCount = count - adminUploadCount

  // Generate admin-uploaded wills
  const completeBatches = uploadBatches.filter((b) => b.status === "complete")
  let batchIndex = 0

  for (let i = 0; i < adminUploadCount; i++) {
    const batch = completeBatches[batchIndex % completeBatches.length]
    const firm = firms.find((f) => f.id === batch.firmId)
    const registeredDate = new Date(batch.uploadDate)
    const willDate = randomDate(1825, 365)
    const dobDate = randomDate(36500, 27375)
    const location = generateAddress()

    wills.push({
      id: `W${String(i + 1).padStart(6, "0")}`,
      testatorName: generateFullName(),
      dob: formatDate(dobDate),
      address: location.address,
      postcode: location.postcode,
      willLocation: randomItem(["With Solicitor", "At Home", "Bank Safe Deposit", "With Executor", "Probate Registry"]),
      solicitorName: firm?.name || "Unknown",
      willDate: formatDate(willDate),
      executorName: Math.random() > 0.3 ? generateFullName() : undefined,
      certificateUrl: `/certificates/W${String(i + 1).padStart(6, "0")}.pdf`,
      registeredBy: batch.uploadedByEmail,
      registeredDate: formatDate(registeredDate),
      updatedAt: formatDateTime(registeredDate),
      updatedBy: batch.uploadedByEmail,
      version: 1,
      firmId: firm?.id,
      firmName: firm?.name,
      uploadBatchId: batch.id,
      registrationMethod: "bulk-admin",
      adminUploadedBy: batch.uploadedBy,
      adminUploadContext: batch.context,
    })

    // Move to next batch after distributing its records
    if (i % Math.floor(adminUploadCount / completeBatches.length) === 0) {
      batchIndex++
    }
  }

  // Generate firm-uploaded wills
  for (let i = adminUploadCount; i < count; i++) {
    const registeredDate = randomDate(730, 0)
    const updatedDate = new Date(registeredDate.getTime() + randomInt(0, 30) * 24 * 60 * 60 * 1000)
    const willDate = randomDate(1825, 365)
    const dobDate = randomDate(36500, 27375)
    const location = generateAddress()
    const version = randomInt(1, 3)
    const firm = Math.random() > 0.3 ? randomItem(firms) : undefined

    wills.push({
      id: `W${String(i + 1).padStart(6, "0")}`,
      testatorName: generateFullName(),
      dob: formatDate(dobDate),
      address: location.address,
      postcode: location.postcode,
      willLocation: randomItem(["With Solicitor", "At Home", "Bank Safe Deposit", "With Executor", "Probate Registry"]),
      solicitorName: firm?.name || randomItem(users),
      willDate: formatDate(willDate),
      executorName: Math.random() > 0.3 ? generateFullName() : undefined,
      certificateUrl: `/certificates/W${String(i + 1).padStart(6, "0")}.pdf`,
      registeredBy: randomItem(users),
      registeredDate: formatDate(registeredDate),
      updatedAt: formatDateTime(updatedDate),
      updatedBy: randomItem(users),
      version,
      firmId: firm?.id,
      firmName: firm?.name,
      registrationMethod: Math.random() > 0.5 ? "bulk-firm" : "individual",
      uploadBatchId: undefined,
      adminUploadedBy: undefined,
      adminUploadContext: undefined,
    })
  }

  return wills
}

export function generateMockFirms(count: number): SolicitorFirm[] {
  const firms: SolicitorFirm[] = []

  for (let i = 0; i < count; i++) {
    const location = generateAddress()
    const responseRate = randomInt(50, 95)
    const hasContactHistory = Math.random() > 0.7

    firms.push({
      id: `SF${String(i + 1).padStart(3, "0")}`,
      name: `${randomItem(FIRM_PREFIXES)} ${randomItem(FIRM_SUFFIXES)}`,
      address: location.address,
      postcode: location.postcode,
      phone: `0${randomInt(100, 199)} ${randomInt(100, 999)} ${randomInt(1000, 9999)}`,
      email: `contact@firm${i + 1}.co.uk`,
      sraNumber: `SRA${randomInt(100000, 999999)}`,
      practiceAreas: ["Wills & Probate", randomItem(["Estate Planning", "Family Law", "Property Law", "Trust Law"])],
      responseRate,
      lastContact: hasContactHistory ? formatDate(randomDate(30, 0)) : undefined,
      contactHistory: hasContactHistory
        ? [
            {
              date: formatDate(randomDate(30, 0)),
              method: randomItem(["email", "phone"]),
              response: randomItem(["Will found", "No record", "Pending"]),
              notes: "Contact from recent search",
            },
          ]
        : [],
    })
  }

  return firms
}

export function generateMockSearches(count: number, firms: SolicitorFirm[]): SearchRequest[] {
  const searches: SearchRequest[] = []
  const users = ["Sarah Johnson", "David Brown", "Michael Chen", "Emma Wilson"]
  const adminUsers = ["Admin User 1", "Admin User 2", "System"]

  // Distribution targets
  const statusDistribution = {
    received: Math.floor(count * 0.03),
    "payment-confirmed": Math.floor(count * 0.02),
    "db-search-complete": Math.floor(count * 0.02),
    "professional-outreach": Math.floor(count * 0.06),
    "results-compilation": Math.floor(count * 0.02),
    complete: count - Math.floor(count * 0.15), // Rest are complete
  }

  const typeDistribution = {
    basic: Math.floor(count * 0.4),
    advanced: Math.floor(count * 0.5),
    upgraded: count - Math.floor(count * 0.9), // Rest are upgraded
  }

  let searchCounter = 1
  const statuses = Object.entries(statusDistribution).flatMap(([status, count]) => Array(count).fill(status))

  for (let i = 0; i < count; i++) {
    const status = statuses[i] || "complete"
    const isComplete = status === "complete"
    const searchType =
      i < typeDistribution.basic
        ? "basic"
        : i < typeDistribution.basic + typeDistribution.advanced
          ? "advanced"
          : "advanced"
    const isUpgraded = i >= typeDistribution.basic + typeDistribution.advanced

    const requestDate = randomDate(90, 0)
    const deathDate = new Date(requestDate.getTime() - randomInt(5, 30) * 24 * 60 * 60 * 1000)
    const dobDate = randomDate(36500, 27375) // 75-100 years ago

    const location = generateAddress()
    const hasMultipleAddresses = Math.random() > 0.6
    const addresses = hasMultipleAddresses ? [location.address, generateAddress().address] : [location.address]

    const willFound = isComplete ? Math.random() < 0.35 : false
    const price = isUpgraded ? 35 : searchType === "basic" ? 35 : 65
    const upgradedPrice = isUpgraded ? 65 : undefined

    // Generate completion date based on search type
    let completionDate: string | undefined
    if (isComplete) {
      const durationHours = searchType === "basic" ? randomInt(1, 4) : randomInt(24, 120)
      completionDate = formatDateTime(new Date(requestDate.getTime() + durationHours * 60 * 60 * 1000))
    }

    // Generate progress log
    const progressLog = generateProgressLog(status, requestDate, completionDate, searchType, willFound)

    // Generate contact log for advanced searches
    const contactLog: ContactLog[] = []
    const searchNotes: SearchNote[] = []

    if (
      searchType === "advanced" &&
      (status === "professional-outreach" || status === "results-compilation" || isComplete)
    ) {
      const firmCount = randomInt(6, 12)
      for (let j = 0; j < firmCount; j++) {
        const firm = randomItem(firms)
        const contactDate = new Date(requestDate.getTime() + randomInt(24, 96) * 60 * 60 * 1000)
        const hasResponse = Math.random() < 0.8
        const responseDate = hasResponse
          ? new Date(contactDate.getTime() + randomInt(1, 48) * 60 * 60 * 1000)
          : undefined

        contactLog.push({
          firmId: firm.id,
          firmName: firm.name,
          distance: randomInt(1, 15),
          contactDate: formatDateTime(contactDate),
          method: randomItem(["email", "phone", "email+phone"]),
          contactedBy: randomItem(adminUsers.slice(0, 2)),
          response: hasResponse ? randomItem(["no-match", "will-found", "no-response"]) : "no-response",
          responseDate: responseDate ? formatDateTime(responseDate) : undefined,
          notes: hasResponse ? "Checked records" : "No response received",
        })
      }

      // Add search notes
      if (isComplete) {
        searchNotes.push({
          id: `N${searchCounter}-1`,
          timestamp: formatDateTime(new Date(requestDate.getTime() + randomInt(12, 48) * 60 * 60 * 1000)),
          author: randomItem(adminUsers.slice(0, 2)),
          content: "Initial database search completed. No match found. Proceeding with professional outreach.",
          type: "internal",
        })

        if (Math.random() > 0.5) {
          searchNotes.push({
            id: `N${searchCounter}-2`,
            timestamp: formatDateTime(new Date(requestDate.getTime() + randomInt(48, 96) * 60 * 60 * 1000)),
            author: randomItem(adminUsers.slice(0, 2)),
            content: willFound
              ? "Will located at local solicitor firm. Client will be contacted with details."
              : "All firms contacted. No will registration found.",
            type: "client-visible",
          })
        }
      }
    }

    searches.push({
      id: `SR${String(searchCounter).padStart(3, "0")}`,
      deceasedName: generateFullName(),
      dob: formatDate(dobDate),
      deathDate: formatDate(deathDate),
      addresses,
      caseReference: `EST-2024-${String(searchCounter).padStart(3, "0")}`,
      searchType,
      price,
      upgradedPrice,
      upgradedFrom: isUpgraded ? "basic" : undefined,
      status: status as any,
      firmId: "FIRM001",
      requestedBy: randomItem(users),
      requestDate: formatDateTime(requestDate),
      completionDate,
      willFound,
      sourcesFirm: willFound ? (Math.random() > 0.5 ? randomItem(firms).name : "Database Match") : undefined,
      matchedWillId: willFound && Math.random() > 0.5 ? `W${String(randomInt(1, 50)).padStart(3, "0")}` : undefined,
      progressLog,
      contactLog,
      searchNotes,
      assignedTo: searchType === "basic" ? "System" : randomItem(adminUsers),
      priority: randomItem(["low", "medium", "high"]),
      autoProcessed: searchType === "basic",
      reportGenerated: isComplete,
      reportId: isComplete ? `RPT-SR${String(searchCounter).padStart(3, "0")}` : undefined,
    })

    searchCounter++
  }

  return searches
}

function generateProgressLog(
  status: string,
  requestDate: Date,
  completionDate: string | undefined,
  searchType: string,
  willFound: boolean,
): Array<{ status: string; timestamp: string; notes: string }> {
  const log: Array<{ status: string; timestamp: string; notes: string }> = []

  // Received
  log.push({
    status: "received",
    timestamp: formatDateTime(requestDate),
    notes: "Search request received",
  })

  if (status === "received") return log

  // Payment confirmed
  log.push({
    status: "payment-confirmed",
    timestamp: formatDateTime(new Date(requestDate.getTime() + randomInt(5, 15) * 60 * 1000)),
    notes: `Payment of £${searchType === "basic" ? 35 : 65} confirmed`,
  })

  if (status === "payment-confirmed") return log

  // DB search complete
  const dbSearchTime = new Date(requestDate.getTime() + randomInt(30, 120) * 60 * 60 * 1000)
  log.push({
    status: "db-search-complete",
    timestamp: formatDateTime(dbSearchTime),
    notes: willFound && searchType === "basic" ? "Will found in database" : "Database search completed - no match",
  })

  if (status === "db-search-complete" || searchType === "basic") {
    if (searchType === "basic") {
      log.push({
        status: "complete",
        timestamp: formatDateTime(new Date(dbSearchTime.getTime() + randomInt(10, 30) * 60 * 60 * 1000)),
        notes: willFound ? "Will found - report generated" : "No will found - report generated",
      })
    }
    return log
  }

  // Professional outreach (advanced only)
  const outreachTime = new Date(dbSearchTime.getTime() + randomInt(2, 12) * 60 * 60 * 1000)
  log.push({
    status: "professional-outreach",
    timestamp: formatDateTime(outreachTime),
    notes: `Contacted ${randomInt(6, 12)} firms in local area`,
  })

  if (status === "professional-outreach") return log

  // Results compilation
  const compilationTime = new Date(outreachTime.getTime() + randomInt(24, 96) * 60 * 60 * 1000)
  log.push({
    status: "results-compilation",
    timestamp: formatDateTime(compilationTime),
    notes: willFound ? "Will located at solicitor firm" : "All firms responded - no will found",
  })

  if (status === "results-compilation") return log

  // Complete
  if (completionDate) {
    log.push({
      status: "complete",
      timestamp: completionDate,
      notes: willFound ? "Report generated and sent to client" : "Search complete - no will found",
    })
  }

  return log
}

export function generateMockFirmUsers(count: number): FirmUser[] {
  const users: FirmUser[] = []
  const roles: Array<"primary-admin" | "standard" | "view-only"> = [
    "primary-admin",
    "standard",
    "standard",
    "view-only",
  ]

  for (let i = 0; i < count; i++) {
    const name = generateFullName()
    const email = `${name.toLowerCase().replace(" ", ".")}@lawfirm.co.uk`

    users.push({
      id: `U${String(i + 1).padStart(3, "0")}`,
      name,
      email,
      role: roles[i % roles.length],
      status: "active",
    })
  }

  return users
}

export function generateMockUsers(count: number, firms: SolicitorFirm[]): User[] {
  const users: User[] = []
  const firmAccountRatio = 0.6 // 60% firm accounts

  for (let i = 0; i < count; i++) {
    const isFirmAccount = i < count * firmAccountRatio
    const firstName = randomItem(FIRST_NAMES)
    const lastName = randomItem(LAST_NAMES)
    const fullName = `${firstName} ${lastName}`
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${isFirmAccount ? "lawfirm" : "email"}.co.uk`

    const registeredDate = randomDate(180, 0) // Last 6 months
    const lastLoginDate = Math.random() > 0.2 ? randomDate(7, 0) : undefined // 80% logged in recently

    let firm: SolicitorFirm | undefined
    let userRole: UserRole | undefined
    let subscriptionStatus: "trial" | "active" | "expired" | "cancelled" | undefined
    let trialEndsAt: string | undefined

    if (isFirmAccount) {
      firm = randomItem(firms)
      // Distribute roles: 10% primary-admin, 60% standard, 30% view-only
      const roleRand = Math.random()
      userRole = roleRand < 0.1 ? "primary-admin" : roleRand < 0.7 ? "standard" : "view-only"

      // Subscription status
      const statusRand = Math.random()
      if (statusRand < 0.3) {
        subscriptionStatus = "trial"
        const trialDaysRemaining = randomInt(1, 180)
        trialEndsAt = formatDateTime(new Date(Date.now() + trialDaysRemaining * 24 * 60 * 60 * 1000))
      } else if (statusRand < 0.8) {
        subscriptionStatus = "active"
      } else if (statusRand < 0.9) {
        subscriptionStatus = "expired"
      } else {
        subscriptionStatus = "cancelled"
      }
    }

    // Account status
    let status: "active" | "inactive" | "pending-approval" | "trial" | "suspended"
    const statusRand = Math.random()
    if (subscriptionStatus === "trial") {
      status = "trial"
    } else if (statusRand < 0.8) {
      status = "active"
    } else if (statusRand < 0.9) {
      status = "inactive"
    } else if (statusRand < 0.95) {
      status = "pending-approval"
    } else {
      status = "suspended"
    }

    const searchCount = randomInt(0, 50)
    const activeSearchCount = randomInt(0, Math.min(5, searchCount))
    const willCount = randomInt(0, 20)

    users.push({
      id: `USR-${String(i + 1).padStart(6, "0")}`,
      accountType: isFirmAccount ? "firm" : "individual",
      firstName,
      lastName,
      fullName,
      email,
      phone:
        Math.random() > 0.3 ? `0${randomInt(100, 199)} ${randomInt(100, 999)} ${randomInt(1000, 9999)}` : undefined,
      status,
      emailVerified: Math.random() > 0.05, // 95% verified
      emailVerifiedAt: Math.random() > 0.05 ? formatDateTime(registeredDate) : undefined,
      passwordLastChanged: formatDateTime(registeredDate),
      requirePasswordChange: false,
      twoFactorEnabled: Math.random() > 0.8, // 20% have 2FA
      firmId: firm?.id,
      firmName: firm?.name,
      sraNumber: firm?.sraNumber,
      userRole,
      positionInFirm: isFirmAccount ? randomItem(POSITIONS) : undefined,
      subscriptionStatus,
      trialEndsAt,
      subscriptionPlan: isFirmAccount ? "professional" : "individual",
      nextBillingDate:
        subscriptionStatus === "active" ? formatDateTime(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) : undefined,
      registeredAt: formatDateTime(registeredDate),
      lastLoginAt: lastLoginDate ? formatDateTime(lastLoginDate) : undefined,
      searchCount,
      activeSearchCount,
      willCount,
      createdBy: "self-registered",
      adminNotes: [],
      flags: [],
    })
  }

  return users
}

export function generateMockInvitations(count: number, firms: SolicitorFirm[]): UserInvitation[] {
  const invitations: UserInvitation[] = []

  for (let i = 0; i < count; i++) {
    const firm = randomItem(firms)
    const invitedDate = randomDate(7, 0) // Last week
    const expiresDate = new Date(invitedDate.getTime() + 7 * 24 * 60 * 60 * 1000)
    const isExpired = expiresDate < new Date()
    const isAccepted = !isExpired && Math.random() > 0.5

    invitations.push({
      id: `INV-${String(i + 1).padStart(6, "0")}`,
      email: `${randomItem(FIRST_NAMES).toLowerCase()}.${randomItem(LAST_NAMES).toLowerCase()}@email.co.uk`,
      firstName: randomItem(FIRST_NAMES),
      lastName: randomItem(LAST_NAMES),
      role: randomItem(["standard", "view-only"]),
      positionInFirm: randomItem(POSITIONS),
      firmId: firm.id,
      firmName: firm.name,
      invitedBy: "Primary Admin",
      invitedAt: formatDateTime(invitedDate),
      expiresAt: formatDateTime(expiresDate),
      status: isAccepted ? "accepted" : isExpired ? "expired" : "pending",
      token: `tok_${Math.random().toString(36).substring(2, 15)}`,
      welcomeMessage: Math.random() > 0.5 ? "Welcome to our team!" : undefined,
    })
  }

  return invitations
}

export function generateAdminStaffUsers(count: number): User[] {
  const adminUsers: User[] = []

  for (let i = 0; i < count; i++) {
    const firstName = randomItem(FIRST_NAMES)
    const lastName = randomItem(LAST_NAMES)
    const fullName = `${firstName} ${lastName}`
    const registeredDate = randomDate(365, 0)

    adminUsers.push({
      id: `ADMIN${String(i + 1).padStart(6, "0")}`,
      accountType: "firm",
      firstName,
      lastName,
      fullName,
      email: `admin${i + 1}@willreg.com`,
      phone: `0${randomInt(100, 199)} ${randomInt(100, 999)} ${randomInt(1000, 9999)}`,
      status: "active",
      emailVerified: true,
      emailVerifiedAt: formatDateTime(registeredDate),
      passwordLastChanged: formatDateTime(registeredDate),
      requirePasswordChange: false,
      twoFactorEnabled: true,
      userRole: "admin-staff",
      registeredAt: formatDateTime(registeredDate),
      lastLoginAt: formatDateTime(randomDate(7, 0)),
      searchCount: 0,
      activeSearchCount: 0,
      willCount: 0,
      createdBy: "system",
      adminNotes: [],
      flags: [],
      uploadBatchCount: randomInt(2, 10),
      totalWillsUploaded: randomInt(500, 5000),
    })
  }

  return adminUsers
}

export function generateUploadBatches(count: number, firms: SolicitorFirm[], adminUsers: User[]): UploadBatch[] {
  const batches: UploadBatch[] = []
  const contexts: Array<"onboarding" | "regular" | "correction" | "other"> = [
    "onboarding",
    "regular",
    "correction",
    "other",
  ]
  const statuses: Array<"complete" | "in-progress" | "failed"> = ["complete", "in-progress", "failed"]

  // Select subset of firms that have admin uploads (60%)
  const firmsWithUploads = firms.slice(0, Math.floor(firms.length * 0.6))

  for (let i = 0; i < count; i++) {
    const firm = randomItem(firmsWithUploads)
    const adminUser = randomItem(adminUsers)
    const totalRecords = randomInt(50, 5000)

    // Weighted random for status: 80% complete, 15% in-progress, 5% failed
    const statusRand = Math.random()
    const status = statusRand < 0.8 ? "complete" : statusRand < 0.95 ? "in-progress" : "failed"

    // Weighted random for context: 70% onboarding, 20% regular, 8% correction, 2% other
    const contextRand = Math.random()
    const context =
      contextRand < 0.7 ? "onboarding" : contextRand < 0.9 ? "regular" : contextRand < 0.98 ? "correction" : "other"

    const successRate = status === "complete" ? 0.98 : status === "in-progress" ? 0.5 : 0.3
    const successfulRecords = Math.floor(totalRecords * successRate)
    const failedRecords = totalRecords - successfulRecords
    const duplicatesSkipped = Math.floor(totalRecords * 0.005)

    const uploadDate = randomDate(180, 0)

    batches.push({
      id: `BATCH${String(i + 1).padStart(3, "0")}`,
      firmId: firm.id,
      firmName: firm.name,
      uploadedBy: adminUser.id,
      uploadedByName: adminUser.fullName,
      uploadedByEmail: adminUser.email,
      uploadDate: formatDateTime(uploadDate),
      context,
      contextNotes:
        context === "onboarding"
          ? "Initial data migration during firm onboarding"
          : context === "correction"
            ? "Fixing data quality issues from previous upload"
            : "Regular batch upload",
      totalRecords,
      successfulRecords,
      failedRecords,
      duplicatesSkipped,
      processingTime: `${Math.floor(totalRecords / 100)} minutes`,
      status,
      importReport: status === "complete" ? `#report-${i + 1}` : undefined,
    })
  }

  return batches.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
}
