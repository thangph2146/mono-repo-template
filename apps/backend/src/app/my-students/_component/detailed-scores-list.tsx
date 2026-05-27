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
import type { DetailedScore } from "@/types/student-scores"
import { formatScore, formatGrade } from "./score-utils"
import { ScrollArea } from "@ui/components/scroll-area"

interface Props {
  scores?: DetailedScore[]
  isLoading: boolean
}

function SubjectTable({ subjects }: { subjects: DetailedScore[] }) {
  const columns = useMemo<ColumnDef<DetailedScore>[]>(
    () => [
      {
        id: "subject",
        header: "Môn học",
        enableColumnFilter: false,
        cell: ({ row }) => (
          <div>
            <div className="text-sm font-medium">{row.original.curriculumName}</div>
            <div className="text-xs text-muted-foreground">{row.original.curriculumID}</div>
          </div>
        ),
      },
      {
        id: "mark10",
        header: () => <div className="w-full text-center">Hệ 10</div>,
        enableColumnFilter: false,
        cell: ({ row }) => {
          const f = formatScore(row.original.mark10, "10")
          return <div className={cn("w-full text-center tabular-nums", f.color)}>{f.text}</div>
        },
      },
      {
        id: "mark4",
        header: () => <div className="w-full text-center">Hệ 4</div>,
        enableColumnFilter: false,
        cell: ({ row }) => {
          const f = formatScore(row.original.mark4, "4")
          return <div className={cn("w-full text-center tabular-nums", f.color)}>{f.text}</div>
        },
      },
      {
        id: "markLetter",
        header: () => <div className="w-full text-center">Điểm chữ</div>,
        enableColumnFilter: false,
        cell: ({ row }) => {
          const g = formatGrade(row.original.markLetter)
          return (
            <div className="flex justify-center">
              <Badge variant="outline" className={cn("px-1.5 py-0", g.color)}>{g.text}</Badge>
            </div>
          )
        },
      },
    ],
    []
  )

  if (!subjects.length)
    return (
      <p className="py-3 text-sm text-muted-foreground">Không có dữ liệu</p>
    )
  return (
    <AdminDataTable
      data={subjects}
      columns={columns}
      emptyLabel="Không có dữ liệu"
      manualFiltering
    />
  )
}

export const DetailedScoresList = ({ scores, isLoading }: Props) => {
  const [filterYear, setFilterYear] = useState("all")
  const [openTerms, setOpenTerms] = useState<Set<string>>(new Set())

  const years = useMemo(
    () =>
      scores
        ? [...new Set(scores.map((s) => s.yearStudy).filter(Boolean))]
            .sort()
            .reverse()
        : [],
    [scores]
  )

  const grouped = useMemo(() => {
    if (!scores) return {}
    const filtered =
      filterYear === "all"
        ? scores
        : scores.filter((s) => s.yearStudy === filterYear)
    const map: Record<string, Record<string, DetailedScore[]>> = {}
    filtered.forEach((s) => {
      const y = s.yearStudy || "Khác"
      const t = s.termID || "Khác"
      ;(map[y] ??= {})[t] ??= []
      map[y][t].push(s)
    })
    return map
  }, [scores, filterYear])

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (!scores?.length) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Chưa có dữ liệu điểm chi tiết
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
            .map(([year, terms]) => (
              <div key={year}>
                <div className="mb-1 text-sm font-semibold text-foreground">
                  Năm học {year}
                </div>
                {Object.entries(terms)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([term, subjects]) => {
                    const key = `${year}-${term}`
                    const toggleTerm = () =>
                      setOpenTerms((prev) => {
                        const next = new Set(prev)
                        if (next.has(key)) {
                          next.delete(key)
                        } else {
                          next.add(key)
                        }
                        return next
                      })
                    return (
                      <Collapsible
                        key={key}
                        open={openTerms.has(key)}
                        onOpenChange={toggleTerm}
                        className="mb-2"
                      >
                        <CollapsibleTrigger
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm",
                            openTerms.has(key)
                              ? "rounded-t-md bg-primary text-primary-foreground"
                              : "hover:bg-muted/80"
                          )}
                        >
                          {openTerms.has(key) ? (
                            <ChevronDown className="size-3.5 shrink-0" />
                          ) : (
                            <ChevronRight className="size-3.5 shrink-0" />
                          )}
                          <span>Học kỳ {term}</span>
                          <Badge
                            variant="secondary"
                            className="ml-auto text-xs"
                          >
                            {subjects.length} môn
                          </Badge>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-1 pt-2">
                          <SubjectTable subjects={subjects} />
                        </CollapsibleContent>
                      </Collapsible>
                    )
                  })}
              </div>
            ))
        )}
      </div>
    </ScrollArea>
  )
}
