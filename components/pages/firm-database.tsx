"use client"

import { useState } from "react"
import type { User } from "@/types"
import { getFirms } from "@/lib/storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Upload } from "lucide-react"
import { AddFirmModal } from "@/components/add-firm-modal"

interface FirmDatabasePageProps {
  currentUser: User
  onNavigate: (page: string, data?: any) => void
}

export function FirmDatabasePage({ currentUser, onNavigate }: FirmDatabasePageProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddFirmModal, setShowAddFirmModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const firms = getFirms()

  const filteredFirms = firms.filter(
    (firm) =>
      firm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      firm.postcode.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Firm Database</h1>
        <p className="text-muted-foreground">Manage solicitor firm contacts</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Search & Filter</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAddFirmModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Firm
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Bulk Import
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or postcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Firms ({filteredFirms.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Postcode</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>SRA Number</TableHead>
                <TableHead>Response Rate</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFirms.map((firm) => (
                <TableRow
                  key={firm.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onNavigate("firm-detail", { firmId: firm.id })}
                >
                  <TableCell className="font-medium">{firm.name}</TableCell>
                  <TableCell>{firm.postcode}</TableCell>
                  <TableCell>{firm.phone}</TableCell>
                  <TableCell>{firm.email}</TableCell>
                  <TableCell>{firm.sraNumber}</TableCell>
                  <TableCell>{firm.responseRate}%</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddFirmModal
        open={showAddFirmModal}
        onOpenChange={setShowAddFirmModal}
        currentUser={currentUser}
        onSuccess={() => setRefreshKey((prev) => prev + 1)}
      />
    </div>
  )
}
