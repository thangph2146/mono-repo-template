"use client"

import { useMemo, useState } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { Loader2, ChevronDown, ChevronRight } from "lucide-react"
import { Badge } from "@ui/components/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@ui/components/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select"
import { cn } from "@ui/lib/utils"
import { AdminDataTable } from "@/components/admin-data-table"
import type { TermAverage } from "@/types/student-scores"
import { formatScore } from "./score-utils"
import { ScrollArea } from "@ui/components/scroll-area"

interface Props {
  averages?: TermAverage[]
  isLoading: boolean
}

function TermTable({ items }: { items: TermAverage[] }) {
  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => (a.termID || "").localeCompare(b.termID || "")),
    [items]
  )

  const columns = useMemo<ColumnDef<TermAverage>[]>(
    () => [
      {
        id: "term",
        header: "Học kỳ",
        enableColumnFilter: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-xs">
              {row.original.termID}
            </Badge>
            {row.original.orderTerm && (
              <span className="text-xs text-muted-foreground">
                HK{row.original.orderTerm}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "averageScore10",
        header: () => <div className="w-full text-center">Hệ 10</div>,
        enableColumnFilter: false,
        cell: ({ row }) => {
          const f = formatScore(row.original.averageScore10, "10")
          return (
            <div className={cn("w-full text-center tabular-nums", f.color)}>
              {f.text}
            </div>
          )
        },
      },
      {
        id: "averageScore4",
        header: () => <div className="w-full text-center">Hệ 4</div>,
        enableColumnFilter: false,
        cell: ({ row }) => {
          const f = formatScore(row.original.averageScore4, "4")
          return (
            <div className={cn("w-full text-center tabular-nums", f.color)}>
              {f.text}
            </div>
          )
        },
      },
      {
        id: "averageGatherScore10",
        header: () => <div className="w-full text-center">Tích lũy hệ 10</div>,
        enableColumnFilter: false,
        cell: ({ row }) => {
          const f = formatScore(row.original.averageGatherScore10, "10")
          return (
            <div className={cn("w-full text-center tabular-nums", f.color)}>
              {f.text}
            </div>
          )
        },
      },
      {
        id: "averageGatherScore4",
        header: () => <div className="w-full text-center">Tích lũy hệ 4</div>,
        enableColumnFilter: false,
        cell: ({ row }) => {
          const f = formatScore(row.original.averageGatherScore4, "4")
          return (
            <div className={cn("w-full text-center tabular-nums", f.color)}>
              {f.text}
            </div>
          )
        },
      },
    ],
    []
  )

  if (!items.length)
    return (
      <p className="py-3 text-sm text-muted-foreground">Không có dữ liệu</p>
    )
  return (
    <AdminDataTable
      data={sorted}
      columns={columns}
      emptyLabel="Không có dữ liệu"
      manualFiltering
    />
  )
}

export const TermAveragesList = ({ averages, isLoading }: Props) => {
  const [filterYear, setFilterYear] = useState("all")
  const [openYears, setOpenYears] = useState<Set<string>>(new Set())

  const years = useMemo(
    () =>
      averages
        ? [...new Set(averages.map((a) => a.yearStudy).filter(Boolean))]
            .sort()
            .reverse()
        : [],
    [averages]
  )

  const grouped = useMemo(() => {
    if (!averages) return {}
    const f =
      filterYear === "all"
        ? averages
        : averages.filter((a) => a.yearStudy === filterYear)
    const map: Record<string, TermAverage[]> = {}
    f.forEach((a) => {
      const y = a.yearStudy || "Khác"
      ;(map[y] ??= []).push(a)
    })
    return map
  }, [averages, filterYear])

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (!averages?.length) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Chưa có dữ liệu điểm trung bình theo học kỳ
      </div>
    )
  }

  return (
    <ScrollArea className="max-h-[50vh] space-y-3 overflow-y-auto">
      <div className="space-y-3">
        <Select
          value={filterYear}
          onValueChange={(v) => setFilterYear(v ?? "all")}
        >
          <SelectTrigger className="w-44">
            <SelectValue>
              {filterYear === "all" ? "Tất cả năm học" : filterYear}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả năm học</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {Object.keys(grouped).length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Không tìm thấy dữ liệu
          </div>
        ) : (
          Object.entries(grouped)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([year, items]) => {
              const toggleYear = () =>
                setOpenYears((prev) => {
                  const next = new Set(prev)
                  if (next.has(year)) {
                    next.delete(year)
                  } else {
                    next.add(year)
                  }
                  return next
                })
              return (
                <Collapsible
                  key={year}
                  open={openYears.has(year)}
                  onOpenChange={toggleYear}
                >
                  <CollapsibleTrigger
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm",
                      openYears.has(year)
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted/80"
                    )}
                  >
                    {openYears.has(year) ? (
                      <ChevronDown className="size-3.5 shrink-0" />
                    ) : (
                      <ChevronRight className="size-3.5 shrink-0" />
                    )}
                    <span className="font-medium">Năm học {year}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {items.length} học kỳ
                    </Badge>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-1 pt-2">
                    <TermTable items={items} />
                  </CollapsibleContent>
                </Collapsible>
              )
            })
        )}
      </div>
    </ScrollArea>
  )
}
