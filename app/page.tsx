"use client"

import { useState, useEffect } from "react"
import type { User, UserRole } from "@/types"
import { initializeStorage } from "@/lib/storage"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"

// Import all page components
import { LoginPage } from "@/components/pages/login"
import { DashboardPage } from "@/components/pages/dashboard"
import { RegisterWillPage } from "@/components/pages/register-will"
import { BulkUploadPage } from "@/components/pages/bulk-upload"
import { SearchRequestPage } from "@/components/pages/search-request"
import { ViewSearchesPage } from "@/components/pages/view-searches"
import { SearchDetailPage } from "@/components/pages/search-detail"
import { ManageUsersPage } from "@/components/pages/manage-users"
import { BillingPage } from "@/components/pages/billing"
import { AdminDashboardPage } from "@/components/pages/admin-dashboard"
import { SearchQueuePage } from "@/components/pages/search-queue"
import { ProcessSearchPage } from "@/components/pages/process-search"
import { FirmDatabasePage } from "@/components/pages/firm-database"
import { FirmDetailPage } from "@/components/pages/firm-detail"
import { ManageWillsPage } from "@/components/pages/manage-wills"
import { UserManagementPage } from "@/components/pages/user-management"
import { JobsPage } from "@/components/pages/jobs"
import { FirmSelectionPage } from "@/components/pages/firm-selection"
import { ViewWillsPage } from "@/components/pages/view-wills"

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentPage, setCurrentPage] = useState<string>("login")
  const [selectedSearchId, setSelectedSearchId] = useState<string | null>(null)
  const [selectedFirmId, setSelectedFirmId] = useState<string | null>(null)
  const [selectedFirmForUpload, setSelectedFirmForUpload] = useState<{
    id: string
    name: string
    sraNumber: string
  } | null>(null)
  const [uploadContext, setUploadContext] = useState<string>("")
  const [uploadNotes, setUploadNotes] = useState<string>("")
  const [showFirmSelection, setShowFirmSelection] = useState(false)

  useEffect(() => {
    initializeStorage()

    if (currentUser?.userRole === "admin-staff") {
      const saved = sessionStorage.getItem("admin_selected_firm")
      if (saved) {
        try {
          const { firm, context, notes } = JSON.parse(saved)
          setSelectedFirmForUpload(firm)
          setUploadContext(context)
          setUploadNotes(notes)
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }, [currentUser])

  const handleRoleSelect = (role: UserRole) => {
    const user: User = {
      firmId: "FIRM001",
      firmName: "Smith & Partners Solicitors",
      sraNumber: "SRA123456",
      userRole: role,
      userName: role === "admin-staff" ? "Admin User" : "Sarah Johnson",
      email: role === "admin-staff" ? "admin@willreg.co.uk" : "sarah.johnson@lawfirm.co.uk",
    }
    setCurrentUser(user)
    setCurrentPage(role === "admin-staff" ? "admin-dashboard" : "dashboard")
  }

  const handleRoleChange = (role: UserRole) => {
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        userRole: role,
        userName: role === "admin-staff" ? "Admin User" : currentUser.userName,
        email: role === "admin-staff" ? "admin@willreg.co.uk" : currentUser.email,
      })
      setCurrentPage(role === "admin-staff" ? "admin-dashboard" : "dashboard")
    }
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setCurrentPage("login")
    setSelectedSearchId(null)
    setSelectedFirmId(null)
    setSelectedFirmForUpload(null)
    setUploadContext("")
    setUploadNotes("")
    sessionStorage.removeItem("admin_selected_firm")
  }

  const handleNavigate = (page: string, data?: any) => {
    console.log("[v0] Navigate to:", page, "Current user role:", currentUser?.userRole)
    console.log("[v0] Selected firm for upload:", selectedFirmForUpload)

    if (page === "register-will" && currentUser?.userRole === "admin-staff") {
      if (!selectedFirmForUpload) {
        console.log("[v0] No firm selected, showing firm selection")
        setShowFirmSelection(true)
        setCurrentPage("register-will")
        return
      } else {
        console.log("[v0] Firm already selected, going to register-will")
        setShowFirmSelection(false)
      }
    }

    setCurrentPage(page)
    if (data?.searchId) {
      setSelectedSearchId(data.searchId)
    }
    if (data?.firmId) {
      setSelectedFirmId(data.firmId)
    }
  }

  const handleFirmSelected = (firm: any, context: string, notes: string) => {
    console.log("[v0] Firm selected:", firm)
    setSelectedFirmForUpload(firm)
    setUploadContext(context)
    setUploadNotes(notes)
    setShowFirmSelection(false)

    // Save to session storage
    sessionStorage.setItem("admin_selected_firm", JSON.stringify({ firm, context, notes }))

    // Navigate to register will page
    setCurrentPage("register-will")
  }

  const handleChangeFirm = () => {
    console.log("[v0] Changing firm")
    setSelectedFirmForUpload(null)
    setUploadContext("")
    setUploadNotes("")
    sessionStorage.removeItem("admin_selected_firm")
    setShowFirmSelection(true)
  }

  if (!currentUser) {
    return <LoginPage onRoleSelect={handleRoleSelect} />
  }

  return (
    <div className="flex h-screen">
      <Sidebar currentUser={currentUser} currentPage={currentPage} onNavigate={handleNavigate} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          currentUser={currentUser}
          onRoleChange={handleRoleChange}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {currentPage === "dashboard" && <DashboardPage currentUser={currentUser} onNavigate={handleNavigate} />}
          {currentPage === "register-will" && (
            <>
              {currentUser.userRole === "admin-staff" && showFirmSelection ? (
                <FirmSelectionPage
                  currentUser={currentUser}
                  onFirmSelected={handleFirmSelected}
                  onCancel={() => {
                    setShowFirmSelection(false)
                    setCurrentPage("admin-dashboard")
                  }}
                />
              ) : (
                <RegisterWillPage
                  currentUser={currentUser}
                  onNavigate={handleNavigate}
                  selectedFirmForUpload={selectedFirmForUpload}
                  uploadContext={uploadContext}
                  uploadNotes={uploadNotes}
                  onChangeFirm={handleChangeFirm}
                />
              )}
            </>
          )}
          {currentPage === "bulk-upload" && <BulkUploadPage currentUser={currentUser} onNavigate={handleNavigate} />}
          {currentPage === "search-request" && (
            <SearchRequestPage currentUser={currentUser} onNavigate={handleNavigate} />
          )}
          {currentPage === "view-searches" && (
            <ViewSearchesPage currentUser={currentUser} onNavigate={handleNavigate} />
          )}
          {currentPage === "search-detail" && selectedSearchId && (
            <SearchDetailPage searchId={selectedSearchId} currentUser={currentUser} onNavigate={handleNavigate} />
          )}
          {currentPage === "manage-wills" && <ManageWillsPage currentUser={currentUser} onNavigate={handleNavigate} />}
          {currentPage === "view-wills" && <ViewWillsPage currentUser={currentUser} onNavigate={handleNavigate} />}
          {currentPage === "manage-users" && <ManageUsersPage currentUser={currentUser} />}
          {currentPage === "billing" && <BillingPage currentUser={currentUser} />}
          {currentPage === "admin-dashboard" && (
            <AdminDashboardPage currentUser={currentUser} onNavigate={handleNavigate} />
          )}
          {currentPage === "search-queue" && <SearchQueuePage currentUser={currentUser} onNavigate={handleNavigate} />}
          {currentPage === "process-search" && selectedSearchId && (
            <ProcessSearchPage searchId={selectedSearchId} currentUser={currentUser} onNavigate={handleNavigate} />
          )}
          {currentPage === "firm-database" && (
            <FirmDatabasePage currentUser={currentUser} onNavigate={handleNavigate} />
          )}
          {currentPage === "firm-detail" && selectedFirmId && (
            <FirmDetailPage firmId={selectedFirmId} onNavigate={handleNavigate} />
          )}
          {currentPage === "user-management" && <UserManagementPage />}
          {currentPage === "jobs" && <JobsPage currentUser={currentUser} onNavigate={handleNavigate} />}
        </main>
      </div>
    </div>
  )
}
