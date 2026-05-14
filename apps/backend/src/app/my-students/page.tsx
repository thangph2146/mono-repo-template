"use client"

import { useState } from "react"
import {
  GraduationCap,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  BookOpen,
  AlertCircle,
  RefreshCw,
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
import { PageSection } from "@ui/components/layout"
import { TypographyH1 } from "@ui/components/typography"
import {
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
  ADMIN_PAGE_TITLE_ICON_CLASS,
  ADMIN_PAGE_SUBTITLE_CLASS,
} from "@ui/lib/layout-shell"
import { useAuth } from "@/providers/auth-provider"
import { api } from "@/lib/api"

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

interface GradeSubject {
  subjectCode: string
  subjectName: string
  credits: number
  scoreProcess?: number | null
  scoreMidterm?: number | null
  scoreFinal?: number | null
  scoreAvg?: number | null
  scoreText?: string | null
  passed?: boolean | null
}

interface GradeSemester {
  semesterCode: string
  semesterName: string
  gpa?: number | null
  subjects: GradeSubject[]
}

interface GradeResult {
  studentCode: string
  studentName?: string
  semesters: GradeSemester[]
  gpaOverall?: number | null
  totalCredits?: number | null
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

function scoreColor(score: number | null | undefined): string {
  if (score == null) return "text-muted-foreground"
  if (score >= 8.5)
    return "text-emerald-600 dark:text-emerald-400 font-semibold"
  if (score >= 7.0) return "text-blue-600 dark:text-blue-400 font-semibold"
  if (score >= 5.0) return "text-amber-600 dark:text-amber-400"
  return "text-rose-600 dark:text-rose-400 font-semibold"
}

function ScoreCell({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-muted-foreground">—</span>
  return <span className={scoreColor(value)}>{value.toFixed(1)}</span>
}

function normalizeGradeResult(raw: unknown): GradeResult {
  if (!raw || typeof raw !== "object") return { studentCode: "", semesters: [] }
  const r = raw as Record<string, unknown>

  const semesters: GradeSemester[] = []
  const rawSemesters = Array.isArray(r.semesters)
    ? r.semesters
    : Array.isArray(r.data)
      ? r.data
      : []

  for (const sem of rawSemesters as Record<string, unknown>[]) {
    const subjects: GradeSubject[] = []
    const rawSubjects = Array.isArray(sem.subjects)
      ? sem.subjects
      : Array.isArray(sem.scores)
        ? sem.scores
        : []
    for (const sub of rawSubjects as Record<string, unknown>[]) {
      subjects.push({
        subjectCode: String(sub.subjectCode ?? sub.code ?? sub.maMonHoc ?? ""),
        subjectName: String(sub.subjectName ?? sub.name ?? sub.tenMonHoc ?? ""),
        credits: Number(sub.credits ?? sub.tinChi ?? 0),
        scoreProcess:
          sub.scoreProcess != null
            ? Number(sub.scoreProcess)
            : sub.diemQT != null
              ? Number(sub.diemQT)
              : null,
        scoreMidterm:
          sub.scoreMidterm != null
            ? Number(sub.scoreMidterm)
            : sub.diemGK != null
              ? Number(sub.diemGK)
              : null,
        scoreFinal:
          sub.scoreFinal != null
            ? Number(sub.scoreFinal)
            : sub.diemCK != null
              ? Number(sub.diemCK)
              : null,
        scoreAvg:
          sub.scoreAvg != null
            ? Number(sub.scoreAvg)
            : sub.diemTB != null
              ? Number(sub.diemTB)
              : null,
        scoreText:
          sub.scoreText != null
            ? String(sub.scoreText)
            : sub.diemChu != null
              ? String(sub.diemChu)
              : null,
        passed:
          sub.passed != null
            ? Boolean(sub.passed)
            : sub.ketQua != null
              ? sub.ketQua === "Đạt" || sub.ketQua === true
              : null,
      })
    }
    semesters.push({
      semesterCode: String(sem.semesterCode ?? sem.code ?? sem.maHocKy ?? ""),
      semesterName: String(sem.semesterName ?? sem.name ?? sem.tenHocKy ?? ""),
      gpa:
        sem.gpa != null
          ? Number(sem.gpa)
          : sem.diemTBHocKy != null
            ? Number(sem.diemTBHocKy)
            : null,
      subjects,
    })
  }

  return {
    studentCode: String(r.studentCode ?? r.maSinhVien ?? ""),
    studentName:
      r.studentName != null
        ? String(r.studentName)
        : r.hoTen != null
          ? String(r.hoTen)
          : undefined,
    semesters,
    gpaOverall:
      r.gpaOverall != null
        ? Number(r.gpaOverall)
        : r.diemTBTichLuy != null
          ? Number(r.diemTBTichLuy)
          : null,
    totalCredits:
      r.totalCredits != null
        ? Number(r.totalCredits)
        : r.tongTinChi != null
          ? Number(r.tongTinChi)
          : null,
  }
}

function GradeDialog({
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
  const { data, isLoading, isError, refetch } = useQuery<GradeResult>({
    queryKey: ["grades", studentCode],
    queryFn: async () => {
      const payload = await api.http.get<unknown>(
        `/parent/my-students/grades/${encodeURIComponent(studentCode)}`
      )
      const envelope = payload as { data?: unknown }
      return normalizeGradeResult(envelope.data)
    },
    enabled: open,
    staleTime: 5 * 60_000,
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-7xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="size-5" />
            Bảng điểm — {studentName ?? studentCode}
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {studentName ? studentCode : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading && (
            <div className="space-y-3 py-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          )}

          {isError && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-600 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400">
              <AlertCircle className="size-4 shrink-0" />
              Không thể tải bảng điểm. Hệ thống điểm ngoài có thể chưa cấu hình.
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-7 px-2 text-xs"
                onClick={() => refetch()}
              >
                <RefreshCw className="size-3.5" />
                Thử lại
              </Button>
            </div>
          )}

          {data && (
            <div className="space-y-4">
              {data.gpaOverall != null && (
                <div className="flex flex-wrap gap-3">
                  <div className="rounded-lg border bg-muted/40 px-3 py-1.5 text-sm">
                    GPA tổng:{" "}
                    <span className={scoreColor(data.gpaOverall)}>
                      {data.gpaOverall.toFixed(2)}
                    </span>
                  </div>
                  {data.totalCredits != null && (
                    <div className="rounded-lg border bg-muted/40 px-3 py-1.5 text-sm">
                      Tổng tín chỉ:{" "}
                      <span className="font-semibold">{data.totalCredits}</span>
                    </div>
                  )}
                </div>
              )}

              {data.semesters.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Chưa có dữ liệu điểm.
                </p>
              )}

              {data.semesters.map((sem) => (
                <div
                  key={sem.semesterCode}
                  className="overflow-hidden rounded-lg border"
                >
                  <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2">
                    <span className="text-sm font-semibold">
                      {sem.semesterName}
                    </span>
                    {sem.gpa != null && (
                      <span className="text-sm">
                        GPA học kỳ:{" "}
                        <span className={scoreColor(sem.gpa)}>
                          {sem.gpa.toFixed(2)}
                        </span>
                      </span>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/20 text-xs text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">
                            Môn học
                          </th>
                          <th className="px-3 py-2 text-center font-medium">
                            TC
                          </th>
                          <th className="px-3 py-2 text-center font-medium">
                            QT
                          </th>
                          <th className="px-3 py-2 text-center font-medium">
                            GK
                          </th>
                          <th className="px-3 py-2 text-center font-medium">
                            CK
                          </th>
                          <th className="px-3 py-2 text-center font-medium">
                            TB
                          </th>
                          <th className="px-3 py-2 text-center font-medium">
                            Chữ
                          </th>
                          <th className="px-3 py-2 text-center font-medium">
                            KQ
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {sem.subjects.map((sub) => (
                          <tr
                            key={sub.subjectCode}
                            className="hover:bg-muted/20"
                          >
                            <td className="px-3 py-2">
                              <div className="font-medium">
                                {sub.subjectName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {sub.subjectCode}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center tabular-nums">
                              {sub.credits}
                            </td>
                            <td className="px-3 py-2 text-center tabular-nums">
                              <ScoreCell value={sub.scoreProcess} />
                            </td>
                            <td className="px-3 py-2 text-center tabular-nums">
                              <ScoreCell value={sub.scoreMidterm} />
                            </td>
                            <td className="px-3 py-2 text-center tabular-nums">
                              <ScoreCell value={sub.scoreFinal} />
                            </td>
                            <td className="px-3 py-2 text-center tabular-nums">
                              <ScoreCell value={sub.scoreAvg} />
                            </td>
                            <td className="px-3 py-2 text-center font-medium">
                              {sub.scoreText ?? "—"}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {sub.passed == null ? (
                                <span className="text-muted-foreground">—</span>
                              ) : sub.passed ? (
                                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                  Đạt
                                </span>
                              ) : (
                                <span className="font-medium text-rose-600 dark:text-rose-400">
                                  Rớt
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
        <BookOpen className="size-3.5" />
        Xem bảng điểm
      </Button>
      <GradeDialog
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
