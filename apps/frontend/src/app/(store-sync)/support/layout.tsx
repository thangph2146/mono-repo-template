import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DEALER_SUPPORT_META_DESCRIPTION, DEALER_SUPPORT_TITLE } from "@workspace/dealer-support";

export const metadata: Metadata = {
  title: DEALER_SUPPORT_TITLE,
  description: DEALER_SUPPORT_META_DESCRIPTION,
};

export default function SupportLayout({ children }: { children: ReactNode }) {
  return children;
}
