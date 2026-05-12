"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, type ReactNode } from "react";
import {
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
  type Resolver,
} from "react-hook-form";
import { z } from "zod";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@ui/components/field";
import { Input } from "@ui/components/input";
import { Textarea } from "@ui/components/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import type { DealerSupportPublicPayload } from "@workspace/api-client";
import { SupportPreviewCards } from "./support-preview-cards";

export const DEALER_SUPPORT_ADMIN_FORM_ID = "dealer-support-admin-form";

const s = (max: number) => z.string().max(max, `Tối đa ${max} ký tự`);

const dealerSupportFormSchema = z.object({
  title: s(500),
  subtitle: s(4000),
  hotline: z.object({
    display: s(4000),
    telHref: s(4000),
    cardTitle: s(500),
    cardDescription: s(2000),
    hoursLine: s(1000),
    ctaLabel: s(200),
  }),
  zalo: z.object({
    cardTitle: s(500),
    cardDescription: s(2000),
    handleLine: s(500),
    responseNote: s(2000),
    ctaLabel: s(200),
    oaUrl: s(4000),
  }),
  accountManager: z.object({
    sectionTitle: s(500),
    leadLine: s(2000),
    namePlaceholder: s(500),
    regionLine: s(1000),
    directPhoneLabel: s(200),
    directPhoneDisplay: s(200),
    directTelHref: s(4000),
    helpCtaLabel: s(200),
    helpHrefPath: s(500),
  }),
});

export type DealerSupportFormValues = z.infer<typeof dealerSupportFormSchema>;

function DealerSupportFormFields({ disabled }: { disabled?: boolean }) {
  const {
    register,
    formState: { errors },
  } = useFormContext<DealerSupportFormValues>();

  return (
    <Tabs defaultValue="intro" className="gap-4">
      <TabsList
        variant="line"
      >
        <TabsTrigger value="intro" className="justify-center py-2.5 sm:py-1.5">
          Đầu trang
        </TabsTrigger>
        <TabsTrigger value="channels" className="justify-center py-2.5 sm:py-1.5">
          Tổng đài & Zalo
        </TabsTrigger>
        <TabsTrigger value="account" className="justify-center py-2.5 sm:py-1.5">
          Kinh doanh khu vực
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value="intro"
        className="max-h-[min(70vh,720px)] overflow-y-auto rounded-xl border border-outline-variant/60 bg-muted/10 p-4 sm:p-5"
      >
        <FieldSet className="min-w-0 border-0 p-0 shadow-none">
          <FieldLegend>Thông tin đầu trang</FieldLegend>
          <FieldGroup>
            <Field data-invalid={!!errors.title}>
              <FieldLabel htmlFor="ds-title">Tiêu đề</FieldLabel>
              <Input id="ds-title" disabled={disabled} {...register("title")} />
              <FieldError errors={[errors.title]} />
            </Field>
            <Field data-invalid={!!errors.subtitle}>
              <FieldLabel htmlFor="ds-sub">Mô tả ngắn (dưới tiêu đề)</FieldLabel>
              <Textarea id="ds-sub" rows={3} disabled={disabled} {...register("subtitle")} />
              <FieldError errors={[errors.subtitle]} />
            </Field>
          </FieldGroup>
        </FieldSet>
      </TabsContent>

      <TabsContent
        value="channels"
        className="max-h-[min(70vh,720px)] space-y-8 overflow-y-auto rounded-xl border border-outline-variant/60 bg-muted/10 p-4 sm:p-5"
      >
        <FieldSet className="min-w-0 border-0 p-0 shadow-none">
          <FieldLegend>Tổng đài</FieldLegend>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["display", "Số hiển thị"],
                ["telHref", "Liên kết tel:"],
                ["cardTitle", "Tiêu đề thẻ"],
                ["cardDescription", "Mô tả thẻ"],
                ["hoursLine", "Giờ làm việc"],
                ["ctaLabel", "Nút CTA"],
              ] as const
            ).map(([key, label]) => {
              const fieldErr = errors.hotline?.[key];
              return (
                <Field key={key} data-invalid={!!fieldErr}>
                  <FieldLabel htmlFor={`h-${key}`}>{label}</FieldLabel>
                  <Input id={`h-${key}`} disabled={disabled} {...register(`hotline.${key}`)} />
                  <FieldError errors={[fieldErr]} />
                </Field>
              );
            })}
          </FieldGroup>
        </FieldSet>

        <FieldSet className="min-w-0 border-0 p-0 shadow-none">
          <FieldLegend>Zalo OA</FieldLegend>
          <FieldDescription className="mb-2 max-w-prose">
            URL mở Zalo trên cửa hàng lấy từ biến môi trường{" "}
            <span className="font-mono text-foreground">NEXT_PUBLIC_ZALO_OA_URL</span> nếu có; không
            thì dùng trường <span className="font-mono text-foreground">oaUrl</span> bên dưới.
          </FieldDescription>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["cardTitle", "Tiêu đề thẻ"],
                ["cardDescription", "Mô tả thẻ"],
                ["handleLine", "Dòng OA"],
                ["responseNote", "Ghi chú phản hồi"],
                ["ctaLabel", "Nút CTA"],
                ["oaUrl", "URL OA (fallback)"],
              ] as const
            ).map(([key, label]) => {
              const fieldErr = errors.zalo?.[key];
              return (
                <Field key={key} data-invalid={!!fieldErr}>
                  <FieldLabel htmlFor={`z-${key}`}>{label}</FieldLabel>
                  <Input id={`z-${key}`} disabled={disabled} {...register(`zalo.${key}`)} />
                  <FieldError errors={[fieldErr]} />
                </Field>
              );
            })}
          </FieldGroup>
        </FieldSet>
      </TabsContent>

      <TabsContent
        value="account"
        className="max-h-[min(70vh,720px)] overflow-y-auto rounded-xl border border-outline-variant/60 bg-muted/10 p-4 sm:p-5"
      >
        <FieldSet className="min-w-0 border-0 p-0 shadow-none">
          <FieldLegend>Kinh doanh khu vực</FieldLegend>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["sectionTitle", "Tiêu đề mục"],
                ["leadLine", "Đoạn dẫn"],
                ["namePlaceholder", "Placeholder tên NV"],
                ["regionLine", "Dòng khu vực"],
                ["directPhoneLabel", "Nhãn đường dây nóng"],
                ["directPhoneDisplay", "Số hiển thị"],
                ["directTelHref", "Liên kết tel:"],
                ["helpCtaLabel", "Nút FAQ"],
                ["helpHrefPath", "Đường dẫn FAQ"],
              ] as const
            ).map(([key, label]) => {
              const fieldErr = errors.accountManager?.[key];
              return (
                <Field key={key} data-invalid={!!fieldErr}>
                  <FieldLabel htmlFor={`a-${key}`}>{label}</FieldLabel>
                  <Input id={`a-${key}`} disabled={disabled} {...register(`accountManager.${key}`)} />
                  <FieldError errors={[fieldErr]} />
                </Field>
              );
            })}
          </FieldGroup>
        </FieldSet>
      </TabsContent>
    </Tabs>
  );
}

