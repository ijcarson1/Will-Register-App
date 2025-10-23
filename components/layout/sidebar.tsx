"use client"

import type { User } from "@/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  FileText,
  Search,
  List,
  Users,
  CreditCard,
  Database,
  ClipboardList,
  FolderOpen,
  UserCog,
  Briefcase,
} from "lucide-react"

interface SidebarProps {
  currentUser: User
  currentPage: string
  onNavigate: (page: string) => void
}

export function Sidebar({ currentUser, currentPage, onNavigate }: SidebarProps) {
  const { userRole } = currentUser

  const navItems = []

  if (userRole === "admin") {
    // Admin navigation (unchanged from admin-staff)
    navItems.push(
      { id: "admin-dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "search-queue", label: "Search Queue", icon: ClipboardList },
      { id: "firm-database", label: "Firm Database", icon: Database },
      { id: "user-management", label: "User Management", icon: UserCog },
      { id: "register-will", label: "Register Will", icon: FileText },
      { id: "view-wills", label: "View Wills", icon: FolderOpen },
    )
  } else if (userRole === "firm") {
    // Firm user navigation (consolidated from primary-admin, standard, view-only)
    navItems.push(
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "register-will", label: "Register Will", icon: FileText },
      { id: "search-request", label: "Search", icon: Search },
      { id: "view-searches", label: "View Searches", icon: List },
      { id: "manage-wills", label: "Manage Wills", icon: FolderOpen },
      { id: "jobs", label: "Jobs", icon: Briefcase },
    )

    // Add management options for primary admins
    if (currentUser.isPrimaryAdmin) {
      navItems.push(
        { id: "manage-users", label: "Manage Users", icon: Users },
        { id: "billing", label: "Billing", icon: CreditCard },
      )
    }
  } else if (userRole === "individual") {
    // Individual user navigation (minimal)
    navItems.push(
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "view-searches", label: "View Searches", icon: List },
    )
  }

  return (
    <div className="w-64 border-r bg-muted/40 p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">WillReg</h2>
        {userRole === "firm" && <p className="text-sm text-muted-foreground">{currentUser.firmName}</p>}
      </div>
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant={currentPage === item.id ? "secondary" : "ghost"}
              className={cn("w-full justify-start", currentPage === item.id && "bg-secondary")}
              onClick={() => onNavigate(item.id)}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          )
        })}
      </nav>
    </div>
  )
}
