"use client"

import { useMemo } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { Loader2 } from "lucide-react"
import { cn } from "@ui/lib/utils"
import { AdminDataTable } from "@/components/admin-data-table"
import type { YearAverage } from "@/types/student-scores"
import { formatScore } from "./score-utils"

interface Props {
  averages?: YearAverage[]
  isLoading: boolean
}

export const YearAveragesList = ({ averages, isLoading }: Props) => {
  const sorted = useMemo(
    () => (averages ? [...averages].sort((a, b) => (b.yearStudy || "").localeCompare(a.yearStudy || "")) : []),
    [averages]
  )

  const columns = useMemo<ColumnDef<YearAverage>[]>(
    () => [
      { accessorKey: "yearStudy", header: "Năm học", enableColumnFilter: false, cell: ({ row }) => <span className="font-medium">{row.original.yearStudy}</span> },
      {
        accessorKey: "averageScore10",
        header: () => <span className="block text-center">Hệ 10</span>,
        enableColumnFilter: false,
        cell: ({ row }) => {
          const f = formatScore(row.original.averageScore10, "10")
          return <span className={cn("block text-center tabular-nums", f.color)}>{f.text}</span>
        },
      },
      {
        accessorKey: "averageScore4",
        header: () => <span className="block text-center">Hệ 4</span>,
        enableColumnFilter: false,
        cell: ({ row }) => {
          const f = formatScore(row.original.averageScore4, "4")
          return <span className={cn("block text-center tabular-nums", f.color)}>{f.text}</span>
        },
      },
      {
        accessorKey: "averageGatherScore10",
        header: () => <span className="block text-center">Tích lũy hệ 10</span>,
        enableColumnFilter: false,
        cell: ({ row }) => {
          const f = formatScore(row.original.averageGatherScore10, "10")
          return <span className={cn("block text-center tabular-nums", f.color)}>{f.text}</span>
        },
      },
      {
        accessorKey: "averageGatherScore4",
        header: () => <span className="block text-center">Tích lũy hệ 4</span>,
        enableColumnFilter: false,
        cell: ({ row }) => {
          const f = formatScore(row.original.averageGatherScore4, "4")
          return <span className={cn("block text-center tabular-nums", f.color)}>{f.text}</span>
        },
      },
    ],
    []
  )

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
  if (!sorted.length) return <div className="py-8 text-center text-sm text-muted-foreground">Chưa có dữ liệu điểm trung bình theo năm</div>

  return (
    <AdminDataTable
      data={sorted}
      columns={columns}
      emptyLabel="Chưa có dữ liệu"
      manualFiltering
    />
  )
}
