"use client"

import { useCallback, useEffect, useState } from "react"
import { LexicalEditor } from "@thangph2146/lexical-editor"
import { Button } from "@ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card"
import { FieldError } from "@ui/components/field"
import { Input } from "@ui/components/input"
import { Textarea } from "@ui/components/textarea"
import { FormFieldCol } from "@ui/components/typing"
import { SelectPicker, TreePicker, TreeMultiSelectPicker, type TreeOption } from "@ui/components/pickers"
import { Switch } from "@ui/components/switch"
import { TypographyH1 } from "@ui/components/typography"
import { Controller, type UseFormReturn } from "react-hook-form"
import { cn } from "@ui/lib/utils"
import {
  ADMIN_PAGE_SUBTITLE_CLASS,
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
} from "@ui/lib/layout-shell"
import {
  ArrowLeft,
  Hash,
  Calendar,
  MapPin,
  Users,
  CheckSquare,
  Monitor,
  FileText,
  Search, Mic,
} from "lucide-react"
import { slugify } from "@workspace/api-client"
import type { EventFormValues, EventFormSpeaker } from "../types"
import { Divider } from "@ui/components/layout"
import { api } from "@/lib/api"

interface LocationOption {
  value: string
  label: string
  address: string
}

export interface EventFormShellProps {
  form: UseFormReturn<EventFormValues>
  onSubmit: (values: EventFormValues) => Promise<void>
  submitting: boolean
  editingId: string | null
  onBack: () => void
  onReset: () => void
}

