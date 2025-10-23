"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Sparkles, Check } from "lucide-react"

export function IndividualUpgradeBanner() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <Card className="border-primary/50 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Save with a Firm Account</h3>
                <p className="text-sm text-muted-foreground">
                  Get better rates and monthly credits by upgrading to a firm subscription
                </p>
              </div>
            </div>
            <Button onClick={() => setShowModal(true)}>Learn More</Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Upgrade to a Firm Account</DialogTitle>
            <DialogDescription>
              Compare your current pay-as-you-go pricing with firm subscription plans
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Current Pricing */}
            <div className="border rounded-lg p-6 bg-muted/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Your Current Pricing (Individual)</h3>
                <Badge variant="secondary">Pay-as-you-go</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Basic Search</span>
                  <span className="font-semibold">£35 per search</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Advanced Search</span>
                  <span className="font-semibold">£75 per search</span>
                </div>
              </div>
            </div>

            {/* Firm Plans Comparison */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Starter Plan */}
              <div className="border rounded-lg p-6">
                <h3 className="font-bold text-lg mb-2">Starter Plan</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold">£45</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>12 credits per month</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>1 credit = 1 basic search</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>2 credits = 1 advanced search</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Unlimited will registrations</span>
                  </li>
                </ul>
                <p className="text-xs text-muted-foreground">Effective cost: £3.75 per basic search</p>
              </div>

              {/* Professional Plan */}
              <div className="border-2 border-primary rounded-lg p-6 relative">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Best Value</Badge>
                <h3 className="font-bold text-lg mb-2">Professional Plan</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold">£95</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>25 credits per month</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>1 credit = 1 basic search</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>2 credits = 1 advanced search</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Priority processing</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Dedicated support</span>
                  </li>
                </ul>
                <p className="text-xs text-muted-foreground">Effective cost: £3.80 per basic search</p>
              </div>
            </div>

            {/* Savings Calculator */}
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-6">
              <h3 className="font-semibold mb-3 text-green-900 dark:text-green-100">Potential Savings</h3>
              <div className="space-y-2 text-sm">
                <p>If you perform 3 basic searches per month:</p>
                <div className="flex items-center justify-between pl-4">
                  <span className="text-muted-foreground">Current cost: 3 × £35</span>
                  <span className="font-semibold">£105</span>
                </div>
                <div className="flex items-center justify-between pl-4">
                  <span className="text-green-700 dark:text-green-400">Starter plan cost</span>
                  <span className="font-semibold text-green-700 dark:text-green-400">£45</span>
                </div>
                <div className="flex items-center justify-between pl-4 pt-2 border-t border-green-200 dark:border-green-900">
                  <span className="font-semibold">Monthly savings</span>
                  <span className="font-bold text-green-700 dark:text-green-400">£60</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">30-day free trial • No setup fees</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Maybe Later
                </Button>
                <Button onClick={() => console.log("[v0] Upgrade to firm account")}>Upgrade to Firm Account</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
