import type {
  WillRegistration,
  SearchRequest,
  SolicitorFirm,
  FirmUser,
  User,
  UserInvitation,
  UploadBatch,
} from "@/types"
import { MOCK_SEARCHES, MOCK_FIRMS, MOCK_FIRM_USERS } from "./mock-data"
import {
  generateMockWills,
  generateMockFirms,
  generateMockSearches,
  generateMockFirmUsers,
  generateMockUsers,
  generateMockInvitations,
  generateAdminStaffUsers,
  generateUploadBatches,
} from "./data-generators"

// Initialize localStorage with mock data if not present
export function initializeStorage() {
  if (typeof window === "undefined") return

  if (!localStorage.getItem("wills") || !localStorage.getItem("uploadBatches")) {
    const firms = generateMockFirms(25)
    const adminStaffUsers = generateAdminStaffUsers(5)
    const uploadBatches = generateUploadBatches(20, firms, adminStaffUsers)
    const wills = generateMockWills(800, firms, uploadBatches)
    const users = generateMockUsers(150, firms)
    const allUsers = [...users, ...adminStaffUsers]

    localStorage.setItem("wills", JSON.stringify(wills))
    localStorage.setItem("uploadBatches", JSON.stringify(uploadBatches))
    localStorage.setItem("users", JSON.stringify(allUsers))
    localStorage.setItem("firms", JSON.stringify(firms))
  }

  if (!localStorage.getItem("searches")) {
    localStorage.setItem("searches", JSON.stringify(MOCK_SEARCHES))
  }
  if (!localStorage.getItem("firmUsers")) {
    localStorage.setItem("firmUsers", JSON.stringify(MOCK_FIRM_USERS))
  }
  if (!localStorage.getItem("users")) {
    const firms = JSON.parse(localStorage.getItem("firms") || "[]")
    const users = generateMockUsers(150, firms.length > 0 ? firms : MOCK_FIRMS)
    localStorage.setItem("users", JSON.stringify(users))
  }
  if (!localStorage.getItem("invitations")) {
    const firms = JSON.parse(localStorage.getItem("firms") || "[]")
    const invitations = generateMockInvitations(5, firms.length > 0 ? firms : MOCK_FIRMS)
    localStorage.setItem("invitations", JSON.stringify(invitations))
  }
}

// Wills
export function getWills(): WillRegistration[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem("wills")
  return data ? JSON.parse(data) : []
}

export function addWill(will: WillRegistration) {
  const wills = getWills()
  wills.push(will)
  localStorage.setItem("wills", JSON.stringify(wills))
}

export function updateWill(updatedWill: WillRegistration) {
  const wills = getWills()
  const index = wills.findIndex((w) => w.id === updatedWill.id)
  if (index !== -1) {
    wills[index] = updatedWill
    localStorage.setItem("wills", JSON.stringify(wills))
  }
}

export function deleteWill(id: string) {
  const wills = getWills()
  const filtered = wills.filter((w) => w.id !== id)
  localStorage.setItem("wills", JSON.stringify(filtered))
}

export function checkDuplicateWill(name: string, dob: string): boolean {
  const wills = getWills()
  return wills.some((w) => w.testatorName.toLowerCase() === name.toLowerCase() && w.dob === dob)
}

// Searches
export function getSearches(): SearchRequest[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem("searches")
  return data ? JSON.parse(data) : []
}

export function getSearchById(id: string): SearchRequest | undefined {
  const searches = getSearches()
  return searches.find((s) => s.id === id)
}

export function addSearch(search: SearchRequest) {
  const searches = getSearches()
  searches.push(search)
  localStorage.setItem("searches", JSON.stringify(searches))
}

export function updateSearch(id: string, updates: Partial<SearchRequest>) {
  const searches = getSearches()
  const index = searches.findIndex((s) => s.id === id)
  if (index !== -1) {
    searches[index] = { ...searches[index], ...updates }
    localStorage.setItem("searches", JSON.stringify(searches))
  }
}

export function startSearchProcessing(searchId: string) {
  const searches = getSearches()
  const index = searches.findIndex((s) => s.id === searchId)
  if (index !== -1) {
    searches[index].processingStarted = new Date().toISOString()
    searches[index].autoProcessed = true
    localStorage.setItem("searches", JSON.stringify(searches))
  }
}

export function completeSearchProcessing(
  searchId: string,
  willFound: boolean,
  matchedWillId?: string,
  sourcesFirm?: string,
) {
  const searches = getSearches()
  const index = searches.findIndex((s) => s.id === searchId)
  if (index !== -1) {
    searches[index].processingCompleted = new Date().toISOString()
    searches[index].completionDate = new Date().toISOString()
    searches[index].status = "complete"
    searches[index].willFound = willFound
    searches[index].matchedWillId = matchedWillId
    searches[index].sourcesFirm = sourcesFirm
    searches[index].reportGenerated = true
    searches[index].reportId = `RPT-${Date.now()}`
    searches[index].progressLog.push({
      status: "complete",
      timestamp: new Date().toISOString(),
      notes: willFound ? "Will registration found" : "No will registration found",
    })
    localStorage.setItem("searches", JSON.stringify(searches))
  }
}

