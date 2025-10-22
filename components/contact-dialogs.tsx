"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { ContactLogEntry, SolicitorFirm } from "@/types"
import { useToast } from "@/hooks/use-toast"

interface EmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  firm: SolicitorFirm
  deceasedName: string
  searchId: string
  caseReference: string
  onSave: (entry: Omit<ContactLogEntry, "id">) => void
}

export function EmailDialog({
  open,
  onOpenChange,
  firm,
  deceasedName,
  searchId,
  caseReference,
  onSave,
}: EmailDialogProps) {
  const { toast } = useToast()
  const [subject, setSubject] = useState(`Will Search Query - ${deceasedName}`)
  const [body, setBody] = useState(
    `Dear ${firm.name},\n\nWe are conducting a will search for the late ${deceasedName}.\n\nDid your firm hold or prepare a will for this individual?\n\nPlease respond with:\n- YES - Will found\n- NO - No record\n- CHECKING - Need time to search records\n\nCase Reference: ${caseReference}\nSearch ID: ${searchId}\n\nBest regards,\nWillReg Search Team`,
  )
  const [adminNotes, setAdminNotes] = useState("")
  const [clientNotes, setClientNotes] = useState("")

  const handleSend = () => {
    const entry: Omit<ContactLogEntry, "id"> = {
      firmId: firm.id,
      firmName: firm.name,
      contactMethod: "email",
      contactedAt: new Date().toISOString(),
      contactedBy: "Admin User 1",
      status: "sent",
      emailSubject: subject,
      emailOpened: false,
      responseReceived: false,
      followUpRequired: false,
      adminNotes,
      clientNotes: clientNotes || undefined,
    }

    onSave(entry)

    toast({
      title: "Email Sent",
      description: `Email sent to ${firm.name}`,
    })

    // Simulate delivery after 30 seconds
    setTimeout(() => {
      toast({
        title: "Email Delivered",
        description: `Email to ${firm.name} was delivered`,
      })
    }, 30000)

    onOpenChange(false)

    // Reset form
    setAdminNotes("")
    setClientNotes("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Email Contact - {firm.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>To</Label>
            <Input value={firm.email} readOnly className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Body</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} className="font-mono text-sm" />
          </div>

          <div className="space-y-2">
            <Label>Admin Notes (Internal)</Label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Internal notes about this contact..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Client Notes (Optional - Visible to Client)</Label>
            <Textarea
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              placeholder="Notes that will be visible to the client..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend}>Send Email</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface PhoneDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  firm: SolicitorFirm
  onSave: (entry: Omit<ContactLogEntry, "id">) => void
}

export function PhoneDialog({ open, onOpenChange, firm, onSave }: PhoneDialogProps) {
  const { toast } = useToast()
  const [callDuration, setCallDuration] = useState("")
  const [callOutcome, setCallOutcome] = useState<"answered" | "no-answer" | "voicemail" | "busy">("answered")
  const [spokeWith, setSpokeWith] = useState("")
  const [responseCategory, setResponseCategory] = useState<
    "will-found" | "no-match" | "checking-records" | "need-more-info" | "refused"
  >("no-match")
  const [responseDetails, setResponseDetails] = useState("")
  const [followUpRequired, setFollowUpRequired] = useState(false)
  const [followUpDate, setFollowUpDate] = useState("")
  const [adminNotes, setAdminNotes] = useState("")
  const [clientNotes, setClientNotes] = useState("")

  const handleSave = () => {
    const entry: Omit<ContactLogEntry, "id"> = {
      firmId: firm.id,
      firmName: firm.name,
      contactMethod: "phone",
      contactedAt: new Date().toISOString(),
      contactedBy: "Admin User 1",
      status: callOutcome === "answered" ? "responded" : callOutcome === "voicemail" ? "voicemail" : "no-answer",
      callDuration,
      callOutcome,
      responseReceived: callOutcome === "answered",
      responseAt: callOutcome === "answered" ? new Date().toISOString() : undefined,
      responseMethod: callOutcome === "answered" ? "phone" : undefined,
      responseFrom: spokeWith || undefined,
      responseContent: responseDetails || undefined,
      responseCategory: callOutcome === "answered" ? responseCategory : undefined,
      followUpRequired,
      followUpDate: followUpRequired ? followUpDate : undefined,
      adminNotes,
      clientNotes: clientNotes || undefined,
    }

    onSave(entry)

    toast({
      title: "Call Logged",
      description: `Phone call to ${firm.name} has been logged`,
    })

    onOpenChange(false)

    // Reset form
    setCallDuration("")
    setSpokeWith("")
    setResponseDetails("")
    setFollowUpRequired(false)
    setFollowUpDate("")
    setAdminNotes("")
    setClientNotes("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Phone Call - {firm.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <div className="flex gap-2">
              <Input value={firm.phone} readOnly className="bg-muted" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(firm.phone)
                  toast({ title: "Copied to clipboard" })
                }}
              >
                Copy
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Call Duration</Label>
              <Input
                value={callDuration}
                onChange={(e) => setCallDuration(e.target.value)}
                placeholder="e.g., 5 minutes"
              />
            </div>

            <div className="space-y-2">
              <Label>Call Outcome</Label>
              <Select value={callOutcome} onValueChange={(v: any) => setCallOutcome(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="answered">Answered</SelectItem>
                  <SelectItem value="no-answer">No Answer</SelectItem>
                  <SelectItem value="voicemail">Voicemail Left</SelectItem>
                  <SelectItem value="busy">Busy Signal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {callOutcome === "answered" && (
            <>
              <div className="space-y-2">
                <Label>Spoke With</Label>
                <Input value={spokeWith} onChange={(e) => setSpokeWith(e.target.value)} placeholder="Person's name" />
              </div>

              <div className="space-y-2">
                <Label>Response Category</Label>
                <Select value={responseCategory} onValueChange={(v: any) => setResponseCategory(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="will-found">Will Found</SelectItem>
                    <SelectItem value="no-match">No Match</SelectItem>
                    <SelectItem value="checking-records">Checking Records</SelectItem>
                    <SelectItem value="need-more-info">Need More Information</SelectItem>
                    <SelectItem value="refused">Refused to Help</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Response Details</Label>
                <Textarea
                  value={responseDetails}
                  onChange={(e) => setResponseDetails(e.target.value)}
                  placeholder="What they said..."
                  rows={4}
                />
              </div>
            </>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="followup"
              checked={followUpRequired}
              onCheckedChange={(checked) => setFollowUpRequired(checked as boolean)}
            />
            <Label htmlFor="followup">Follow-up Required</Label>
          </div>

          {followUpRequired && (
            <div className="space-y-2">
              <Label>Follow-up Date</Label>
              <Input type="datetime-local" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
            </div>
          )}

          <div className="space-y-2">
            <Label>Admin Notes (Internal)</Label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Internal notes about this call..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Client Notes (Optional - Visible to Client)</Label>
            <Textarea
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              placeholder="Notes that will be visible to the client..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Call Log</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
