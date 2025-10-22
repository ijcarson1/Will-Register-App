"use client"

import { useState, useEffect } from "react"
import type { User, UserRole, UserInvitation } from "@/types"
import { getUsers, updateUser, addInvitation, getInvitations, updateInvitation } from "@/lib/storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { UserPlus, MoreVertical, Edit, Trash2, Key, Ban, CheckCircle, Mail, X } from "lucide-react"

interface ManageUsersPageProps {
  currentUser: User
}

export function ManageUsersPage({ currentUser }: ManageUsersPageProps) {
  const { toast } = useToast()

  const [firmUsers, setFirmUsers] = useState<User[]>([])
  const [pendingInvites, setPendingInvites] = useState<UserInvitation[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [showSuspendModal, setShowSuspendModal] = useState(false)

  // Form states
  const [inviteForm, setInviteForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "standard" as UserRole,
    positionInFirm: "",
    welcomeMessage: "",
  })

  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    positionInFirm: "",
    userRole: "standard" as UserRole,
  })

  const [removeConfirmation, setRemoveConfirmation] = useState("")
  const [resetMethod, setResetMethod] = useState<"link" | "temp">("link")
  const [tempPassword, setTempPassword] = useState("")
  const [suspendReason, setSuspendReason] = useState("")
  const [notifyUser, setNotifyUser] = useState(true)

  useEffect(() => {
    loadFirmData()
  }, [currentUser.firmId])

  const loadFirmData = () => {
    const allUsers = getUsers()
    const filtered = allUsers.filter((u) => u.firmId === currentUser.firmId)
    setFirmUsers(filtered)

    const allInvites = getInvitations()
    const firmInvites = allInvites.filter((i) => i.firmId === currentUser.firmId && i.status === "pending")
    setPendingInvites(firmInvites)
  }

  const handleInviteUser = () => {
    // Validate
    if (!inviteForm.firstName || !inviteForm.lastName || !inviteForm.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Check if email already exists
    const allUsers = getUsers()
    const emailExists = allUsers.some((u) => u.email.toLowerCase() === inviteForm.email.toLowerCase())
    if (emailExists) {
      toast({
        title: "Email Already Exists",
        description: "A user with this email address already exists in the system",
        variant: "destructive",
      })
      return
    }

    // Check if already invited
    const inviteExists = pendingInvites.some((i) => i.email.toLowerCase() === inviteForm.email.toLowerCase())
    if (inviteExists) {
      toast({
        title: "Already Invited",
        description: "An invitation has already been sent to this email address",
        variant: "destructive",
      })
      return
    }

    // Create invitation
    const invitation: UserInvitation = {
      id: `INV-${Date.now()}`,
      email: inviteForm.email,
      firstName: inviteForm.firstName,
      lastName: inviteForm.lastName,
      role: inviteForm.role,
      positionInFirm: inviteForm.positionInFirm || undefined,
      firmId: currentUser.firmId!,
      firmName: currentUser.firmName!,
      invitedBy: currentUser.fullName,
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "pending",
      token: `tok_${Math.random().toString(36).substring(2, 15)}`,
      welcomeMessage: inviteForm.welcomeMessage || undefined,
    }

    addInvitation(invitation)
    loadFirmData()
    setShowInviteModal(false)
    setInviteForm({
      firstName: "",
      lastName: "",
      email: "",
      role: "standard",
      positionInFirm: "",
      welcomeMessage: "",
    })

    toast({
      title: "Invitation Sent",
      description: `Invitation sent to ${inviteForm.email}`,
    })
  }

  const handleEditUser = () => {
    if (!selectedUser) return

    // Validate
    if (!editForm.firstName || !editForm.lastName || !editForm.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Check if changing to primary admin
    const changingToPrimaryAdmin = editForm.userRole === "primary-admin" && selectedUser.userRole !== "primary-admin"

    if (changingToPrimaryAdmin) {
      const confirmed = window.confirm(
        "⚠️ Primary Admins have full access to:\n• Manage all users\n• Access billing and payments\n• Modify firm settings\n• All other permissions\n\nContinue?",
      )
      if (!confirmed) return
    }

    // Update user
    updateUser(selectedUser.id, {
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      fullName: `${editForm.firstName} ${editForm.lastName}`,
      email: editForm.email,
      phone: editForm.phone || undefined,
      positionInFirm: editForm.positionInFirm || undefined,
      userRole: editForm.userRole,
    })

    loadFirmData()
    setShowEditModal(false)
    toast({
      title: "User Updated",
      description: `${editForm.firstName} ${editForm.lastName} has been updated successfully`,
    })
  }

  const handleRemoveUser = () => {
    if (!selectedUser) return

    // Validate confirmation
    if (removeConfirmation.toLowerCase() !== selectedUser.lastName.toLowerCase()) {
      toast({
        title: "Confirmation Failed",
        description: "Please type the user's last name correctly to confirm",
        variant: "destructive",
      })
      return
    }

    // Check if removing self
    if (selectedUser.id === currentUser.id) {
      toast({
        title: "Cannot Remove Self",
        description: "You cannot remove yourself from the firm",
        variant: "destructive",
      })
      return
    }

    // Check if removing last primary admin
    const primaryAdmins = firmUsers.filter((u) => u.userRole === "primary-admin")
    if (primaryAdmins.length === 1 && selectedUser.userRole === "primary-admin") {
      toast({
        title: "Cannot Remove Last Admin",
        description: "Cannot remove the last Primary Admin. Promote another user first.",
        variant: "destructive",
      })
      return
    }

    // Remove from firm (convert to individual account)
    updateUser(selectedUser.id, {
      firmId: undefined,
      firmName: undefined,
      userRole: undefined,
      accountType: "individual",
      positionInFirm: undefined,
      subscriptionStatus: undefined,
    })

    loadFirmData()
    setShowRemoveModal(false)
    setRemoveConfirmation("")
    toast({
      title: "User Removed",
      description: `${selectedUser.fullName} has been removed from the firm`,
    })
  }

  const handleResetPassword = () => {
    if (!selectedUser) return

    if (resetMethod === "link") {
      // Send reset link
      toast({
        title: "Password Reset Link Sent",
        description: `An email has been sent to ${selectedUser.email} with a password reset link`,
      })
      setShowResetPasswordModal(false)
    } else {
      // Generate temporary password
      const password = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-2).toUpperCase()
      setTempPassword(password)

      updateUser(selectedUser.id, {
        requirePasswordChange: true,
      })
    }
  }

  const handleToggleSuspend = () => {
    if (!selectedUser) return

    const newStatus = selectedUser.status === "suspended" ? "active" : "suspended"

    updateUser(selectedUser.id, {
      status: newStatus,
    })

    loadFirmData()
    setShowSuspendModal(false)
    setSuspendReason("")
    toast({
      title: newStatus === "suspended" ? "User Suspended" : "User Activated",
      description: `${selectedUser.fullName} has been ${newStatus === "suspended" ? "suspended" : "activated"}`,
    })
  }

  const handleResendInvite = (invite: UserInvitation) => {
    updateInvitation(invite.id, {
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })

    loadFirmData()
    toast({
      title: "Invitation Resent",
      description: `Invitation resent to ${invite.email}`,
    })
  }

  const handleCancelInvite = (invite: UserInvitation) => {
    const confirmed = window.confirm(`Cancel invitation for ${invite.email}?`)
    if (!confirmed) return

    updateInvitation(invite.id, {
      status: "cancelled",
    })

    loadFirmData()
    toast({
      title: "Invitation Cancelled",
      description: `Invitation for ${invite.email} has been cancelled`,
    })
  }

  const getRoleBadgeVariant = (role?: UserRole) => {
    if (role === "primary-admin") return "default"
    if (role === "standard") return "secondary"
    return "outline"
  }

  const getRoleLabel = (role?: UserRole) => {
    if (role === "primary-admin") return "Primary Admin"
    if (role === "standard") return "Standard"
    if (role === "view-only") return "View Only"
    return "Unknown"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Users</h1>
        <p className="text-muted-foreground">Manage team members and permissions for {currentUser.firmName}</p>
      </div>

      {/* Team Members Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Team Members ({firmUsers.length})</CardTitle>
            <Button onClick={() => setShowInviteModal(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {firmUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No team members found. Click "Invite User" to add team members.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {firmUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.positionInFirm || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.userRole)}>{getRoleLabel(user.userRole)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.status === "active"
                            ? "default"
                            : user.status === "suspended"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user)
                              setEditForm({
                                firstName: user.firstName,
                                lastName: user.lastName,
                                email: user.email,
                                phone: user.phone || "",
                                positionInFirm: user.positionInFirm || "",
                                userRole: user.userRole || "standard",
                              })
                              setShowEditModal(true)
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user)
                              setResetMethod("link")
                              setTempPassword("")
                              setShowResetPasswordModal(true)
                            }}
                          >
                            <Key className="mr-2 h-4 w-4" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user)
                              setSuspendReason("")
                              setNotifyUser(true)
                              setShowSuspendModal(true)
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
                            onClick={() => {
                              setSelectedUser(user)
                              setRemoveConfirmation("")
                              setShowRemoveModal(true)
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove from Firm
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations Card */}
      {pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations ({pendingInvites.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvites.map((invite) => {
                  const sentDate = new Date(invite.invitedAt)
                  const daysAgo = Math.floor((Date.now() - sentDate.getTime()) / (1000 * 60 * 60 * 24))
                  const timeAgo = daysAgo === 0 ? "Today" : daysAgo === 1 ? "1 day ago" : `${daysAgo} days ago`

                  return (
                    <TableRow key={invite.id}>
                      <TableCell className="font-medium">
                        {invite.firstName} {invite.lastName}
                      </TableCell>
                      <TableCell>{invite.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(invite.role)}>{getRoleLabel(invite.role)}</Badge>
                      </TableCell>
                      <TableCell>{timeAgo}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleResendInvite(invite)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Resend
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleCancelInvite(invite)}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Invite User Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={inviteForm.firstName}
                  onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={inviteForm.lastName}
                  onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(value) => setInviteForm({ ...inviteForm, role: value as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard User</SelectItem>
                  <SelectItem value="view-only">View Only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Cannot invite another Primary Admin</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position/Title</Label>
              <Input
                id="position"
                placeholder="e.g., Associate Solicitor"
                value={inviteForm.positionInFirm}
                onChange={(e) => setInviteForm({ ...inviteForm, positionInFirm: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Welcome Message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Welcome to our team..."
                value={inviteForm.welcomeMessage}
                onChange={(e) => setInviteForm({ ...inviteForm, welcomeMessage: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteUser}>Send Invitation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User - {selectedUser?.fullName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFirstName">First Name *</Label>
                <Input
                  id="editFirstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName">Last Name *</Label>
                <Input
                  id="editLastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email Address *</Label>
              <Input
                id="editEmail"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
              {editForm.email !== selectedUser?.email && (
                <p className="text-xs text-yellow-600">
                  ⚠️ Changing email will require the user to verify their new email address
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPhone">Phone</Label>
              <Input
                id="editPhone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPosition">Position in Firm</Label>
              <Input
                id="editPosition"
                value={editForm.positionInFirm}
                onChange={(e) => setEditForm({ ...editForm, positionInFirm: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRole">Role *</Label>
              <Select
                value={editForm.userRole}
                onValueChange={(value) => setEditForm({ ...editForm, userRole: value as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary-admin">Primary Admin</SelectItem>
                  <SelectItem value="standard">Standard User</SelectItem>
                  <SelectItem value="view-only">View Only</SelectItem>
                </SelectContent>
              </Select>
              {editForm.userRole === "primary-admin" && selectedUser?.userRole !== "primary-admin" && (
                <p className="text-xs text-yellow-600">
                  ⚠️ This will give full access including billing and firm settings
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove User Modal */}
      <Dialog open={showRemoveModal} onOpenChange={setShowRemoveModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>⚠️ Remove User from Firm?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm">
                <strong>User:</strong> {selectedUser?.fullName}
              </p>
              <p className="text-sm">
                <strong>Email:</strong> {selectedUser?.email}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">This will:</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Remove user from firm team</li>
                <li>Revoke access to firm account</li>
                <li>Preserve their search history</li>
                <li>User can still access as individual</li>
              </ul>
            </div>
            <div className="p-3 bg-destructive/10 rounded-md">
              <p className="text-sm text-destructive font-medium">⚠️ This action cannot be undone</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmRemove">Type user's last name to confirm:</Label>
              <Input
                id="confirmRemove"
                value={removeConfirmation}
                onChange={(e) => setRemoveConfirmation(e.target.value)}
                placeholder={selectedUser?.lastName}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveUser}
              disabled={removeConfirmation.toLowerCase() !== selectedUser?.lastName.toLowerCase()}
            >
              Remove from Firm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={showResetPasswordModal} onOpenChange={setShowResetPasswordModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password for {selectedUser?.fullName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm">
                <strong>User:</strong> {selectedUser?.fullName}
              </p>
              <p className="text-sm">
                <strong>Email:</strong> {selectedUser?.email}
              </p>
            </div>

            {!tempPassword ? (
              <>
                <div className="space-y-2">
                  <Label>Choose method:</Label>
                  <div className="space-y-3">
                    <Card
                      className={`p-4 cursor-pointer ${resetMethod === "link" ? "border-primary" : ""}`}
                      onClick={() => setResetMethod("link")}
                    >
                      <div className="flex items-start gap-3">
                        <input type="radio" checked={resetMethod === "link"} onChange={() => setResetMethod("link")} />
                        <div>
                          <h4 className="font-medium">Send Password Reset Link (Recommended)</h4>
                          <p className="text-sm text-muted-foreground">
                            User will receive an email with a secure link to set a new password
                          </p>
                        </div>
                      </div>
                    </Card>
                    <Card
                      className={`p-4 cursor-pointer ${resetMethod === "temp" ? "border-primary" : ""}`}
                      onClick={() => setResetMethod("temp")}
                    >
                      <div className="flex items-start gap-3">
                        <input type="radio" checked={resetMethod === "temp"} onChange={() => setResetMethod("temp")} />
                        <div>
                          <h4 className="font-medium">Generate Temporary Password</h4>
                          <p className="text-sm text-muted-foreground">
                            Create a temporary password that you can share with the user
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Options:</Label>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="requireChange" defaultChecked />
                    <Label htmlFor="requireChange" className="font-normal">
                      Require password change on next login
                    </Label>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm font-medium text-green-900 mb-2">✅ Temporary Password Generated</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-white border rounded text-lg font-mono">{tempPassword}</code>
                    <Button
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(tempPassword)
                        toast({ title: "Copied!", description: "Password copied to clipboard" })
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm font-medium text-yellow-900 mb-1">⚠️ Important:</p>
                  <ul className="text-sm text-yellow-800 list-disc list-inside space-y-1">
                    <li>Share this password securely</li>
                    <li>User must change on next login</li>
                    <li>Password shown only once</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            {!tempPassword ? (
              <>
                <Button variant="outline" onClick={() => setShowResetPasswordModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleResetPassword}>
                  {resetMethod === "link" ? "Send Reset Link" : "Generate Password"}
                </Button>
              </>
            ) : (
              <Button onClick={() => setShowResetPasswordModal(false)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend/Activate User Modal */}
      <Dialog open={showSuspendModal} onOpenChange={setShowSuspendModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.status === "suspended" ? "Reactivate User Account?" : "⚠️ Suspend User Account?"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm">
                <strong>User:</strong> {selectedUser?.fullName}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">This will:</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                {selectedUser?.status === "suspended" ? (
                  <>
                    <li>Restore full access</li>
                    <li>User can log in immediately</li>
                  </>
                ) : (
                  <>
                    <li>Immediately revoke access</li>
                    <li>User cannot log in</li>
                    <li>Preserve all data</li>
                    <li>Can be reactivated later</li>
                  </>
                )}
              </ul>
            </div>
            {selectedUser?.status !== "suspended" && (
              <div className="space-y-2">
                <Label htmlFor="suspendReason">Reason (optional):</Label>
                <Textarea
                  id="suspendReason"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="notifyUser"
                checked={notifyUser}
                onChange={(e) => setNotifyUser(e.target.checked)}
              />
              <Label htmlFor="notifyUser" className="font-normal">
                Notify user by email
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspendModal(false)}>
              Cancel
            </Button>
            <Button
              variant={selectedUser?.status === "suspended" ? "default" : "destructive"}
              onClick={handleToggleSuspend}
            >
              {selectedUser?.status === "suspended" ? "Reactivate Account" : "Suspend Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
