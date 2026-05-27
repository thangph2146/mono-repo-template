import type { User } from "@workspace/api-client";

export type StaffRow = User;

export interface StaffConfirmAction {
  kind: "delete" | "restore" | "purge";
  row: StaffRow;
}
