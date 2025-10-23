import type { Subscription, CreditTransaction, FirmSubscriptionStats, SubscriptionPlan } from "@/types"

// Mock subscription data
const mockSubscriptions: Subscription[] = [
  {
    id: "SUB_001",
    firmId: "FIRM_001",
    firmName: "Smith & Partners LLP",
    plan: "professional",
    status: "active",
    monthlyPrice: 95,
    creditsPerMonth: 25,
    startDate: "2024-01-15T00:00:00Z",
    nextBillingDate: "2025-02-15T00:00:00Z",
    creditsRemaining: 18,
    creditsUsedThisMonth: 7,
    totalCreditsUsed: 89,
    totalRevenue: 950,
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2025-01-23T00:00:00Z",
    createdBy: "admin",
  },
  {
    id: "SUB_002",
    firmId: "FIRM_002",
    firmName: "Johnson Legal Services",
    plan: "starter",
    status: "active",
    monthlyPrice: 45,
    creditsPerMonth: 12,
    startDate: "2024-06-01T00:00:00Z",
    nextBillingDate: "2025-02-01T00:00:00Z",
    creditsRemaining: 3,
    creditsUsedThisMonth: 9,
    totalCreditsUsed: 78,
    totalRevenue: 360,
    createdAt: "2024-06-01T00:00:00Z",
    updatedAt: "2025-01-23T00:00:00Z",
    createdBy: "admin",
  },
  {
    id: "SUB_003",
    firmId: "FIRM_003",
    firmName: "Williams & Co",
    plan: "professional",
    status: "trial",
    monthlyPrice: 95,
    creditsPerMonth: 25,
    trialStartDate: "2025-01-01T00:00:00Z",
    trialEndDate: "2025-01-31T00:00:00Z",
    startDate: "2025-01-01T00:00:00Z",
    nextBillingDate: "2025-02-01T00:00:00Z",
    creditsRemaining: 25,
    creditsUsedThisMonth: 0,
    totalCreditsUsed: 0,
    totalRevenue: 0,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    createdBy: "admin",
  },
]

const mockCreditTransactions: CreditTransaction[] = [
  {
    id: "CT_001",
    firmId: "FIRM_001",
    firmName: "Smith & Partners LLP",
    userId: "USER_001",
    userName: "John Smith",
    type: "allocation",
    amount: 25,
    balance: 25,
    reason: "Monthly credit allocation",
    createdAt: "2025-01-15T00:00:00Z",
    createdBy: "system",
  },
  {
    id: "CT_002",
    firmId: "FIRM_001",
    firmName: "Smith & Partners LLP",
    userId: "USER_001",
    userName: "John Smith",
    type: "usage",
    amount: -1,
    balance: 24,
    searchId: "SR_001",
    searchType: "basic",
    reason: "Basic search for John Doe",
    createdAt: "2025-01-16T10:30:00Z",
    createdBy: "USER_001",
  },
]

export function getSubscriptions(): Subscription[] {
  return mockSubscriptions
}

export function getSubscriptionByFirmId(firmId: string): Subscription | undefined {
  return mockSubscriptions.find((s) => s.firmId === firmId)
}

export function getCreditTransactions(firmId?: string): CreditTransaction[] {
  if (firmId) {
    return mockCreditTransactions.filter((t) => t.firmId === firmId)
  }
  return mockCreditTransactions
}

export function getFirmSubscriptionStats(): FirmSubscriptionStats[] {
  return mockSubscriptions.map((sub) => {
    const utilizationRate =
      sub.creditsPerMonth > 0 ? Math.round((sub.creditsUsedThisMonth / sub.creditsPerMonth) * 100) : 0

    const startDate = new Date(sub.startDate)
    const now = new Date()
    const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    return {
      firmId: sub.firmId,
      firmName: sub.firmName,
      plan: sub.plan,
      status: sub.status,
      monthlyRevenue: sub.status === "active" ? sub.monthlyPrice : 0,
      totalRevenue: sub.totalRevenue,
      lifetimeValue: sub.totalRevenue,
      creditsAllocated: sub.creditsPerMonth,
      creditsUsed: sub.creditsUsedThisMonth,
      creditsRemaining: sub.creditsRemaining,
      utilizationRate,
      searchesThisMonth: sub.creditsUsedThisMonth,
      searchesTotal: sub.totalCreditsUsed,
      activeUsers: 3, // Mock data
      subscriptionStartDate: sub.startDate,
      nextBillingDate: sub.nextBillingDate,
      daysSinceStart,
    }
  })
}

export function getPlanDetails(plan: SubscriptionPlan) {
  const plans = {
    starter: {
      name: "Starter",
      price: 45,
      credits: 12,
      features: [
        "12 credits per month",
        "1 credit = 1 basic search",
        "2 credits = 1 advanced search",
        "Unlimited will registrations",
        "Email support",
      ],
    },
    professional: {
      name: "Professional",
      price: 95,
      credits: 25,
      features: [
        "25 credits per month",
        "1 credit = 1 basic search",
        "2 credits = 1 advanced search",
        "Unlimited will registrations",
        "Priority processing",
        "Dedicated support",
        "Advanced reporting",
      ],
    },
    individual: {
      name: "Individual",
      price: 0,
      credits: 0,
      features: ["Pay-as-you-go pricing", "£35 per basic search", "£75 per advanced search", "No monthly commitment"],
    },
  }

  return plans[plan]
}

export function calculateCreditsNeeded(searchType: "basic" | "advanced"): number {
  return searchType === "basic" ? 1 : 2
}

export function canAffordSearch(creditsRemaining: number, searchType: "basic" | "advanced"): boolean {
  const creditsNeeded = calculateCreditsNeeded(searchType)
  return creditsRemaining >= creditsNeeded
}
