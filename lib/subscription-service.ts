import type { Subscription, CreditTransaction, FirmSubscriptionStats, SubscriptionPlan, AdminAction } from "@/types"
import { addDays, format } from "date-fns"

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

const mockAdminActions: AdminAction[] = []

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

export function getAdminActions(): AdminAction[] {
  return mockAdminActions
}

export function logAdminAction(action: Omit<AdminAction, "id" | "createdAt">): void {
  const log: AdminAction = {
    id: `AA_${String(mockAdminActions.length + 1).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
    ...action,
  }
  mockAdminActions.push(log)
}

export function adminChangeSubscriptionTier(
  adminId: string,
  adminName: string,
  userId: string,
  userName: string,
  firmId: string,
  firmName: string,
  currentTier: SubscriptionPlan,
  newTier: SubscriptionPlan,
  reason: string,
): void {
  const subscription = mockSubscriptions.find((s) => s.firmId === firmId)

  if (subscription) {
    subscription.plan = newTier
    subscription.updatedAt = new Date().toISOString()

    // Adjust credits based on new tier
    const planDetails = getPlanDetails(newTier)
    subscription.creditsPerMonth = planDetails.credits
    subscription.monthlyPrice = planDetails.price
    subscription.creditsRemaining = planDetails.credits
  }

  logAdminAction({
    adminId,
    adminName,
    action: "subscription_change",
    targetUserId: userId,
    targetUserName: userName,
    targetFirmId: firmId,
    targetFirmName: firmName,
    details: {
      previousTier: currentTier,
      newTier,
    },
    reason,
    previousValue: currentTier,
    newValue: newTier,
  })
}

export function adminAdjustCredits(
  adminId: string,
  adminName: string,
  userId: string,
  userName: string,
  firmId: string,
  firmName: string,
  adjustmentType: "add" | "remove" | "set",
  amount: number,
  reason: string,
  currentBalance: number,
): number {
  let newBalance = currentBalance

  if (adjustmentType === "add") {
    newBalance = currentBalance + amount
  } else if (adjustmentType === "remove") {
    newBalance = Math.max(0, currentBalance - amount)
  } else {
    newBalance = amount
  }

  const transaction: CreditTransaction = {
    id: `CT_${String(mockCreditTransactions.length + 1).padStart(3, "0")}`,
    firmId,
    firmName,
    userId,
    userName,
    type: "adjustment",
    amount: newBalance - currentBalance,
    balance: newBalance,
    reason: `Admin adjustment: ${reason}`,
    adminAdjustment: true,
    adminId,
    adminReason: reason,
    createdAt: new Date().toISOString(),
    createdBy: adminId,
  }

  mockCreditTransactions.push(transaction)

  // Update subscription
  const subscription = mockSubscriptions.find((s) => s.firmId === firmId)
  if (subscription) {
    subscription.creditsRemaining = newBalance
    subscription.updatedAt = new Date().toISOString()
  }

  logAdminAction({
    adminId,
    adminName,
    action: "credit_adjustment",
    targetUserId: userId,
    targetUserName: userName,
    targetFirmId: firmId,
    targetFirmName: firmName,
    details: {
      adjustmentType,
      amount,
      previousBalance: currentBalance,
      newBalance,
    },
    reason,
    previousValue: currentBalance.toString(),
    newValue: newBalance.toString(),
  })

  return newBalance
}

export function adminExtendTrial(
  adminId: string,
  adminName: string,
  userId: string,
  userName: string,
  firmId: string,
  firmName: string,
  days: number,
  currentTrialEnd: string,
  reason: string,
): string {
  const newTrialEnd = addDays(new Date(currentTrialEnd), days).toISOString()

  const subscription = mockSubscriptions.find((s) => s.firmId === firmId)
  if (subscription) {
    subscription.trialEndDate = newTrialEnd
    subscription.updatedAt = new Date().toISOString()
  }

  logAdminAction({
    adminId,
    adminName,
    action: "trial_extension",
    targetUserId: userId,
    targetUserName: userName,
    targetFirmId: firmId,
    targetFirmName: firmName,
    details: {
      daysExtended: days,
      previousEnd: currentTrialEnd,
      newEnd: newTrialEnd,
    },
    reason,
    previousValue: format(new Date(currentTrialEnd), "MMM dd, yyyy"),
    newValue: format(new Date(newTrialEnd), "MMM dd, yyyy"),
  })

  return newTrialEnd
}

export function adminCancelSubscription(
  adminId: string,
  adminName: string,
  userId: string,
  userName: string,
  firmId: string,
  firmName: string,
  reason: string,
): void {
  const subscription = mockSubscriptions.find((s) => s.firmId === firmId)
  if (subscription) {
    subscription.status = "cancelled"
    subscription.cancelledAt = new Date().toISOString()
    subscription.updatedAt = new Date().toISOString()
  }

  logAdminAction({
    adminId,
    adminName,
    action: "subscription_cancel",
    targetUserId: userId,
    targetUserName: userName,
    targetFirmId: firmId,
    targetFirmName: firmName,
    details: {},
    reason,
  })
}

export function adminReactivateSubscription(
  adminId: string,
  adminName: string,
  userId: string,
  userName: string,
  firmId: string,
  firmName: string,
  reason: string,
): void {
  const subscription = mockSubscriptions.find((s) => s.firmId === firmId)
  if (subscription) {
    subscription.status = "active"
    subscription.cancelledAt = undefined
    subscription.updatedAt = new Date().toISOString()
  }

  logAdminAction({
    adminId,
    adminName,
    action: "subscription_reactivate",
    targetUserId: userId,
    targetUserName: userName,
    targetFirmId: firmId,
    targetFirmName: firmName,
    details: {},
    reason,
  })
}
