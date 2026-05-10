/**
 * Khớp user mặc định trong `apps/api` DatabaseSeeder — chỉ dùng gợi ý đăng nhập khi dev.
 */
export type DevDemoAccount = {
  label: string;
  description: string;
  email: string;
  password: string;
};

export const DEV_DEMO_ACCOUNTS: readonly DevDemoAccount[] = [
  {
    label: "Admin",
    description: "Quản trị (users.manage, đầy đủ menu staff)",
    email: "admin@storesync.local",
    password: "change-me",
  },
  {
    label: "Siêu quản trị",
    description: "super_admin — quyền *",
    email: "super@storesync.local",
    password: "demo",
  },
  {
    label: "Quản lý kho",
    description: "manager",
    email: "manager@storesync.local",
    password: "demo",
  },
  {
    label: "Kinh doanh",
    description: "sales",
    email: "sales@storesync.local",
    password: "demo",
  },
  {
    label: "Đa role",
    description: "sales + customer (demo union quyền)",
    email: "hybrid@storesync.local",
    password: "demo",
  },
  {
    label: "Khách demo",
    description: "customer — quyền hạn hơn",
    email: "khach-demo@storesync.local",
    password: "demo",
  },
] as const;

export function isDevDemoLoginEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}
