"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { DEFAULT_API_URL } from "@workspace/api-client";

function publicApiBase() {
  return (process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/$/, "");
}

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string | null;
};

export function PublicPostViewBadge({
  slug,
  initialCount,
}: {
  slug: string;
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    let cancelled = false;
    const url = `${publicApiBase()}/public/posts/${encodeURIComponent(slug)}/view`;

    void (async () => {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { Accept: "application/json" },
        });
        const payload = (await res.json().catch(() => null)) as ApiEnvelope<{
          viewCount: number;
        }> | null;
        if (
          cancelled ||
          !res.ok ||
          !payload?.success ||
          typeof payload.data?.viewCount !== "number"
        ) {
          return;
        }
        setCount(payload.data.viewCount);
      } catch {
        // Giữ initialCount khi lỗi mạng
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Eye className="size-3.5" />
      {count} lượt xem
    </span>
  );
}
