import type {
  ContactRequest,
  CreateContactRequestInput,
  UpdateContactRequestInput,
} from "@workspace/api-client";

export type { ContactRequest, CreateContactRequestInput, UpdateContactRequestInput };

export const CONTACT_REQUEST_STATUSES: ContactRequest["status"][] = [
  "new",
  "in-progress",
  "resolved",
  "archived",
];

export const CONTACT_REQUEST_STATUS_LABELS: Record<ContactRequest["status"], string> = {
  new: "Mới",
  "in-progress": "Đang xử lý",
  resolved: "Đã giải quyết",
  archived: "Đã lưu trữ",
};
