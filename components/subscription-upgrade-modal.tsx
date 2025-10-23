"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles } from "lucide-react"
import { getPlanDetails, type SubscriptionPlan } from "@/lib/subscription-service"

interface SubscriptionUpgradeModalProps {
  open: boolean
  onClose: () => void
  currentPlan?: SubscriptionPlan
  onUpgrade: (plan: SubscriptionPlan) => void
}

export function SubscriptionUpgradeModal({ open, onClose, currentPlan, onUpgrade }: SubscriptionUpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>("starter")

  const starterDetails = getPlanDetails("starter")
  const professionalDetails = getPlanDetails("professional")

  const handleUpgrade = () => {
    onUpgrade(selectedPlan)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Upgrade Your Subscription</DialogTitle>
          <DialogDescription>Choose the plan that best fits your firm's needs</DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {/* Starter Plan */}
          <div
            className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
              selectedPlan === "starter" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
            onClick={() => setSelectedPlan("starter")}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{starterDetails.name}</h3>
              {currentPlan === "starter" && <Badge>Current Plan</Badge>}
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">£{starterDetails.price}</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-3 mb-6">
              {starterDetails.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground">Perfect for smaller firms with moderate search needs</p>
          </div>

          {/* Professional Plan */}
          <div
            className={`border-2 rounded-lg p-6 cursor-pointer transition-all relative ${
              selectedPlan === "professional" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
            onClick={() => setSelectedPlan("professional")}
          >
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
              <Sparkles className="h-3 w-3 mr-1" />
              Most Popular
            </Badge>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{professionalDetails.name}</h3>
              {currentPlan === "professional" && <Badge>Current Plan</Badge>}
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">£{professionalDetails.price}</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-3 mb-6">
              {professionalDetails.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground">Ideal for active firms with high search volumes</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            <p>30-day free trial • Cancel anytime • No setup fees</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleUpgrade} disabled={currentPlan === selectedPlan}>
              {currentPlan === selectedPlan ? "Current Plan" : "Upgrade Now"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
