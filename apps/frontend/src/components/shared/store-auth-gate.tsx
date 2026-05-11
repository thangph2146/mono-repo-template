"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useClientReady } from "@/hooks/use-client-ready";
import { isStoreAuthPath, safeRelativeNext } from "@/lib/auth-routes";

function AuthRoutePlaceholder({ message }: { message: string }) {
  return (
    <div className="flex min-h-[min(70vh,calc(100vh-12rem))] w-full flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="size-10 animate-spin text-primary" aria-hidden />
      <p className="text-sm">{message}</p>
    </div>
  );
}

/**
 * Chặn người đã đăng nhập quay lại /login hoặc /register (kể cả nút Back / gõ URL).
 * Giữ tham số `next` hợp lệ khi rời /login.
 */
export function StoreAuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const clientReady = useClientReady();
  const onAuthRoute = isStoreAuthPath(pathname);

  useEffect(() => {
    if (!clientReady || !onAuthRoute || !session) return;
    const raw =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("next")
        : null;
    router.replace(safeRelativeNext(raw));
  }, [clientReady, onAuthRoute, session, router]);

  if (!onAuthRoute) {
    return <>{children}</>;
  }

  if (!clientReady) {
    return <AuthRoutePlaceholder message="Đang tải…" />;
  }

  if (session) {
    return <AuthRoutePlaceholder message="Đang chuyển vào hệ thống…" />;
  }

  return <>{children}</>;
}
