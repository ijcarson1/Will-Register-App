"use client"

import { useState, useEffect } from "react"
import type { UploadJob } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { getJobs, cancelJob } from "@/lib/job-manager"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CheckCircle2, XCircle, Clock, Download, Eye, X, ArrowLeft } from "lucide-react"
import { format } from "date-fns"

export function JobsPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [jobs, setJobs] = useState<UploadJob[]>([])
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "failed">("all")
  const [selectedJob, setSelectedJob] = useState<UploadJob | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadJobs()
    const interval = setInterval(loadJobs, 1000) // Refresh every second
    return () => clearInterval(interval)
  }, [])

  const loadJobs = () => {
    const allJobs = getJobs()
    setJobs(allJobs)

    // Update selected job if viewing details
    if (selectedJob) {
      const updated = allJobs.find((j) => j.id === selectedJob.id)
      if (updated) {
        setSelectedJob(updated)
      }
    }
  }

  const handleCancelJob = (jobId: string) => {
    cancelJob(jobId)
    toast({
      title: "Job Cancelled",
      description: "The upload job has been cancelled",
    })
    loadJobs()
  }

  const handleDownloadErrors = (job: UploadJob) => {
    const csvContent = [
      "Row,Reason,Testator Name,DOB,Address,Postcode",
      ...job.errors.map(
        (e) =>
          `${e.row + 1},"${e.reason}","${e.data.testatorName || ""}","${e.data.dob || ""}","${e.data.address || ""}","${e.data.postcode || ""}"`,
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${job.fileName}_errors.csv`
    a.click()

    toast({
      title: "Errors Downloaded",
      description: `Downloaded ${job.errors.length} error records`,
    })
  }

  const filteredJobs = jobs.filter((job) => {
    if (filter === "all") return true
    if (filter === "active") return job.status === "processing" || job.status === "queued"
    if (filter === "completed") return job.status === "complete"
    if (filter === "failed") return job.status === "failed"
    return true
  })

  const stats = {
    active: jobs.filter((j) => j.status === "processing" || j.status === "queued").length,
    completed: jobs.filter((j) => j.status === "complete").length,
    failed: jobs.filter((j) => j.status === "failed").length,
  }

  if (selectedJob) {
    return <JobDetailView job={selectedJob} onBack={() => setSelectedJob(null)} onCancel={handleCancelJob} />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Processing Jobs</h1>
        <p className="text-muted-foreground">View upload and processing status</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
          All ({jobs.length})
        </Button>
        <Button variant={filter === "active" ? "default" : "outline"} size="sm" onClick={() => setFilter("active")}>
          Active ({stats.active})
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("completed")}
        >
          Completed ({stats.completed})
        </Button>
        <Button variant={filter === "failed" ? "default" : "outline"} size="sm" onClick={() => setFilter("failed")}>
          Failed ({stats.failed})
        </Button>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No jobs found</p>
              <p className="text-sm text-muted-foreground">Upload jobs will appear here</p>
            </CardContent>
          </Card>
        )}

        {filteredJobs.map((job) => (
          <Card key={job.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{job.id} - Will Upload</CardTitle>
                    {job.status === "processing" && <Badge variant="default">Processing</Badge>}
                    {job.status === "queued" && <Badge variant="secondary">Queued</Badge>}
                    {job.status === "complete" && (
                      <Badge variant="default" className="bg-green-600">
                        Complete
                      </Badge>
                    )}
                    {job.status === "failed" && <Badge variant="destructive">Failed</Badge>}
                    {job.status === "cancelled" && <Badge variant="secondary">Cancelled</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>File: {job.fileName}</p>
                    <p>Firm: {job.firmName}</p>
                    <p>Started: {format(new Date(job.startedAt), "PPp")}</p>
                    {job.completedAt && <p>Completed: {format(new Date(job.completedAt), "PPp")}</p>}
                    {job.duration && <p>Duration: {job.duration}</p>}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(job.status === "processing" || job.status === "queued") && (
                <>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>
                        Progress: {job.processedRecords} / {job.totalRecords}
                      </span>
                      <span>{Math.round((job.processedRecords / job.totalRecords) * 100)}%</span>
                    </div>
                    <Progress value={(job.processedRecords / job.totalRecords) * 100} />
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Successful</p>
                      <p className="text-lg font-semibold text-green-600">{job.successfulRecords}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Failed</p>
                      <p className="text-lg font-semibold text-red-600">{job.failedRecords}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Batch</p>
                      <p className="text-lg font-semibold">
                        {job.currentBatch} / {job.totalBatches}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {job.status === "complete" && (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded">
                    <p className="text-muted-foreground">Successful</p>
                    <p className="text-2xl font-bold text-green-600">{job.successfulRecords}</p>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950 rounded">
                    <p className="text-muted-foreground">Failed</p>
                    <p className="text-2xl font-bold text-red-600">{job.failedRecords}</p>
                  </div>
                  <div className="p-3 bg-muted rounded">
                    <p className="text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{job.totalRecords}</p>
                  </div>
                </div>
              )}

              {job.status === "failed" && (
                <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded">
                  <p className="text-sm font-medium text-red-600">Job Failed</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Processed: {job.processedRecords} / {job.totalRecords} before failure
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={() => setSelectedJob(job)} variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
                {job.status === "processing" && job.canCancel && (
                  <Button onClick={() => handleCancelJob(job.id)} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
                {job.status === "complete" && job.failedRecords > 0 && (
                  <Button onClick={() => handleDownloadErrors(job)} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download Failed Records
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function JobDetailView({
  job,
  onBack,
  onCancel,
}: {
  job: UploadJob
  onBack: () => void
  onCancel: (jobId: string) => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Jobs
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Job Details - {job.id}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {job.status === "processing" && "Processing"}
                {job.status === "complete" && "Completed"}
                {job.status === "failed" && "Failed"}
                {job.status === "cancelled" && "Cancelled"}
              </p>
            </div>
            {job.status === "processing" && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
            {job.status === "complete" && <CheckCircle2 className="h-6 w-6 text-green-600" />}
            {job.status === "failed" && <XCircle className="h-6 w-6 text-red-600" />}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Type</p>
              <p className="font-medium">Will Upload</p>
            </div>
            <div>
              <p className="text-muted-foreground">File</p>
              <p className="font-medium">{job.fileName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Firm</p>
              <p className="font-medium">{job.firmName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">User</p>
              <p className="font-medium">{job.userName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Started</p>
              <p className="font-medium">{format(new Date(job.startedAt), "PPp")}</p>
            </div>
            {job.completedAt && (
              <div>
                <p className="text-muted-foreground">Completed</p>
                <p className="font-medium">{format(new Date(job.completedAt), "PPp")}</p>
              </div>
            )}
            {job.duration && (
              <div>
                <p className="text-muted-foreground">Duration</p>
                <p className="font-medium">{job.duration}</p>
              </div>
            )}
          </div>

          {(job.status === "processing" || job.status === "queued") && (
            <>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{Math.round((job.processedRecords / job.totalRecords) * 100)}%</span>
                </div>
                <Progress value={(job.processedRecords / job.totalRecords) * 100} />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{job.processedRecords}</p>
                  <p className="text-sm text-muted-foreground">Processed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{job.successfulRecords}</p>
                  <p className="text-sm text-muted-foreground">Successful</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{job.failedRecords}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{job.totalRecords - job.processedRecords}</p>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                </div>
              </div>

              <div className="p-4 bg-muted rounded">
                <p className="text-sm">
                  Current Batch: {job.currentBatch} / {job.totalBatches}
                </p>
                <p className="text-sm text-muted-foreground">Batch Size: 100 records</p>
              </div>

              {job.canCancel && (
                <Button onClick={() => onCancel(job.id)} variant="destructive">
                  Cancel Job
                </Button>
              )}
            </>
          )}

          {job.status === "complete" && (
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded text-center">
                <p className="text-3xl font-bold text-green-600">{job.successfulRecords}</p>
                <p className="text-sm text-muted-foreground">
                  Successful ({((job.successfulRecords / job.totalRecords) * 100).toFixed(1)}%)
                </p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded text-center">
                <p className="text-3xl font-bold text-red-600">{job.failedRecords}</p>
                <p className="text-sm text-muted-foreground">
                  Failed ({((job.failedRecords / job.totalRecords) * 100).toFixed(1)}%)
                </p>
              </div>
              <div className="p-4 bg-muted rounded text-center">
                <p className="text-3xl font-bold">{job.totalRecords}</p>
                <p className="text-sm text-muted-foreground">Total Records</p>
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-3">Activity Log</h3>
            <div className="space-y-2 max-h-64 overflow-auto">
              {job.activityLog
                .slice()
                .reverse()
                .map((log, index) => (
                  <div key={index} className="text-sm p-2 bg-muted rounded">
                    <p className="text-muted-foreground text-xs">{format(new Date(log.timestamp), "PPp")}</p>
                    <p>{log.message}</p>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
