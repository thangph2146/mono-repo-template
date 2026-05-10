import { redirect } from "next/navigation";

/** Đường dẫn cũ — chuyển hẳn sang đơn hàng. */
export default function DashboardPage() {
  redirect("/orders");
}
