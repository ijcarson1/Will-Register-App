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
  "primary-admin": "Primary Admin",
  standard: "Standard User",
  "view-only": "View Only",
  "admin-staff": "Admin Staff",
}

export function RoleSwitcher({ currentUser, onRoleChange }: RoleSwitcherProps) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary">{roleLabels[currentUser.userRole]}</Badge>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Switch Role <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onRoleChange("primary-admin")}>Primary Admin</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onRoleChange("standard")}>Standard User</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onRoleChange("view-only")}>View Only</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onRoleChange("admin-staff")}>Admin Staff</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
