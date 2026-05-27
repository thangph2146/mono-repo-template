"use client"

import { useState } from "react"
import {
  GraduationCap,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BarChart3,
  Star,
  BookCheck,
  Award,
  ScrollText,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@ui/components/button"
import { Input } from "@ui/components/input"
import { Label } from "@ui/components/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@ui/components/dialog"
import { Badge } from "@ui/components/badge"
import { Skeleton } from "@ui/components/skeleton"
import { cn } from "@ui/lib/utils"
import { PageSection } from "@ui/components/layout"
import { TypographyH1 } from "@ui/components/typography"
import {
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
  ADMIN_PAGE_TITLE_ICON_CLASS,
  ADMIN_PAGE_SUBTITLE_CLASS,
} from "@ui/lib/layout-shell"
import { useAuth } from "@/providers/auth-provider"
import { api } from "@/lib/api"
import { StudentScoresSection } from "./_component"
import type {
  DetailedScore,
  YearAverage,
  TermAverage,
  OverallAverage,
} from "@/types/student-scores"

interface ParentStudentRow {
  id: string
  parentId: string
  studentCode: string
  studentName: string | null
  note: string | null
  status: "pending" | "approved" | "rejected"
  reviewedAt: string | null
  createdAt: string
}

const STATUS_CONFIG = {
  pending: {
    label: "Chờ duyệt",
    icon: Clock,
    variant: "secondary" as const,
    className:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400",
  },
  approved: {
    label: "Đã duyệt",
    icon: CheckCircle2,
    variant: "secondary" as const,
    className:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400",
  },
  rejected: {
    label: "Từ chối",
    icon: XCircle,
    variant: "secondary" as const,
    className:
      "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400",
  },
}

const MOCK_DETAILED_SCORES: DetailedScore[] = [
  { studyUnitID: "1", studyUnitAlias: "IT101-01", curriculumID: "IT101", curriculumName: "Nhập môn lập trình", yearStudy: "2024-2025", termID: "1", classStudentID: "C01", classStudentName: "Lớp 01", studyProgramID: "P01", studyProgramName: "Cử nhân CNTT", studyTypeID: "T01", studyTypeName: "Chính quy", mark10: 8.5, mark4: 3.5, markLetter: "A" },
  { studyUnitID: "2", studyUnitAlias: "IT102-01", curriculumID: "IT102", curriculumName: "Cấu trúc dữ liệu & Giải thuật", yearStudy: "2024-2025", termID: "1", classStudentID: "C01", classStudentName: "Lớp 01", studyProgramID: "P01", studyProgramName: "Cử nhân CNTT", studyTypeID: "T01", studyTypeName: "Chính quy", mark10: 7.2, mark4: 2.8, markLetter: "B" },
  { studyUnitID: "3", studyUnitAlias: "MT101-01", curriculumID: "MT101", curriculumName: "Toán cao cấp A1", yearStudy: "2024-2025", termID: "1", classStudentID: "C01", classStudentName: "Lớp 01", studyProgramID: "P01", studyProgramName: "Cử nhân CNTT", studyTypeID: "T01", studyTypeName: "Chính quy", mark10: 5.5, mark4: 2.0, markLetter: "C" },
  { studyUnitID: "4", studyUnitAlias: "EN101-01", curriculumID: "EN101", curriculumName: "Tiếng Anh cơ bản", yearStudy: "2024-2025", termID: "1", classStudentID: "C01", classStudentName: "Lớp 01", studyProgramID: "P01", studyProgramName: "Cử nhân CNTT", studyTypeID: "T01", studyTypeName: "Chính quy", mark10: 9.0, mark4: 3.7, markLetter: "A+" },
  { studyUnitID: "5", studyUnitAlias: "IT201-01", curriculumID: "IT201", curriculumName: "Lập trình hướng đối tượng", yearStudy: "2024-2025", termID: "2", classStudentID: "C01", classStudentName: "Lớp 01", studyProgramID: "P01", studyProgramName: "Cử nhân CNTT", studyTypeID: "T01", studyTypeName: "Chính quy", mark10: 6.8, mark4: 2.5, markLetter: "B-" },
  { studyUnitID: "6", studyUnitAlias: "IT202-01", curriculumID: "IT202", curriculumName: "Cơ sở dữ liệu", yearStudy: "2024-2025", termID: "2", classStudentID: "C01", classStudentName: "Lớp 01", studyProgramID: "P01", studyProgramName: "Cử nhân CNTT", studyTypeID: "T01", studyTypeName: "Chính quy", mark10: 7.8, mark4: 3.0, markLetter: "B+" },
  { studyUnitID: "7", studyUnitAlias: "MT201-01", curriculumID: "MT201", curriculumName: "Toán rời rạc", yearStudy: "2024-2025", termID: "2", classStudentID: "C01", classStudentName: "Lớp 01", studyProgramID: "P01", studyProgramName: "Cử nhân CNTT", studyTypeID: "T01", studyTypeName: "Chính quy", mark10: 4.5, mark4: 1.5, markLetter: "D" },
  { studyUnitID: "8", studyUnitAlias: "IT301-01", curriculumID: "IT301", curriculumName: "Phân tích & Thiết kế hệ thống", yearStudy: "2025-2026", termID: "1", classStudentID: "C02", classStudentName: "Lớp 02", studyProgramID: "P01", studyProgramName: "Cử nhân CNTT", studyTypeID: "T01", studyTypeName: "Chính quy", mark10: 8.0, mark4: 3.2, markLetter: "B+" },
  { studyUnitID: "9", studyUnitAlias: "IT302-01", curriculumID: "IT302", curriculumName: "Mạng máy tính", yearStudy: "2025-2026", termID: "1", classStudentID: "C02", classStudentName: "Lớp 02", studyProgramID: "P01", studyProgramName: "Cử nhân CNTT", studyTypeID: "T01", studyTypeName: "Chính quy", mark10: 7.0, mark4: 2.7, markLetter: "B" },
  { studyUnitID: "10", studyUnitAlias: "IT303-01", curriculumID: "IT303", curriculumName: "Hệ điều hành", yearStudy: "2025-2026", termID: "1", classStudentID: "C02", classStudentName: "Lớp 02", studyProgramID: "P01", studyProgramName: "Cử nhân CNTT", studyTypeID: "T01", studyTypeName: "Chính quy", mark10: 6.0, mark4: 2.2, markLetter: "C-" },
  { studyUnitID: "11", studyUnitAlias: "IT304-01", curriculumID: "IT304", curriculumName: "Công nghệ phần mềm", yearStudy: "2025-2026", termID: "1", classStudentID: "C02", classStudentName: "Lớp 02", studyProgramID: "P01", studyProgramName: "Cử nhân CNTT", studyTypeID: "T01", studyTypeName: "Chính quy", mark10: 8.5, mark4: 3.5, markLetter: "A" },
]

const MOCK_YEAR_AVERAGES: YearAverage[] = [
  { yearStudy: "2024-2025", averageScore10: 7.4, averageScore4: 2.8, averageGatherScore10: 7.4, averageGatherScore4: 2.8, updateDate: "2025-06-15" },
  { yearStudy: "2025-2026", averageScore10: 7.5, averageScore4: 2.9, averageGatherScore10: 7.45, averageGatherScore4: 2.85, updateDate: "2026-01-20" },
]

const MOCK_TERM_AVERAGES: TermAverage[] = [
  { yearStudy: "2024-2025", termID: "1", orderTerm: 1, averageScore10: 7.55, averageScore4: 2.88, averageGatherScore10: 7.55, averageGatherScore4: 2.88, updateDate: "2025-01-15" },
  { yearStudy: "2024-2025", termID: "2", orderTerm: 2, averageScore10: 6.3, averageScore4: 2.33, averageGatherScore10: 7.05, averageGatherScore4: 2.67, updateDate: "2025-06-15" },
  { yearStudy: "2025-2026", termID: "1", orderTerm: 1, averageScore10: 7.5, averageScore4: 2.9, averageGatherScore10: 7.45, averageGatherScore4: 2.85, updateDate: "2026-01-20" },
]

const MOCK_OVERALL_AVERAGE: OverallAverage = {
  averageScore10: 7.45,
  averageScore4: 2.85,
  averageGatherScore10: 7.45,
  averageGatherScore4: 2.85,
  isModified: false,
  updateStaff: null,
  updateDate: "2026-01-20",
}

function DevStudentCard({
  studentCode,
  studentName,
}: {
  studentCode: string
  studentName: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <Card className="relative flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base">{studentName}</CardTitle>
              <CardDescription className="font-mono text-xs">{studentCode}</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
            <CheckCircle2 className="mr-1 size-3" />
            Đã duyệt
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <p className="text-xs text-muted-foreground">Yêu cầu: 15/09/2024</p>
        <div className="mt-3">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setOpen(true)}
          >
            <BarChart3 className="size-3.5" />
            Xem kết quả học tập
          </Button>
          <EnhancedGradeDialog
            studentCode={studentCode}
            studentName={studentName}
            open={open}
            onClose={() => setOpen(false)}
          />
        </div>
      </CardContent>
    </Card>
  )
}

