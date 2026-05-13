import { redirect } from "next/navigation";
import { getAdminLoginUrl } from "@/features/auth/admin-bridge";

export default function LoginPage() {
  redirect(getAdminLoginUrl());
}
