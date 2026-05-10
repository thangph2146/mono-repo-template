import { Loader2 } from "lucide-react";
import { Page, PageContent } from "@ui/components/layout";

type RouteLoadingProps = {
  label?: string;
};

export function RouteLoading({ label = "Đang tải…" }: RouteLoadingProps) {
  return (
    <Page>
      <PageContent className="flex min-h-[min(70vh,32rem)] flex-col items-center justify-center gap-3 px-4 py-16">
        <Loader2
          className="h-10 w-10 animate-spin text-primary"
          aria-hidden
        />
        <p className="text-sm text-muted-foreground">{label}</p>
      </PageContent>
    </Page>
  );
}
