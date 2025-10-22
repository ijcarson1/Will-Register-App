import type { UploadJob, WillRegistration, User } from "@/types"
import { addWill } from "./storage"

// Job storage functions
export function getJobs(): UploadJob[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem("uploadJobs")
  return data ? JSON.parse(data) : []
}

function saveJobs(jobs: UploadJob[]) {
  if (typeof window === "undefined") return
  localStorage.setItem("uploadJobs", JSON.stringify(jobs))
}

export function getJobById(id: string): UploadJob | undefined {
  const jobs = getJobs()
  return jobs.find((j) => j.id === id)
}

// Create a new upload job
export function createUploadJob(params: {
  fileName: string
  totalRecords: number
  firmId: string
  firmName: string
  userId: string
  userName: string
  data: any[]
}): string {
  const jobId = `JOB_${Date.now()}`
  const batchSize = 100
  const totalBatches = Math.ceil(params.totalRecords / batchSize)

  const newJob: UploadJob = {
    id: jobId,
    type: "will-upload",
    firmId: params.firmId,
    firmName: params.firmName,
    userId: params.userId,
    userName: params.userName,
    fileName: params.fileName,
    totalRecords: params.totalRecords,
    status: "queued",
    processedRecords: 0,
    successfulRecords: 0,
    failedRecords: 0,
    currentBatch: 0,
    totalBatches,
    startedAt: new Date().toISOString(),
    errors: [],
    data: params.data,
    canCancel: true,
    canRetry: false,
    activityLog: [
      {
        timestamp: new Date().toISOString(),
        message: `Job created: ${params.fileName} (${params.totalRecords} records)`,
      },
    ],
  }

  const jobs = getJobs()
  jobs.push(newJob)
  saveJobs(jobs)

  return jobId
}

// Update job progress
export function updateJobProgress(jobId: string, updates: Partial<UploadJob>) {
  const jobs = getJobs()
  const index = jobs.findIndex((j) => j.id === jobId)
  if (index !== -1) {
    jobs[index] = { ...jobs[index], ...updates }
    saveJobs(jobs)
  }
}

// Add activity log entry
export function addJobActivity(jobId: string, message: string) {
  const jobs = getJobs()
  const index = jobs.findIndex((j) => j.id === jobId)
  if (index !== -1) {
    jobs[index].activityLog.push({
      timestamp: new Date().toISOString(),
      message,
    })
    saveJobs(jobs)
  }
}

// Complete job
export function completeJob(
  jobId: string,
  results: { successfulRecords: number; failedRecords: number; errors: any[] },
) {
  const jobs = getJobs()
  const index = jobs.findIndex((j) => j.id === jobId)
  if (index !== -1) {
    const startTime = new Date(jobs[index].startedAt).getTime()
    const endTime = Date.now()
    const durationMs = endTime - startTime
    const durationMin = Math.floor(durationMs / 60000)
    const durationSec = Math.floor((durationMs % 60000) / 1000)

    jobs[index] = {
      ...jobs[index],
      status: "complete",
      completedAt: new Date().toISOString(),
      duration: `${durationMin}m ${durationSec}s`,
      successfulRecords: results.successfulRecords,
      failedRecords: results.failedRecords,
      errors: results.errors,
      canCancel: false,
      canRetry: false,
      data: undefined, // Clear data to save space
    }
    jobs[index].activityLog.push({
      timestamp: new Date().toISOString(),
      message: `Job completed: ${results.successfulRecords} successful, ${results.failedRecords} failed`,
    })
    saveJobs(jobs)
  }
}

// Fail job
export function failJob(jobId: string, error: string) {
  const jobs = getJobs()
  const index = jobs.findIndex((j) => j.id === jobId)
  if (index !== -1) {
    jobs[index] = {
      ...jobs[index],
      status: "failed",
      completedAt: new Date().toISOString(),
      canCancel: false,
      canRetry: true,
    }
    jobs[index].activityLog.push({
      timestamp: new Date().toISOString(),
      message: `Job failed: ${error}`,
    })
    saveJobs(jobs)
  }
}

// Cancel job
export function cancelJob(jobId: string) {
  const jobs = getJobs()
  const index = jobs.findIndex((j) => j.id === jobId)
  if (index !== -1) {
    jobs[index] = {
      ...jobs[index],
      status: "cancelled",
      completedAt: new Date().toISOString(),
      canCancel: false,
      canRetry: true,
      data: undefined,
    }
    jobs[index].activityLog.push({
      timestamp: new Date().toISOString(),
      message: "Job cancelled by user",
    })
    saveJobs(jobs)
  }
}

// Background processor
export async function processJobInBackground(jobId: string, currentUser: User) {
  const job = getJobById(jobId)
  if (!job || !job.data) return

  // Update to processing
  updateJobProgress(jobId, {
    status: "processing",
  })
  addJobActivity(jobId, "Processing started")

  const BATCH_SIZE = 100
  const DELAY_BETWEEN_BATCHES = 100 // ms

  const batches: any[][] = []
  for (let i = 0; i < job.data.length; i += BATCH_SIZE) {
    batches.push(job.data.slice(i, i + BATCH_SIZE))
  }

  let successCount = 0
  let failCount = 0
  const errors: any[] = []

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]

    // Process each row in the batch
    for (const row of batch) {
      try {
        const will: Omit<WillRegistration, "id"> = {
          testatorName: row.testatorName || "",
          dob: row.dob || "",
          address: row.address || "",
          postcode: row.postcode || "",
          willLocation: row.willLocation || "",
          solicitorName: row.solicitorName || "",
          willDate: row.willDate || "",
          executorName: row.executorName || "",
          certificateUrl: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          registeredBy: currentUser.fullName,
          registeredDate: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.fullName,
          version: 1,
          firmId: currentUser.firmId,
          firmName: currentUser.firmName,
          registrationMethod: "bulk-firm",
        }

        addWill(will as WillRegistration)
        successCount++
      } catch (error: any) {
        failCount++
        errors.push({
          row: i * BATCH_SIZE + batch.indexOf(row),
          reason: error.message || "Unknown error",
          data: row,
        })
      }
    }

    // Update progress
    updateJobProgress(jobId, {
      currentBatch: i + 1,
      processedRecords: (i + 1) * BATCH_SIZE,
      successfulRecords: successCount,
      failedRecords: failCount,
    })

    addJobActivity(jobId, `Batch ${i + 1}/${batches.length} complete (${(i + 1) * BATCH_SIZE}/${job.totalRecords})`)

    // Yield to browser - CRITICAL!
    await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
  }

  // Complete job
  completeJob(jobId, {
    successfulRecords: successCount,
    failedRecords: failCount,
    errors,
  })
}

// Get active jobs count
export function getActiveJobsCount(): number {
  const jobs = getJobs()
  return jobs.filter((j) => j.status === "processing" || j.status === "queued").length
}

// Clean up old jobs (older than 7 days)
export function cleanupOldJobs() {
  const jobs = getJobs()
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

  const filtered = jobs.filter((job) => {
    if (job.status === "processing" || job.status === "queued") return true
    const completedTime = job.completedAt ? new Date(job.completedAt).getTime() : Date.now()
    return completedTime > sevenDaysAgo
  })

  saveJobs(filtered)
}
