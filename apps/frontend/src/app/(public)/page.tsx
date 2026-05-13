import type { Metadata } from "next";
import { HomeClient } from "@/features/pages/home-page";  

export const metadata: Metadata = {
  title: { absolute: "HUB" },
  description:
    "Hệ thống kết nối phụ huynh và nhà trường của Trường Đại học Ngân hàng TP.HCM.",
};

export default function PublicHomePage() {
  return <HomeClient />;
}