function useLocationOptions() {
  const [options, setOptions] = useState<LocationOption[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.locations
      .list<{ id: number; name: string | null; address: string | null }>({
        limit: 200,
        status: "active",
      })
      .then((res) => {
        setOptions(
          res.items
            .filter((loc) => loc.name)
            .map((loc) => ({
              value: loc.name!,
              label: loc.address
                ? `${loc.name} — ${loc.address}`
                : loc.name!,
              address: loc.address ?? "",
            }))
        )
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { options, loading }
}

function SpeakerSelector({ form }: { form: EventFormShellProps["form"] }) {
  const [options, setOptions] = useState<TreeOption[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.speakers
      .list<{ id: number; name: string; title: string | null }>({
        limit: 200,
        status: "active",
      })
      .then((res) => {
        setOptions(
          res.items
            .filter((s) => s.name)
            .map((s) => ({
              value: String(s.id),
              label: s.title ? `${s.name} — ${s.title}` : s.name,
            }))
        )
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const optionMap = new Map(options.map((o) => [o.value, o.label]))
  const [uiSpeakers, setUiSpeakers] = useState<EventFormSpeaker[]>(() => (form.watch("speakers") ?? []))

  useEffect(() => {
    const sub = form.watch((values) => {
      const next = values.speakers
      if (next && Array.isArray(next)) {
        setUiSpeakers(next as EventFormSpeaker[])
      }
    })
    return () => sub.unsubscribe()
  }, [form])

  const selectedIds = uiSpeakers.map((s) => String(s.speakerId))

  function updateSpeakers(updated: EventFormSpeaker[]) {
    setUiSpeakers(updated)
    form.setValue("speakers", updated, { shouldDirty: true, shouldTouch: true })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Mic className="size-3.5" />
          Chọn diễn giả tham gia sự kiện
        </p>
        <TreeMultiSelectPicker
          value={selectedIds}
          onChange={(v) => {
            const newIds = Array.isArray(v) ? (v as string[]).map(Number) : []
            const updated = newIds.map((id) => {
              const existing = uiSpeakers.find((s) => s.speakerId === id)
              return existing ?? { speakerId: id, role: "", presentationTitle: "", duration: undefined }
            })
            updateSpeakers(updated)
          }}
          options={options}
          placeholder={loading ? "Đang tải danh sách…" : "Chọn diễn giả…"}
        />
      </div>

      {uiSpeakers.length > 0 && (
        <div className="space-y-3">
          {uiSpeakers.map((s, i) => (
            <div key={s.speakerId} className="space-y-2 rounded-lg border border-border/70 p-3">
              <p className="text-sm font-medium">
                {optionMap.get(String(s.speakerId)) || `Diễn giả #${s.speakerId}`}
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                <Input
                  placeholder="Vai trò (VD: Diễn giả chính)"
                  value={s.role ?? ""}
                  onChange={(e) => {
                    const updated = [...uiSpeakers]
                    updated[i] = { ...updated[i], role: e.target.value }
                    updateSpeakers(updated)
                  }}
                />
                <Input
                  placeholder="Chủ đề trình bày"
                  value={s.presentationTitle ?? ""}
                  onChange={(e) => {
                    const updated = [...uiSpeakers]
                    updated[i] = { ...updated[i], presentationTitle: e.target.value }
                    updateSpeakers(updated)
                  }}
                />
                <Input
                  type="number"
                  min={0}
                  placeholder="Thời lượng (phút)"
                  value={s.duration ?? ""}
                  onChange={(e) => {
                    const v = e.target.value
                    const updated = [...uiSpeakers]
                    updated[i] = { ...updated[i], duration: v ? Number(v) : undefined }
                    updateSpeakers(updated)
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LocationSelector({
  form,
}: {
  form: EventFormShellProps["form"]
}) {
  const { options, loading } = useLocationOptions()

  const handleSelect = useCallback(
    (value: unknown) => {
      if (!value || typeof value !== "string") return
      const loc = options.find((o) => o.value === value)
      if (loc) {
        form.setValue("location", loc.value, { shouldDirty: true })
        form.setValue("address", loc.address, { shouldDirty: true })
      }
    },
    [options, form]
  )

  return (
    <div className="space-y-1">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Search className="size-3.5" />
        Chọn địa điểm có sẵn
      </p>
      <TreePicker
        value=""
        onChange={handleSelect}
        options={options}
        placeholder={
          loading ? "Đang tải danh sách…" : "Chọn địa điểm từ danh sách…"
        }
      />
      <p className="text-[10px] text-muted-foreground/60">
        Hoặc nhập thủ công bên dưới.
      </p>
    </div>
  )
}

export function EventFormShell({
  form,
  onSubmit,
  submitting,
  editingId,
  onBack,
  onReset,
}: EventFormShellProps) {
  const { control } = form

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 gap-2 rounded-lg"
            onClick={onBack}
          >
            <ArrowLeft className="size-4" /> Quay lại
          </Button>
          <div>
            <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
              {editingId ? "Chỉnh sửa sự kiện" : "Thêm sự kiện"}
            </TypographyH1>
            <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
              Quản lý sự kiện check-in.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-lg"
            onClick={onReset}
            disabled={submitting}
          >
            Đặt lại
          </Button>
          <Button
            type="submit"
            form="event-form"
            className="h-10 rounded-lg font-bold"
            disabled={submitting}
          >
            {submitting ? "Đang lưu..." : editingId ? "Cập nhật" : "Lưu"}
          </Button>
        </div>
      </div>

      <form
        id="event-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="my-6 "
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="overflow-visible border border-border/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="size-5 text-primary" /> Nội dung chi tiết
                </CardTitle>
                <CardDescription>
                  Nội dung phong phú cho sự kiện (hỗ trợ rich text).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mx-auto max-w-6xl">
                  <Controller
                    name="content"
                    control={control}
                    render={({ field }) => (
                      <LexicalEditor
                        value={field.value}
                        placeholder="Nhập nội dung chi tiết sự kiện..."
                        onChange={(value) => field.onChange(value)}
                        uploadsContext={undefined}
                        stickyTop={0}
                      />
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border border-border/70 shadow-sm max-h-[calc(100vh-6rem)] overflow-y-auto sticky top-2">
              <Divider label="Thông tin sự kiện" />
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="size-5 text-primary" /> Thông tin sự kiện
                </CardTitle>
                <CardDescription>Thông tin cơ bản của sự kiện.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  name="title"
                  control={control}
                  render={({ field, fieldState }) => (
                    <FormFieldCol label="Tiêu đề sự kiện" required>
                      <Input
                        placeholder="VD: Hội thảo công nghệ 2026"
                        {...field}
                        onChange={(e) => {
                          const { value } = e.target
                          field.onChange(value)
                          if (!editingId) form.setValue("slug", slugify(value))
                        }}
                        className={cn(fieldState.error && "border-destructive")}
                      />
                      {fieldState.error && (
                        <FieldError>{fieldState.error.message}</FieldError>
                      )}
                    </FormFieldCol>
                  )}
                />
                <Controller
                  name="slug"
                  control={control}
                  render={({ field }) => (
                    <FormFieldCol label="Slug">
                      <Input
                        placeholder="hoi-thao-cong-nghe-2026"
                        {...field}
                        onChange={(e) =>
                          field.onChange(slugify(e.target.value))
                        }
                      />
                    </FormFieldCol>
                  )}
                />
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <FormFieldCol label="Mô tả ngắn">
                      <Textarea
                        placeholder="Mô tả ngắn về sự kiện..."
                        {...field}
                      />
                    </FormFieldCol>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    name="startDate"
                    control={control}
                    render={({ field }) => (
                      <FormFieldCol label="Thời gian bắt đầu">
                        <Input type="datetime-local" {...field} />
                      </FormFieldCol>
                    )}
                  />
                  <Controller
                    name="endDate"
                    control={control}
                    render={({ field }) => (
                      <FormFieldCol label="Thời gian kết thúc">
                        <Input type="datetime-local" {...field} />
                      </FormFieldCol>
                    )}
                  />
                </div>
              </CardContent>
              <Divider label="Thông tin check-in" />
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="size-5 text-primary" /> Thông tin check-in
                </CardTitle>
                <CardDescription>
                  Cấu hình thời gian check-in và địa điểm.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    name="checkinStart"
                    control={control}
                    render={({ field }) => (
                      <FormFieldCol label="Check-in bắt đầu">
                        <Input type="datetime-local" {...field} />
                      </FormFieldCol>
                    )}
                  />
                  <Controller
                    name="checkinEnd"
                    control={control}
                    render={({ field }) => (
                      <FormFieldCol label="Check-in kết thúc">
                        <Input type="datetime-local" {...field} />
                      </FormFieldCol>
                    )}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    name="registrationStart"
                    control={control}
                    render={({ field }) => (
                      <FormFieldCol label="Đăng ký từ">
                        <Input type="datetime-local" {...field} />
                      </FormFieldCol>
                    )}
                  />
                  <Controller
                    name="registrationEnd"
                    control={control}
                    render={({ field }) => (
                      <FormFieldCol label="Đăng ký đến">
                        <Input type="datetime-local" {...field} />
                      </FormFieldCol>
                    )}
                  />
                </div>
                <Controller
                  name="organizer"
                  control={control}
                  render={({ field }) => (
                    <FormFieldCol label="Đơn vị tổ chức">
                      <Input placeholder="VD: Trường Đại học ABC" {...field} />
                    </FormFieldCol>
                  )}
                />
                <LocationSelector form={form} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    name="location"
                    control={control}
                    render={({ field }) => (
                      <FormFieldCol label="Địa điểm">
                        <Input placeholder="VD: Hội trường A" {...field} />
                      </FormFieldCol>
                    )}
                  />
                  <Controller
                    name="address"
                    control={control}
                    render={({ field }) => (
                      <FormFieldCol label="Địa chỉ">
                        <Input placeholder="VD: 123 Đường ABC" {...field} />
                      </FormFieldCol>
                    )}
                  />
                </div>
              </CardContent>

              <Divider label="Trạng thái" />
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg text-muted-foreground">
                  <Hash className="size-5" /> Trạng thái
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <FormFieldCol label="Trạng thái">
                      <TreePicker
                        value={String(field.value)}
                        onChange={(v) => field.onChange(v != null ? Number(v) : 1)}
                        options={[
                          { value: "1", label: "Hoạt động" },
                          { value: "0", label: "Khóa" },
                        ]}
                        placeholder="Chọn trạng thái"
                      />
                    </FormFieldCol>
                  )}
                />
              </CardContent>

              <Divider label="Hình thức" />
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Monitor className="size-5 text-primary" /> Hình thức
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Controller
                  name="format"
                  control={control}
                  render={({ field }) => (
                    <FormFieldCol label="Hình thức">
                      <SelectPicker
                        value={String(field.value ?? 0)}
                        onChange={(v) => field.onChange(v != null ? Number(v) : 0)}
                        options={[
                          { value: "0", label: "Offline" },
                          { value: "1", label: "Online" },
                          { value: "2", label: "Hybrid" },
                        ]}
                        placeholder="Chọn hình thức"
                      />
                    </FormFieldCol>
                  )}
                />
                <Controller
                  name="onlineLink"
                  control={control}
                  render={({ field }) => (
                    <FormFieldCol label="Link online">
                      <Input
                        placeholder="https://meet.google.com/..."
                        {...field}
                      />
                    </FormFieldCol>
                  )}
                />
              </CardContent>

              <Divider label="Diễn giả" />
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mic className="size-5 text-primary" /> Diễn giả</CardTitle>
                <CardDescription>Chọn diễn giả tham gia sự kiện.</CardDescription>
              </CardHeader>
              <CardContent>
                <SpeakerSelector form={form} />
              </CardContent>

              <Divider label="Cấu hình" />
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="size-5 text-primary" /> Cấu hình
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Controller
                  name="maxParticipants"
                  control={control}
                  render={({ field }) => (
                    <FormFieldCol label="Số lượng tối đa">
                      <Input type="number" min={0} {...field} />
                    </FormFieldCol>
                  )}
                />
                <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="size-4 text-muted-foreground" />
                    <span className="text-sm">Cho phép check-in</span>
                  </div>
                  <Controller
                    name="allowCheckin"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="size-4 text-muted-foreground" />
                    <span className="text-sm">Cho phép check-out</span>
                  </div>
                  <Controller
                    name="allowCheckout"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="size-4 text-muted-foreground" />
                    <span className="text-sm">Yêu cầu Face ID</span>
                  </div>
                  <Controller
                    name="requireFaceId"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </>
  )
}
