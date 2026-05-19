import type { User } from "@/lib/api";

export type StaffRow = User;

export interface StaffConfirmAction {
  kind: "delete" | "restore" | "purge";
  row: User;
}
