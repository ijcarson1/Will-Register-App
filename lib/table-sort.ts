"use client"

import { useState, useMemo } from "react"

export type SortDirection = "asc" | "desc" | null
export type SortConfig<T> = {
  key: keyof T | string
  direction: SortDirection
}

export function useSortableTable<T>(data: T[], initialSort?: SortConfig<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(initialSort || null)

  const sortedData = useMemo(() => {
    if (!sortConfig || !sortConfig.direction) {
      return data
    }

    const sorted = [...data].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.key as string)
      const bValue = getNestedValue(b, sortConfig.key as string)

      // Handle null/undefined values - always put them at the end
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1

      // Determine sort order
      const direction = sortConfig.direction === "asc" ? 1 : -1

      // Handle different data types
      if (typeof aValue === "string" && typeof bValue === "string") {
        return direction * aValue.toLowerCase().localeCompare(bValue.toLowerCase())
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return direction * (aValue - bValue)
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return direction * (aValue.getTime() - bValue.getTime())
      }

      // Try to parse as dates if they're strings
      const aDate = new Date(aValue as string)
      const bDate = new Date(bValue as string)
      if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
        return direction * (aDate.getTime() - bDate.getTime())
      }

      // Fallback to string comparison
      return direction * String(aValue).localeCompare(String(bValue))
    })

    return sorted
  }, [data, sortConfig])

  const requestSort = (key: keyof T | string) => {
    let direction: SortDirection = "asc"

    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }

    setSortConfig({ key, direction })
  }

  return { sortedData, sortConfig, requestSort }
}

// Helper function to get nested object values
function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => current?.[key], obj)
}
