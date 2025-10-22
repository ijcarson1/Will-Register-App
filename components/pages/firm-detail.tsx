"use client"

import { getFirmById } from "@/lib/storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Edit } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface FirmDetailPageProps {
  firmId: string
  onNavigate: (page: string) => void
}

export function FirmDetailPage({ firmId, onNavigate }: FirmDetailPageProps) {
  const firm = getFirmById(firmId)

  if (!firm) {
    return <div>Firm not found</div>
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => onNavigate("firm-database")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Database
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{firm.name}</h1>
          <p className="text-muted-foreground">SRA: {firm.sraNumber}</p>
        </div>
        <Button>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Firm Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-semibold">{firm.address}</p>
              <p className="font-semibold">{firm.postcode}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-semibold">{firm.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-semibold">{firm.email}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Practice Areas</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {firm.practiceAreas.map((area, i) => (
                  <Badge key={i} variant="secondary">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Response Rate</p>
              <p className="text-2xl font-bold">{firm.responseRate}%</p>
            </div>
            {firm.lastContact && (
              <div>
                <p className="text-sm text-muted-foreground">Last Contact</p>
                <p className="font-semibold">{formatDate(firm.lastContact)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Contact History</CardTitle>
              <Button size="sm">Add Log</Button>
            </div>
          </CardHeader>
          <CardContent>
            {firm.contactHistory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Response</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {firm.contactHistory.map((contact, i) => (
                    <TableRow key={i}>
                      <TableCell>{formatDate(contact.date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{contact.method}</Badge>
                      </TableCell>
                      <TableCell>{contact.response}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No contact history</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
