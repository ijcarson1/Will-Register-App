"use client"

import type React from "react"

import { TableHead } from "@/components/ui/table"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import type { SortConfig } from "@/lib/table-sort"

interface SortableTableHeadProps<T> {
  column: keyof T | string
  sortConfig: SortConfig<T> | null
  onSort: (column: keyof T | string) => void
  children: React.ReactNode
  className?: string
}

export function SortableTableHead<T>({
  column,
  sortConfig,
  onSort,
  children,
  className = "",
}: SortableTableHeadProps<T>) {
  const isSorted = sortConfig?.key === column
  const direction = isSorted ? sortConfig?.direction : null

  return (
    <TableHead
      className={`cursor-pointer select-none hover:bg-muted/50 transition-colors ${className}`}
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-2">
        {children}
        <span className="text-muted-foreground">
          {direction === "asc" && <ArrowUp className="h-4 w-4" />}
          {direction === "desc" && <ArrowDown className="h-4 w-4" />}
          {!direction && <ArrowUpDown className="h-4 w-4 opacity-40" />}
        </span>
      </div>
    </TableHead>
  )
}
