"use client"

import type { User } from "@/types"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ChevronDown } from "lucide-react"

interface RoleSwitcherProps {
  currentUser: User
  onRoleChange: (role: User["userRole"]) => void
}

const roleLabels = {
  admin: "Admin",
  firm: "Firm User",
  individual: "Individual",
}

export function RoleSwitcher({ currentUser, onRoleChange }: RoleSwitcherProps) {
  const getRoleDisplay = () => {
    if (currentUser.userRole === "firm" && currentUser.isPrimaryAdmin) {
      return (
        <div className="flex items-center gap-1">
          <span>{roleLabels[currentUser.userRole]}</span>
          <Badge variant="default" className="text-xs">
            Primary Admin
          </Badge>
        </div>
      )
    }
    return roleLabels[currentUser.userRole]
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary">{getRoleDisplay()}</Badge>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Switch Role <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onRoleChange("admin")}>Admin</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onRoleChange("firm")}>Firm User (Standard)</DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              // Set isPrimaryAdmin flag when switching to firm primary admin
              onRoleChange("firm")
            }}
          >
            Firm User (Primary Admin)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onRoleChange("individual")}>Individual</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