const MOCK_STUDENTS = [
  { code: "SV2024001", name: "Nguyễn Văn An" },
  { code: "SV2024002", name: "Trần Thị Bình" },
  { code: "SV2024003", name: "Lê Hoàng Cường" },
]

function EnhancedGradeDialog({
  studentCode,
  studentName,
  open,
  onClose,
}: {
  studentCode: string
  studentName: string | null
  open: boolean
  onClose: () => void
}) {
  const isDev = process.env.NODE_ENV === "development"
  const {
    data: detailedScores,
    isLoading: isLoadingDetailed,
  } = useQuery<DetailedScore[]>({
    queryKey: ["student-scores", "detailed", studentCode],
    queryFn: async () => {
      if (isDev) return MOCK_DETAILED_SCORES
      const payload = await api.http.get<unknown>(
        `/parent/my-students/scores/detailed/${encodeURIComponent(studentCode)}`
      )
      const envelope = payload as { data?: DetailedScore[] }
      return envelope.data ?? []
    },
    enabled: open,
    staleTime: 5 * 60_000,
    retry: false,
  })

  const {
    data: yearAverages,
    isLoading: isLoadingYear,
  } = useQuery<YearAverage[]>({
    queryKey: ["student-averages", "year", studentCode],
    queryFn: async () => {
      if (isDev) return MOCK_YEAR_AVERAGES
      const payload = await api.http.get<unknown>(
        `/parent/my-students/averages/year/${encodeURIComponent(studentCode)}`
      )
      const envelope = payload as { data?: YearAverage[] }
      return envelope.data ?? []
    },
    enabled: open,
    staleTime: 5 * 60_000,
    retry: false,
  })

  const {
    data: termAverages,
    isLoading: isLoadingTerm,
  } = useQuery<TermAverage[]>({
    queryKey: ["student-averages", "terms", studentCode],
    queryFn: async () => {
      if (isDev) return MOCK_TERM_AVERAGES
      const payload = await api.http.get<unknown>(
        `/parent/my-students/averages/terms/${encodeURIComponent(studentCode)}`
      )
      const envelope = payload as { data?: TermAverage[] }
      return envelope.data ?? []
    },
    enabled: open,
    staleTime: 5 * 60_000,
    retry: false,
  })

  const {
    data: overallAverage,
  } = useQuery<OverallAverage>({
    queryKey: ["student-averages", "overall", studentCode],
    queryFn: async () => {
      if (isDev) return MOCK_OVERALL_AVERAGE
      const payload = await api.http.get<unknown>(
        `/parent/my-students/averages/overall/${encodeURIComponent(studentCode)}`
      )
      const envelope = payload as { data?: OverallAverage }
      return envelope.data ?? ({} as OverallAverage)
    },
    enabled: open,
    staleTime: 5 * 60_000,
    retry: false,
  })

  const resolvedDetailed = isDev ? MOCK_DETAILED_SCORES : detailedScores
  const resolvedYear = isDev ? MOCK_YEAR_AVERAGES : yearAverages
  const resolvedTerm = isDev ? MOCK_TERM_AVERAGES : termAverages
  const resolvedOverall = isDev ? MOCK_OVERALL_AVERAGE : overallAverage

  const overallGpa = resolvedOverall?.averageGatherScore10 ?? resolvedOverall?.averageScore10 ?? resolvedOverall?.averageGatherScore4 ?? resolvedOverall?.averageScore4 ?? null
  const passedSubjects = resolvedDetailed?.filter(
    (s) => s.mark10 != null && s.mark10 >= 5
  ).length ?? null
  const totalSubjects = resolvedDetailed?.length ?? null

  const isTenScale = resolvedOverall?.averageGatherScore10 != null || resolvedOverall?.averageScore10 != null
  const rank = overallGpa != null
    ? isTenScale
      ? overallGpa >= 8.0 ? "Giỏi" : overallGpa >= 6.5 ? "Khá" : overallGpa >= 5.0 ? "Trung bình" : "Yếu"
      : overallGpa >= 3.6 ? "Giỏi" : overallGpa >= 2.5 ? "Khá" : overallGpa >= 2.0 ? "Trung bình" : "Yếu"
    : null

  const statCards = [
    { label: "GPA tổng", value: overallGpa?.toFixed(2) ?? null, icon: Star, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/20", iconBg: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" },
    { label: "Tín chỉ tích lũy", value: null, icon: BookCheck, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/20", iconBg: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
    { label: "Môn đã đạt", value: passedSubjects != null ? `${passedSubjects}/${totalSubjects}` : null, icon: ScrollText, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/20", iconBg: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" },
    { label: "Xếp loại", value: rank, icon: Award, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/20", iconBg: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" },
  ]

  const showStats = overallGpa != null || passedSubjects != null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-7xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Kết quả học tập — <span className="font-bold">{studentName ?? studentCode}</span>
          </DialogTitle>
          {studentName && (
            <DialogDescription className="font-mono text-xs">{studentCode}</DialogDescription>
          )}
        </DialogHeader>

        {showStats && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {statCards.map((s) => {
              const Icon = s.icon
              return (
                <Card key={s.label} size="sm" className={cn("border-0", s.bg)}>
                  <CardHeader className="flex-row items-center gap-2 pb-1">
                    <div className={cn("flex size-6 items-center justify-center rounded", s.iconBg)}>
                      <Icon className="size-3.5" />
                    </div>
                    <CardTitle className="text-xs font-medium text-muted-foreground">{s.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className={cn("text-lg font-bold leading-tight tracking-tight", s.color)}>
                      {s.value ?? "—"}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <StudentScoresSection
          isActive={true}
          studentName={studentName}
          detailedScores={resolvedDetailed}
          isLoadingDetailed={isLoadingDetailed}
          yearAverages={resolvedYear}
          isLoadingYear={isLoadingYear}
          termAverages={resolvedTerm}
          isLoadingTerm={isLoadingTerm}
        />
      </DialogContent>
    </Dialog>
  )
}

function GradePanel({
  studentCode,
  studentName,
}: {
  studentCode: string
  studentName: string | null
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-3">
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        onClick={() => setOpen(true)}
      >
        <BarChart3 className="size-3.5" />
        Xem kết quả học tập
      </Button>
      <EnhancedGradeDialog
        studentCode={studentCode}
        studentName={studentName}
        open={open}
        onClose={() => setOpen(false)}
      />
    </div>
  )
}

function AddStudentDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [studentCode, setStudentCode] = useState("")
  const [studentName, setStudentName] = useState("")
  const [note, setNote] = useState("")
  const [error, setError] = useState("")

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = await api.http.post<unknown>("/parent/my-students", {
        studentCode,
        studentName,
        note,
      })
      const envelope = payload as { success?: boolean; message?: string }
      if (envelope.success === false) throw new Error(envelope.message ?? "Lỗi")
      return payload
    },
    onSuccess: () => {
      setStudentCode("")
      setStudentName("")
      setNote("")
      setError("")
      onSuccess()
      onClose()
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Lỗi hệ thống")
    },
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-5" />
            Thêm liên kết học sinh
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="studentCode">
              Mã sinh viên <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="studentCode"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              placeholder="VD: SV2024001"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="studentName">Họ tên con</Label>
            <Input
              id="studentName"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Nhập họ tên để dễ nhận diện"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">Ghi chú</Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Thông tin thêm cho quản trị viên"
            />
          </div>
          {error && (
            <p className="flex items-center gap-1.5 text-sm text-rose-600">
              <AlertCircle className="size-4" />
              {error}
            </p>
          )}
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
            Yêu cầu sẽ chờ xác nhận từ quản trị viên trước khi hiển thị bảng
            điểm.
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Hủy
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!studentCode.trim() || mutation.isPending}
          >
            {mutation.isPending ? "Đang gửi…" : "Gửi yêu cầu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function MyStudentsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const { data: students, isLoading } = useQuery<ParentStudentRow[]>({
    queryKey: ["parent-students", "my"],
    queryFn: async () => {
      const payload = await api.http.get<unknown>("/parent/my-students")
      const envelope = payload as { data?: ParentStudentRow[] }
      return envelope.data ?? []
    },
    staleTime: 30_000,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.http.delete(`/parent/my-students/${id}`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["parent-students", "my"],
      })
      setConfirmDeleteId(null)
    },
  })

  const displayName = user?.name?.trim() || user?.email || "Phụ huynh"

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
            <GraduationCap
              className={ADMIN_PAGE_TITLE_ICON_CLASS}
              aria-hidden
            />
            Con tôi
          </TypographyH1>
          <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
            Xin chào,{" "}
            <span className="font-semibold text-foreground">{displayName}</span>
            . Quản lý liên kết học sinh và theo dõi kết quả học tập.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="shrink-0 gap-2">
          <Plus className="size-4" />
          Thêm con
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && (!students || students.length === 0) && (
        <Card className="py-10 text-center">
          <CardContent className="flex flex-col items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted/60">
              <GraduationCap className="size-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">Chưa có liên kết học sinh nào</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Nhấn &ldquo;Thêm con&rdquo; để gửi yêu cầu liên kết với mã sinh
                viên.
              </p>
            </div>
            <Button
              onClick={() => setAddOpen(true)}
              size="sm"
              className="mt-1 gap-2"
            >
              <Plus className="size-4" />
              Thêm con
            </Button>
          </CardContent>
        </Card>
      )}

      {process.env.NODE_ENV === "development" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-yellow-400 bg-yellow-50 px-4 py-3 text-sm text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400">
            <BarChart3 className="size-4 shrink-0" />
            <span className="font-medium">Demo danh sách sinh viên</span>
            <span className="text-yellow-600/70">— Dữ liệu mẫu — nhấn &quot;Xem kết quả học tập&quot; để xem bảng điểm 3 tab</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {MOCK_STUDENTS.map((s) => (
              <DevStudentCard key={s.code} studentCode={s.code} studentName={s.name} />
            ))}
          </div>
        </div>
      )}

      {students && students.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {students.map((s) => {
            const cfg = STATUS_CONFIG[s.status]
            const StatusIcon = cfg.icon
            return (
              <Card key={s.id} className="relative flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <GraduationCap className="size-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {s.studentName ?? s.studentCode}
                        </CardTitle>
                        {s.studentName && (
                          <CardDescription className="font-mono text-xs">
                            {s.studentCode}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <Badge className={cfg.className} variant="secondary">
                      <StatusIcon className="mr-1 size-3" />
                      {cfg.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pt-0">
                  {s.note && (
                    <p className="mb-2 text-xs text-muted-foreground">
                      Ghi chú: {s.note}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Yêu cầu:{" "}
                    {new Date(s.createdAt).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>

                  {s.status === "approved" && (
                    <GradePanel
                      studentCode={s.studentCode}
                      studentName={s.studentName ?? null}
                    />
                  )}

                  {s.status === "pending" && (
                    <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
                      <Clock className="size-3.5 shrink-0" />
                      Đang chờ quản trị viên xét duyệt
                    </div>
                  )}

                  {s.status === "rejected" && (
                    <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400">
                      <XCircle className="size-3.5 shrink-0" />
                      Yêu cầu đã bị từ chối
                    </div>
                  )}

                  {(s.status === "pending" || s.status === "rejected") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-rose-600"
                      onClick={() => setConfirmDeleteId(s.id)}
                    >
                      <Trash2 className="size-3.5" />
                      Xóa yêu cầu
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <AddStudentDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() =>
          queryClient.invalidateQueries({ queryKey: ["parent-students", "my"] })
        }
      />

      <Dialog
        open={!!confirmDeleteId}
        onOpenChange={() => setConfirmDeleteId(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa yêu cầu</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn chắc chắn muốn xóa yêu cầu liên kết học sinh này? Thao tác không
            thể hoàn tác.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() =>
                confirmDeleteId && deleteMutation.mutate(confirmDeleteId)
              }
            >
              {deleteMutation.isPending ? "Đang xóa…" : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageSection>
  )
}