// Firms
export function getFirms(): SolicitorFirm[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem("firms")
  return data ? JSON.parse(data) : []
}

export function getFirmById(id: string): SolicitorFirm | undefined {
  const firms = getFirms()
  return firms.find((f) => f.id === id)
}

export function addFirm(firm: SolicitorFirm) {
  const firms = getFirms()
  firms.push(firm)
  localStorage.setItem("firms", JSON.stringify(firms))
}

export function updateFirm(id: string, updates: Partial<SolicitorFirm>) {
  const firms = getFirms()
  const index = firms.findIndex((f) => f.id === id)
  if (index !== -1) {
    firms[index] = { ...firms[index], ...updates }
    localStorage.setItem("firms", JSON.stringify(firms))
  }
}

// Firm Users
export function getFirmUsers(): FirmUser[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem("firmUsers")
  return data ? JSON.parse(data) : []
}

export function addFirmUser(user: FirmUser) {
  const users = getFirmUsers()
  users.push(user)
  localStorage.setItem("firmUsers", JSON.stringify(users))
}

export function updateFirmUser(id: string, updates: Partial<FirmUser>) {
  const users = getFirmUsers()
  const index = users.findIndex((u) => u.id === id)
  if (index !== -1) {
    users[index] = { ...users[index], ...updates }
    localStorage.setItem("firmUsers", JSON.stringify(users))
  }
}

export function deleteUser(id: string) {
  const users = getUsers()
  const filtered = users.filter((u) => u.id !== id)
  localStorage.setItem("users", JSON.stringify(filtered))
}

// Users
export function getUsers(): User[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem("users")
  return data ? JSON.parse(data) : []
}

export function getUserById(id: string): User | undefined {
  const users = getUsers()
  return users.find((u) => u.id === id)
}

export function addUser(user: User) {
  const users = getUsers()
  users.push(user)
  localStorage.setItem("users", JSON.stringify(users))
}

export function updateUser(id: string, updates: Partial<User>) {
  const users = getUsers()
  const index = users.findIndex((u) => u.id === id)
  if (index !== -1) {
    users[index] = { ...users[index], ...updates }
    localStorage.setItem("users", JSON.stringify(users))
  }
}

// Invitations
export function getInvitations(): UserInvitation[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem("invitations")
  return data ? JSON.parse(data) : []
}

export function addInvitation(invitation: UserInvitation) {
  const invitations = getInvitations()
  invitations.push(invitation)
  localStorage.setItem("invitations", JSON.stringify(invitations))
}

export function updateInvitation(id: string, updates: Partial<UserInvitation>) {
  const invitations = getInvitations()
  const index = invitations.findIndex((i) => i.id === id)
  if (index !== -1) {
    invitations[index] = { ...invitations[index], ...updates }
    localStorage.setItem("invitations", JSON.stringify(invitations))
  }
}

// Upload Batches
export function getUploadBatches(): UploadBatch[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem("uploadBatches")
  return data ? JSON.parse(data) : []
}

export function getUploadBatchById(id: string): UploadBatch | undefined {
  const batches = getUploadBatches()
  return batches.find((b) => b.id === id)
}

export function addUploadBatch(batch: UploadBatch) {
  const batches = getUploadBatches()
  batches.push(batch)
  localStorage.setItem("uploadBatches", JSON.stringify(batches))
}

export function updateUploadBatch(id: string, updates: Partial<UploadBatch>) {
  const batches = getUploadBatches()
  const index = batches.findIndex((b) => b.id === id)
  if (index !== -1) {
    batches[index] = { ...batches[index], ...updates }
    localStorage.setItem("uploadBatches", JSON.stringify(batches))
  }
}

// Reset Environment
export function resetEnvironment() {
  if (typeof window === "undefined") return

  // Generate fresh data
  const firms = generateMockFirms(25)
  const adminStaffUsers = generateAdminStaffUsers(5)
  const uploadBatches = generateUploadBatches(20, firms, adminStaffUsers)
  const wills = generateMockWills(800, firms, uploadBatches)
  const searches = generateMockSearches(100, firms)
  const firmUsers = generateMockFirmUsers(15)
  const users = generateMockUsers(150, firms)
  const invitations = generateMockInvitations(5, firms)

  // Combine regular users with admin staff
  const allUsers = [...users, ...adminStaffUsers]

  // Clear and set new data
  localStorage.setItem("wills", JSON.stringify(wills))
  localStorage.setItem("searches", JSON.stringify(searches))
  localStorage.setItem("firms", JSON.stringify(firms))
  localStorage.setItem("firmUsers", JSON.stringify(firmUsers))
  localStorage.setItem("users", JSON.stringify(allUsers))
  localStorage.setItem("invitations", JSON.stringify(invitations))
  localStorage.setItem("uploadBatches", JSON.stringify(uploadBatches))

  return { wills, searches, firms, users: firmUsers, allUsers, invitations, uploadBatches }
}
