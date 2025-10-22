"use client"

import type React from "react"

import { useState } from "react"
import type { User } from "@/types"
import { addFirm } from "@/lib/storage"
import { generateId } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

interface AddFirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUser: User
  onSuccess: () => void
}

const PRACTICE_AREAS = ["Probate", "Wills", "Estate Planning", "Trusts", "Estate Administration", "Other"]

export function AddFirmModal({ open, onOpenChange, currentUser, onSuccess }: AddFirmModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    postcode: "",
    phone: "",
    email: "",
    sraNumber: "",
    practiceAreas: [] as string[],
    otherPracticeArea: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Firm name is required"
    if (!formData.address.trim()) newErrors.address = "Address is required"
    if (!formData.postcode.trim()) newErrors.postcode = "Postcode is required"
    else if (!/^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i.test(formData.postcode.trim()))
      newErrors.postcode = "Invalid UK postcode format"

    if (!formData.phone.trim()) newErrors.phone = "Phone is required"
    else if (!/^(\+44|0)[0-9\s]{10,}$/.test(formData.phone.replace(/\s/g, "")))
      newErrors.phone = "Invalid UK phone format"

    if (!formData.email.trim()) newErrors.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format"

    if (!formData.sraNumber.trim()) newErrors.sraNumber = "SRA number is required"
    else if (!/^SRA\d{6}$/i.test(formData.sraNumber.trim()))
      newErrors.sraNumber = "Invalid SRA number format (e.g., SRA123456)"

    if (formData.practiceAreas.length === 0) newErrors.practiceAreas = "Select at least one practice area"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    // Simulate API delay
    setTimeout(() => {
      const practiceAreas = [...formData.practiceAreas]
      if (formData.otherPracticeArea.trim()) {
        practiceAreas.push(formData.otherPracticeArea.trim())
      }

      const newFirm = {
        id: generateId("FIRM"),
        name: formData.name.trim(),
        address: formData.address.trim(),
        postcode: formData.postcode.trim().toUpperCase(),
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase(),
        sraNumber: formData.sraNumber.trim().toUpperCase(),
        practiceAreas,
        responseRate: 0,
        contactHistory: [],
        createdDate: new Date().toISOString(),
        createdBy: currentUser.userName,
      }

      addFirm(newFirm)

      toast({
        title: "Firm added successfully",
        description: `${newFirm.name} has been added to the database`,
      })

      setFormData({
        name: "",
        address: "",
        postcode: "",
        phone: "",
        email: "",
        sraNumber: "",
        practiceAreas: [],
        otherPracticeArea: "",
      })
      setErrors({})
      setLoading(false)
      onOpenChange(false)
      onSuccess()
    }, 1000)
  }

  const togglePracticeArea = (area: string) => {
    setFormData((prev) => ({
      ...prev,
      practiceAreas: prev.practiceAreas.includes(area)
        ? prev.practiceAreas.filter((a) => a !== area)
        : [...prev.practiceAreas, area],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Firm</DialogTitle>
          <DialogDescription>Add a new solicitor firm to the database</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">
                Firm Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onBlur={validateForm}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">
                Address <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                onBlur={validateForm}
                rows={3}
              />
              {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="postcode">
                Postcode <span className="text-destructive">*</span>
              </Label>
              <Input
                id="postcode"
                value={formData.postcode}
                onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                onBlur={validateForm}
                placeholder="SW1A 1AA"
              />
              {errors.postcode && <p className="text-sm text-destructive">{errors.postcode}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                onBlur={validateForm}
                placeholder="020 1234 5678"
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onBlur={validateForm}
                placeholder="contact@firm.co.uk"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sraNumber">
                SRA Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sraNumber"
                value={formData.sraNumber}
                onChange={(e) => setFormData({ ...formData, sraNumber: e.target.value })}
                onBlur={validateForm}
                placeholder="SRA123456"
              />
              {errors.sraNumber && <p className="text-sm text-destructive">{errors.sraNumber}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>
                Practice Areas <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {PRACTICE_AREAS.map((area) => (
                  <div key={area} className="flex items-center space-x-2">
                    <Checkbox
                      id={area}
                      checked={formData.practiceAreas.includes(area)}
                      onCheckedChange={() => togglePracticeArea(area)}
                    />
                    <Label htmlFor={area} className="font-normal cursor-pointer">
                      {area}
                    </Label>
                  </div>
                ))}
              </div>
              {formData.practiceAreas.includes("Other") && (
                <Input
                  placeholder="Specify other practice area"
                  value={formData.otherPracticeArea}
                  onChange={(e) => setFormData({ ...formData, otherPracticeArea: e.target.value })}
                  className="mt-2"
                />
              )}
              {errors.practiceAreas && <p className="text-sm text-destructive">{errors.practiceAreas}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Firm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
