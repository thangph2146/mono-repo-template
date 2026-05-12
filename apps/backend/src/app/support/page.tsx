"use client";

import {
  AlertCircle,
  ExternalLink,
  Headphones,
  Info,
  Loader2,
  RotateCcw,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@ui/components/button";
import {
  DEALER_SUPPORT_META_DESCRIPTION,
  DEALER_SUPPORT_TITLE,
  DEALER_SUPPORT_ZALO,
} from "@workspace/dealer-support";
import { canUserAccess, PERMISSION_CODES } from "@workspace/api-client";
import { useAuth } from "@/providers/auth-provider";
import {
  useDealerSupportAdmin,
  useResetDealerSupport,
  useSaveDealerSupport,
} from "@/hooks/queries";
import { cn } from "@ui/lib/utils";
import { PageSection } from "@ui/components/layout";
import {
  ADMIN_PAGE_SUBTITLE_CLASS,
  ADMIN_PAGE_TITLE_COMPACT_CLASS,
  ADMIN_PAGE_TITLE_ICON_MD_CLASS,
  ADMIN_PAGE_TITLE_ICON_CLASS,
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
} from "@ui/lib/layout-shell";
import {
  DEALER_SUPPORT_ADMIN_FORM_ID,
  DealerSupportEditor,
  DealerSupportPreviewFromForm,
} from "./dealer-support-edit-form";
import { SupportPreviewCards } from "./support-preview-cards";

const STOREFRONT_BASE = (
  process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export default function AdminDealerSupportPage() {
  const { user } = useAuth();
  const canView =
    user != null && canUserAccess(user, PERMISSION_CODES.SUPPORT_READ);
  const canEdit =
    user != null && canUserAccess(user, PERMISSION_CODES.SUPPORT_WRITE);

  const storefrontSupportUrl = `${STOREFRONT_BASE}/support`;
  const zaloOaUrl =
    process.env.NEXT_PUBLIC_ZALO_OA_URL?.trim() || DEALER_SUPPORT_ZALO.oaUrl;

  const adminQ = useDealerSupportAdmin({ enabled: canView });
  const saveMut = useSaveDealerSupport();
  const resetMut = useResetDealerSupport();

  const merged = adminQ.data?.merged ?? null;

  if (!canView) {
    return (
      <PageSection max="full" className="min-w-0 space-y-6">
        <h1 className={ADMIN_PAGE_TITLE_COMPACT_CLASS}>
          <Headphones className={ADMIN_PAGE_TITLE_ICON_MD_CLASS} aria-hidden />
          {DEALER_SUPPORT_TITLE}
        </h1>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div>
              <p className="font-semibold">Không có quyền xem trang này</p>
              <p className="mt-1 text-sm opacity-90">
                Cần quyền{" "}
                <span className="font-mono">{PERMISSION_CODES.SUPPORT_READ}</span>. Liên hệ quản trị
                để được gán quyền hoặc chạy migration / seed mới nhất.
              </p>
            </div>
          </div>
        </div>
      </PageSection>
    );
  }

  const headerTitle = merged?.title ?? "…";
  const headerSubtitle = merged?.subtitle ?? "";

  const onSave = (payload: NonNullable<typeof merged>) => {
    saveMut.mutate(payload, {
      onSuccess: () =>
        toast.success("Đã lưu vào cơ sở dữ liệu. Trang cửa hàng có thể cache vài giây — F5 nếu cần."),
      onError: (e) => toast.error(e.message),
    });
  };

  const onReset = () => {
    resetMut.mutate(undefined, {
      onSuccess: () => {
        toast.success("Đã khôi phục mặc định từ package.");
      },
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <PageSection max="full" className="min-w-0 space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
            <Headphones className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
            {headerTitle}
          </h1>
          <p className={ADMIN_PAGE_SUBTITLE_CLASS}>{headerSubtitle}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Mặc định từ{" "}
            <span className="font-mono text-foreground">@workspace/dealer-support</span>; ghi đè lưu
            trong DB và phục vụ qua{" "}
            <span className="font-mono text-foreground">GET /public/dealer-support</span> (cửa hàng).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && merged ? (
            <>
              <Button
                type="submit"
                form={DEALER_SUPPORT_ADMIN_FORM_ID}
                disabled={saveMut.isPending}
                className="h-12 gap-2 rounded-xl px-5 font-semibold"
              >
                {saveMut.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Save className="size-4 shrink-0" aria-hidden />
                )}
                Lưu
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={resetMut.isPending}
                onClick={() => void onReset()}
                className="h-12 gap-2 rounded-xl px-5 font-semibold"
              >
                {resetMut.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <RotateCcw className="size-4 shrink-0" aria-hidden />
                )}
                Mặc định gói
              </Button>
            </>
          ) : null}
          <a
            href={storefrontSupportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-12 gap-2 rounded-xl px-5 font-semibold",
            )}
          >
            Mở trang cửa hàng
            <ExternalLink className="size-4 shrink-0" aria-hidden />
          </a>
        </div>
      </div>

      <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 shadow-sm">
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span className="text-muted-foreground">
            Trang khách:{" "}
            <span className="font-mono text-foreground">{storefrontSupportUrl}</span>.
            {!canEdit ? (
              <>
                {" "}
                Chỉ xem — cần{" "}
                <span className="font-mono text-foreground">{PERMISSION_CODES.SUPPORT_WRITE}</span>{" "}
                để chỉnh sửa.
              </>
            ) : null}
          </span>
        </p>
      </div>

      {adminQ.isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-hidden />
          Đang tải nội dung…
        </div>
      ) : adminQ.error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-destructive">
          {adminQ.error.message}
        </div>
      ) : null}

      {canEdit && merged ? (
        <DealerSupportEditor
          initialValues={merged}
          isSubmitting={saveMut.isPending}
          onSubmit={(data) => void onSave(data)}
        >
          <p className="text-xs text-muted-foreground">{DEALER_SUPPORT_META_DESCRIPTION}</p>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Xem trước (giống cửa hàng)
            </h2>
            <DealerSupportPreviewFromForm
              zaloOaUrl={zaloOaUrl}
              storefrontBase={STOREFRONT_BASE}
            />
          </div>
        </DealerSupportEditor>
      ) : null}

      {!canEdit && merged ? (
        <>
          <p className="text-xs text-muted-foreground">{DEALER_SUPPORT_META_DESCRIPTION}</p>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Xem trước (giống cửa hàng)
            </h2>
            <SupportPreviewCards
              payload={merged}
              zaloOaUrl={zaloOaUrl}
              storefrontBase={STOREFRONT_BASE}
            />
          </div>
        </>
      ) : null}
    </PageSection>
  );
}
