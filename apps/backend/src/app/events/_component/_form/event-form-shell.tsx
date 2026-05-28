"use client"

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
} from "lucide-react"
import { slugify } from "@workspace/api-client"
import type { EventFormValues } from "../types"
import { Divider } from "@ui/components/layout"

export interface EventFormShellProps {
  form: UseFormReturn<EventFormValues>
  onSubmit: (values: EventFormValues) => Promise<void>
  submitting: boolean
  editingId: string | null
  onBack: () => void
  onReset: () => void
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
            <Card className="sticky top-4 border border-border/70 shadow-sm">
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
                      <select
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <option value={1}>Hoạt động</option>
                        <option value={0}>Khóa</option>
                      </select>
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
                      <select
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <option value={0}>Offline</option>
                        <option value={1}>Online</option>
                        <option value={2}>Hybrid</option>
                      </select>
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
                <label className="flex items-center gap-2 text-sm">
                  <Controller
                    name="allowCheckin"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="rounded border-input"
                      />
                    )}
                  />
                  <CheckSquare className="size-4 text-muted-foreground" /> Cho
                  phép check-in
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Controller
                    name="allowCheckout"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="rounded border-input"
                      />
                    )}
                  />
                  <CheckSquare className="size-4 text-muted-foreground" /> Cho
                  phép check-out
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Controller
                    name="requireFaceId"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="rounded border-input"
                      />
                    )}
                  />
                  <CheckSquare className="size-4 text-muted-foreground" /> Yêu
                  cầu Face ID
                </label>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </>
  )
}
