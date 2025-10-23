"use client"

import type { User } from "@/types"
import { getSearches } from "@/lib/storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Clock } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { IndividualUpgradeBanner } from "@/components/individual-upgrade-banner"

interface IndividualDashboardProps {
  currentUser: User
  onNavigate: (page: string, data?: any) => void
}

export function IndividualDashboard({ currentUser, onNavigate }: IndividualDashboardProps) {
  const searches = getSearches()
  const userSearches = searches.filter((s) => s.requestedBy === currentUser.fullName).slice(0, 3)

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      received: "bg-gray-500",
      "payment-confirmed": "bg-blue-500",
      "db-search-complete": "bg-yellow-500",
      "professional-outreach": "bg-orange-500",
      "results-compilation": "bg-purple-500",
      complete: "bg-green-500",
    }
    return colors[status] || "bg-gray-500"
  }

  const formatStatus = (status: string) => {
    return status
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {currentUser.firstName}</h1>
        <p className="text-muted-foreground">Search for a loved one's will</p>
      </div>

      <IndividualUpgradeBanner />

      {/* Primary CTA */}
      <Card className="p-8 text-center border-2 border-primary/20 bg-gradient-to-br from-background to-muted/20">
        <Search className="h-16 w-16 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold mb-2">Search for a Will</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Find where a will is stored for someone who has passed away
        </p>
        <Button size="lg" onClick={() => onNavigate("search-request")} className="px-8">
          Start New Search
        </Button>
      </Card>

      {/* Recent Searches */}
      {userSearches.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Recent Searches</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate("view-searches")}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {userSearches.map((search) => (
              <div
                key={search.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onNavigate("search-detail", { searchId: search.id })}
              >
                <div className="flex-1">
                  <p className="font-medium">{search.deceasedName}</p>
                  <p className="text-sm text-muted-foreground">
                    Case: {search.caseReference} • {formatDate(search.requestDate)}
                  </p>
                </div>
                <Badge className={getStatusColor(search.status)}>{formatStatus(search.status)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Getting Started Guide for first-time users */}
      {userSearches.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Provide Details</h3>
                <p className="text-sm text-muted-foreground">
                  Enter information about the deceased person including their name, date of birth, and last known
                  address
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">We Search Our Database</h3>
                <p className="text-sm text-muted-foreground">
                  Our system searches the National Will Register and contacts relevant solicitor firms
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Receive Results</h3>
                <p className="text-sm text-muted-foreground">
                  You'll be notified when the search is complete with details about where the will is stored
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Typical turnaround time</p>
                  <p className="text-sm text-muted-foreground">Most searches are completed within 5-7 business days</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
