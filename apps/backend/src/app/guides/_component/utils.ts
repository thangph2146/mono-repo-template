import { DEFAULT_API_URL } from "@workspace/api-client";
import { readAdminSession } from "@/lib/auth-session";
import type { GuideGroup, GuideStep } from "./types";

export const PAGE_KEY = "huong-dan-su-dung";

/**
 * Parse content JSON từ API về dạng object chuẩn.
 * Dùng type từ @workspace/api-client để đảm bảo consistency.
 */
export function parseContent(raw: unknown): NonNullable<GuideGroup["content"]> {
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return { title: null, description: null, order: 0, steps: [] };
    }
  }
  if (raw == null || typeof raw !== "object") {
    return { title: null, description: null, order: 0, steps: [] };
  }
  const r = raw as Record<string, unknown>;
  return {
    title: typeof r.title === "string" ? r.title : null,
    description: typeof r.description === "string" ? r.description : null,
    order: typeof r.order === "number" ? r.order : 0,
    steps: Array.isArray(r.steps)
      ? (r.steps as Record<string, unknown>[]).map((s, i) => ({
          order: typeof s.order === "number" ? s.order : i + 1,
          title: typeof s.title === "string" ? s.title : "",
          description: typeof s.description === "string" ? s.description : "",
          imageUrl: typeof s.imageUrl === "string" ? s.imageUrl : null,
        }))
      : [],
  };
}

/** Lấy base URL của API từ env hoặc default */
export function apiBase(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/$/, "");
}

/** Tạo headers auth với X-User-Id từ session */
export function authHeaders(): Record<string, string> {
  const uid = readAdminSession()?.id;
  return uid ? { "X-User-Id": String(uid) } : {};
}

/** Upload ảnh lên /admin/uploads */
export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folderPath", "guides");
  const res = await fetch(`${apiBase()}/admin/uploads`, {
    method: "POST",
    headers: authHeaders(),
    body: fd,
  });
  if (!res.ok) throw new Error("Upload thất bại");
  const json = (await res.json()) as { data?: { url?: string } };
  const url = json.data?.url;
  if (!url) throw new Error("Không nhận được URL ảnh");
  return url;
}

/** Sắp xếp groups theo order trong content */
export function sortGroupsByOrder(groups: GuideGroup[]): GuideGroup[] {
  return [...groups].sort(
    (a, b) => (parseContent(a.content).order ?? 0) - (parseContent(b.content).order ?? 0)
  );
}

/** Reorder steps sau khi drag-drop */
export function reorderSteps(steps: GuideStep[]): GuideStep[] {
  return steps.map((s, idx) => ({ ...s, order: idx + 1 }));
}
