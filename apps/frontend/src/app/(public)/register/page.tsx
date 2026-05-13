import { redirect } from "next/navigation";
import { getAdminRegisterUrl } from "@/features/auth/admin-bridge";

export default function RegisterPage() {
  redirect(getAdminRegisterUrl());
}
