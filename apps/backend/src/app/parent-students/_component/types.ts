import type { ParentStudent as ParentStudentAdmin, UpdateParentStudentInput } from "@workspace/api-client";

export type { ParentStudentAdmin as ParentStudent, UpdateParentStudentInput };

export const PARENT_STUDENT_STATUSES: ("pending" | "approved" | "rejected")[] = [
  "pending",
  "approved",
  "rejected",
];

export const PARENT_STUDENT_STATUS_LABELS: Record<"pending" | "approved" | "rejected", string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
};

export const PARENT_STUDENT_STATUS_COLORS: Record<"pending" | "approved" | "rejected", string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400",
  rejected: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400",
};
