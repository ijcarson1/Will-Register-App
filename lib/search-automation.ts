import { getWills, getSearchById, updateSearch, completeSearchProcessing, getFirms } from "./storage"
import type { SearchRequest, FirmContact } from "@/types"

export function performDatabaseSearch(searchId: string): Promise<{ found: boolean; willId?: string }> {
  return new Promise((resolve) => {
    // Simulate 5 second database search
    setTimeout(() => {
      const search = getSearchById(searchId)
      if (!search) {
        resolve({ found: false })
        return
      }

      const wills = getWills()
      const matchedWill = wills.find(
        (will) => will.testatorName.toLowerCase() === search.deceasedName.toLowerCase() && will.dob === search.dob,
      )

      updateSearch(searchId, {
        status: "db-search-complete",
        progressLog: [
          ...(search.progressLog || []),
          {
            status: "db-search-complete",
            timestamp: new Date().toISOString(),
            notes: `Searched ${wills.length.toLocaleString()} registered wills`,
          },
        ],
      })

      resolve({
        found: !!matchedWill,
        willId: matchedWill?.id,
      })
    }, 5000)
  })
}

export function generateFirmList(addresses: string[]): FirmContact[] {
  const firms = getFirms()
  const selectedFirms = firms.slice(0, 12) // Select first 12 firms

  const distances = [
    "1.2mi",
    "2.3mi",
    "3.5mi",
    "4.1mi",
    "5.8mi",
    "6.2mi",
    "7.5mi",
    "8.9mi",
    "10.2mi",
    "11.5mi",
    "12.8mi",
    "14.3mi",
  ]

  return selectedFirms.map((firm, index) => ({
    firmId: firm.id,
    firmName: firm.name,
    distance: distances[index] || `${(Math.random() * 15 + 1).toFixed(1)}mi`,
    contactMethods: [],
    finalStatus: "no-match" as const,
  }))
}

export async function simulateAdvancedSearch(searchId: string, onUpdate: (search: SearchRequest) => void) {
  const search = getSearchById(searchId)
  if (!search) return

  // Generate firm list
  const firmList = generateFirmList(search.addresses)

  // Day 1 - Hour 1: Send batch emails
  setTimeout(() => {
    const updatedFirmList = firmList.map((firm) => ({
      ...firm,
      contactMethods: [
        {
          method: "email" as const,
          timestamp: new Date().toISOString(),
          status: "sent" as const,
        },
      ],
    }))

    updateSearch(searchId, {
      status: "professional-outreach",
      firmsContacted: updatedFirmList,
      progressLog: [
        ...(search.progressLog || []),
        {
          status: "professional-outreach",
          timestamp: new Date().toISOString(),
          notes: `Batch email sent to ${firmList.length} local firms`,
        },
      ],
    })

    const updated = getSearchById(searchId)
    if (updated) onUpdate(updated)
  }, 2000)

  // Day 1 - Hour 4: First responses
  setTimeout(() => {
    const currentSearch = getSearchById(searchId)
    if (!currentSearch?.firmsContacted) return

    const updatedFirmList = currentSearch.firmsContacted.map((firm, index) => {
      if (index < 3) {
        return {
          ...firm,
          contactMethods: [
            ...firm.contactMethods,
            {
              method: "email" as const,
              timestamp: new Date().toISOString(),
              status: "responded" as const,
              response: "We have no record of acting for this individual",
              responseTimestamp: new Date().toISOString(),
            },
          ],
          finalStatus: "no-match" as const,
        }
      }
      return firm
    })

    updateSearch(searchId, {
      firmsContacted: updatedFirmList,
      progressLog: [
        ...(currentSearch.progressLog || []),
        {
          status: "professional-outreach",
          timestamp: new Date().toISOString(),
          notes: "3 firms responded - no matches found",
        },
      ],
    })

    const updated = getSearchById(searchId)
    if (updated) onUpdate(updated)
  }, 6000)

  // Day 2: More responses
  setTimeout(() => {
    const currentSearch = getSearchById(searchId)
    if (!currentSearch?.firmsContacted) return

    const updatedFirmList = currentSearch.firmsContacted.map((firm, index) => {
      if (index >= 3 && index < 8) {
        return {
          ...firm,
          contactMethods: [
            ...firm.contactMethods,
            {
              method: "email" as const,
              timestamp: new Date().toISOString(),
              status: "responded" as const,
              response: "We have no record of acting for this individual",
              responseTimestamp: new Date().toISOString(),
            },
          ],
          finalStatus: "no-match" as const,
        }
      }
      return firm
    })

    updateSearch(searchId, {
      firmsContacted: updatedFirmList,
      progressLog: [
        ...(currentSearch.progressLog || []),
        {
          status: "professional-outreach",
          timestamp: new Date().toISOString(),
          notes: "5 additional firms responded - no matches found",
        },
      ],
    })

    const updated = getSearchById(searchId)
    if (updated) onUpdate(updated)
  }, 10000)

  // Day 3: Final responses and completion
  setTimeout(() => {
    const currentSearch = getSearchById(searchId)
    if (!currentSearch?.firmsContacted) return

    const updatedFirmList = currentSearch.firmsContacted.map((firm, index) => {
      if (index >= 8) {
        return {
          ...firm,
          contactMethods: [
            ...firm.contactMethods,
            {
              method: "phone" as const,
              timestamp: new Date().toISOString(),
              status: "responded" as const,
              response: "No record found after checking archives",
              responseTimestamp: new Date().toISOString(),
            },
          ],
          finalStatus: "no-match" as const,
        }
      }
      return firm
    })

    updateSearch(searchId, {
      firmsContacted: updatedFirmList,
      progressLog: [
        ...(currentSearch.progressLog || []),
        {
          status: "results-compilation",
          timestamp: new Date().toISOString(),
          notes: "All firms contacted - compiling final report",
        },
      ],
    })

    // Complete the search
    setTimeout(() => {
      completeSearchProcessing(searchId, false)
      const final = getSearchById(searchId)
      if (final) onUpdate(final)
    }, 3000)
  }, 14000)
}