export function DealerSupportPreviewFromForm(props: {
  zaloOaUrl: string;
  storefrontBase: string;
}) {
  const { control, getValues } = useFormContext<DealerSupportFormValues>();
  const watched = useWatch({ control });
  const values = (watched ?? getValues()) as DealerSupportPublicPayload;
  return (
    <SupportPreviewCards
      payload={values}
      zaloOaUrl={props.zaloOaUrl}
      storefrontBase={props.storefrontBase}
    />
  );
}

export function DealerSupportEditor(props: {
  initialValues: DealerSupportPublicPayload;
  disabled?: boolean;
  isSubmitting?: boolean;
  onSubmit: (data: DealerSupportPublicPayload) => void;
  children?: ReactNode;
}) {
  const form = useForm<DealerSupportFormValues>({
    resolver: zodResolver(dealerSupportFormSchema) as Resolver<DealerSupportFormValues>,
    defaultValues: props.initialValues,
    mode: "onBlur",
  });

  const lastInitialJsonRef = useRef<string | null>(null);
  useEffect(() => {
    const json = JSON.stringify(props.initialValues);
    if (lastInitialJsonRef.current === json) {
      return;
    }
    lastInitialJsonRef.current = json;
    form.reset(props.initialValues);
  }, [props.initialValues, form]);

  return (
    <FormProvider {...form}>
      <form
        id={DEALER_SUPPORT_ADMIN_FORM_ID}
        className="space-y-6 rounded-2xl border border-outline-variant bg-card p-4 shadow-sm sm:p-6"
        onSubmit={form.handleSubmit((data) => props.onSubmit(data as DealerSupportPublicPayload))}
        noValidate
      >
        <DealerSupportFormFields disabled={props.disabled || props.isSubmitting} />
      </form>
      {props.children ? (
        <div className="mt-8 space-y-4 border-t border-outline-variant/40 pt-8">{props.children}</div>
      ) : null}
    </FormProvider>
  );
}
