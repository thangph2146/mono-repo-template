import type { ReactNode } from "react";
import { StoreAuthGate } from "@/components/shared/store-auth-gate";

/** Nhóm route storefront (URL không đổi). Metadata từng trang: file `layout.tsx` con + template ở root. */
export default function StoreSyncLayout({ children }: { children: ReactNode }) {
  return <StoreAuthGate>{children}</StoreAuthGate>;
}
