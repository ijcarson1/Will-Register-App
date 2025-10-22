"use client"

import { useState, useMemo } from "react"
import type { User, UserRole } from "@/types"
import { getUsers, updateUser, deleteUser } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  Users,
  Building2,
  Download,
  Bell,
  Search,
  X,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Key,
  Ban,
  CheckCircle,
  TrendingUp,
  AlertCircle,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format, parseISO } from "date-fns"

export function UserManagementPage() {
  const [users, setUsers] = useState<User[]>(() => {
    const storedUsers = getUsers()
    // If no users in storage, this means reset hasn't been run yet
    // Show empty state with helpful message
    return storedUsers
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDetail, setShowUserDetail] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const { toast } = useToast()

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchQuery === "" ||
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.firmName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.sraNumber?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesAccountType = accountTypeFilter === "all" || user.accountType === accountTypeFilter
      const matchesStatus = statusFilter === "all" || user.status === statusFilter
      const matchesRole = roleFilter === "all" || user.userRole === roleFilter

      return matchesSearch && matchesAccountType && matchesStatus && matchesRole
    })
  }, [users, searchQuery, accountTypeFilter, statusFilter, roleFilter])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalUsers = users.length
    const firmUsers = users.filter((u) => u.accountType === "firm").length
    const individualUsers = users.filter((u) => u.accountType === "individual").length
    const activeFirms = new Set(users.filter((u) => u.accountType === "firm" && u.firmId).map((u) => u.firmId)).size
    const trialFirms = users.filter((u) => u.subscriptionStatus === "trial").length
    const paidFirms = users.filter((u) => u.subscriptionStatus === "active").length
    const newThisWeek = users.filter((u) => {
      const registered = parseISO(u.registeredAt)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return registered > weekAgo
    }).length
    const pendingApprovals = users.filter((u) => u.status === "pending-approval").length
    const expiredTrials = users.filter((u) => u.subscriptionStatus === "expired").length

    return {
      totalUsers,
      firmUsers,
      individualUsers,
      activeFirms,
      trialFirms,
      paidFirms,
      newThisWeek,
      pendingApprovals,
      expiredTrials,
    }
  }, [users])

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setShowUserDetail(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleResetPassword = (user: User) => {
    setSelectedUser(user)
    setShowResetPasswordModal(true)
  }

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  const handleSuspendUser = (user: User) => {
    const newStatus = user.status === "suspended" ? "active" : "suspended"
    updateUser(user.id, { status: newStatus })
    setUsers(getUsers())
    toast({
      title: newStatus === "suspended" ? "User Suspended" : "User Activated",
      description: `${user.fullName} has been ${newStatus === "suspended" ? "suspended" : "activated"}.`,
    })
  }

  const confirmDelete = () => {
    if (selectedUser) {
      deleteUser(selectedUser.id)
      setUsers(getUsers())
      setShowDeleteModal(false)
      toast({
        title: "User Deleted",
        description: `${selectedUser.fullName} has been removed from the system.`,
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      active: { variant: "default", label: "Active" },
      trial: { variant: "secondary", label: "Trial" },
      inactive: { variant: "outline", label: "Inactive" },
      "pending-approval": { variant: "secondary", label: "Pending" },
      suspended: { variant: "destructive", label: "Suspended" },
    }
    const config = variants[status] || variants.active
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getRoleBadge = (role?: UserRole) => {
    if (!role) return null
    const labels: Record<UserRole, string> = {
      "primary-admin": "Primary Admin",
      standard: "Standard",
      "view-only": "View Only",
      "admin-staff": "Admin Staff",
    }
    return <Badge variant="outline">{labels[role]}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage all registered users and firms</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Users
          </Button>
          <Button variant="outline">
            <Bell className="mr-2 h-4 w-4" />
            Pending Approvals
            {stats.pendingApprovals > 0 && (
              <Badge className="ml-2" variant="destructive">
                {stats.pendingApprovals}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
              <p className="text-xs text-muted-foreground mt-1">+{stats.newThisWeek} this week</p>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.firmUsers} Firm, {stats.individualUsers} Individual
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Firms</p>
              <p className="text-2xl font-bold">{stats.activeFirms}</p>
              <p className="text-xs text-muted-foreground mt-1">Trial: {stats.trialFirms}</p>
            </div>
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Paid: {stats.paidFirms} firms</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">New This Week</p>
              <p className="text-2xl font-bold">{stats.newThisWeek}</p>
              <p className="text-xs text-muted-foreground mt-1">Users</p>
            </div>
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Actions</p>
              <p className="text-2xl font-bold">{stats.pendingApprovals + stats.expiredTrials}</p>
              <p className="text-xs text-muted-foreground mt-1">Approvals: {stats.pendingApprovals}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Expired trials: {stats.expiredTrials}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, firm, or SRA number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label>Account Type</Label>
              <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="firm">Firm Account</SelectItem>
                  <SelectItem value="individual">Individual Account</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Account Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending-approval">Pending Approval</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="primary-admin">Primary Admin</SelectItem>
                  <SelectItem value="standard">Standard User</SelectItem>
                  <SelectItem value="view-only">View Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setAccountTypeFilter("all")
                  setStatusFilter("all")
                  setRoleFilter("all")
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Name</TableHead>
              <TableHead>Firm</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Account Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Searches</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewUser(user)}>
                <TableCell>
                  <div>
                    <div className="font-medium">{user.fullName}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {user.firmName ? (
                    <div className="text-sm">{user.firmName}</div>
                  ) : (
                    <Badge variant="outline">Individual</Badge>
                  )}
                </TableCell>
                <TableCell>{getRoleBadge(user.userRole)}</TableCell>
                <TableCell>
                  <Badge variant={user.accountType === "firm" ? "default" : "secondary"}>
                    {user.accountType === "firm" ? "Firm" : "Individual"}
                  </Badge>
                </TableCell>
                <TableCell>{getStatusBadge(user.status)}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{user.searchCount} searches</div>
                    {user.activeSearchCount > 0 && (
                      <div className="text-muted-foreground">{user.activeSearchCount} active</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {user.lastLoginAt ? format(parseISO(user.lastLoginAt), "dd MMM yyyy") : "Never"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{format(parseISO(user.registeredAt), "dd MMM yyyy")}</div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewUser(user)
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditUser(user)
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit User
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleResetPassword(user)
                        }}
                      >
                        <Key className="mr-2 h-4 w-4" />
                        Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSuspendUser(user)
                        }}
                      >
                        {user.status === "suspended" ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Activate User
                          </>
                        ) : (
                          <>
                            <Ban className="mr-2 h-4 w-4" />
                            Suspend User
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteUser(user)
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* User Detail Modal */}
      {selectedUser && (
        <Dialog open={showUserDetail} onOpenChange={setShowUserDetail}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedUser.fullName}</DialogTitle>
              <div className="flex gap-2 mt-2">
                {getStatusBadge(selectedUser.status)}
                {getRoleBadge(selectedUser.userRole)}
              </div>
            </DialogHeader>

            <Tabs defaultValue="overview" className="mt-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">Personal Information</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Full Name:</span> {selectedUser.fullName}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span> {selectedUser.email}
                      </div>
                      {selectedUser.phone && (
                        <div>
                          <span className="text-muted-foreground">Phone:</span> {selectedUser.phone}
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">Account Information</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Account Type:</span>{" "}
                        {selectedUser.accountType === "firm" ? "Firm" : "Individual"}
                      </div>
                      <div>
                        <span className="text-muted-foreground">User ID:</span> {selectedUser.id}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span> {getStatusBadge(selectedUser.status)}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Registered:</span>{" "}
                        {format(parseISO(selectedUser.registeredAt), "dd MMM yyyy")}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Login:</span>{" "}
                        {selectedUser.lastLoginAt
                          ? format(parseISO(selectedUser.lastLoginAt), "dd MMM yyyy HH:mm")
                          : "Never"}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email Verified:</span>{" "}
                        {selectedUser.emailVerified ? "Yes" : "No"}
                      </div>
                    </div>
                  </Card>

                  {selectedUser.firmName && (
                    <Card className="p-4">
                      <h3 className="font-semibold mb-3">Firm Information</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Firm Name:</span> {selectedUser.firmName}
                        </div>
                        {selectedUser.sraNumber && (
                          <div>
                            <span className="text-muted-foreground">SRA Number:</span> {selectedUser.sraNumber}
                          </div>
                        )}
                        {selectedUser.positionInFirm && (
                          <div>
                            <span className="text-muted-foreground">Position:</span> {selectedUser.positionInFirm}
                          </div>
                        )}
                      </div>
                    </Card>
                  )}

                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">Activity Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Searches:</span> {selectedUser.searchCount}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Active Searches:</span> {selectedUser.activeSearchCount}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Wills Registered:</span> {selectedUser.willCount}
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="activity">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Recent Activity</h3>
                  <p className="text-sm text-muted-foreground">
                    Activity log would be displayed here showing user actions, logins, and changes.
                  </p>
                </Card>
              </TabsContent>

              <TabsContent value="permissions">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Role & Permissions</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Current Role</Label>
                      <div className="mt-2">{getRoleBadge(selectedUser.userRole)}</div>
                    </div>
                    <div>
                      <Label>Permissions</Label>
                      <div className="mt-2 space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Register Wills
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Request Searches
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          View Search Results
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowUserDetail(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowUserDetail(false)
                  handleEditUser(selectedUser)
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Reset Password Modal */}
      {selectedUser && (
        <Dialog open={showResetPasswordModal} onOpenChange={setShowResetPasswordModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password for {selectedUser.fullName}</DialogTitle>
              <DialogDescription>Choose how to reset the user's password</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Card className="p-4">
                <h4 className="font-medium mb-2">Send Reset Link</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  User will receive an email with a password reset link
                </p>
                <Button
                  onClick={() => {
                    toast({
                      title: "Reset Link Sent",
                      description: `Password reset link sent to ${selectedUser.email}`,
                    })
                    setShowResetPasswordModal(false)
                  }}
                >
                  Send Reset Link
                </Button>
              </Card>

              <Card className="p-4">
                <h4 className="font-medium mb-2">Generate Temporary Password</h4>
                <p className="text-sm text-muted-foreground mb-4">Generate a temporary password and provide to user</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    const tempPassword = Math.random().toString(36).slice(-8)
                    toast({
                      title: "Temporary Password Generated",
                      description: `Temporary password: ${tempPassword}`,
                    })
                    setShowResetPasswordModal(false)
                  }}
                >
                  Generate Password
                </Button>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      {selectedUser && (
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <div className="text-muted-foreground text-sm">
                Are you sure you want to delete {selectedUser.fullName}? This action cannot be undone.
              </div>
            </DialogHeader>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
