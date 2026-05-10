# Store Sync

Monorepo ứng dụng B2B/store: API NestJS (MikroORM), admin Next.js (`apps/backend`), storefront Next.js (`apps/frontend`), gói dùng chung (`packages/*`).

## Yêu cầu môi trường

- **Node.js** ≥ 20 (xem `.nvmrc`)
- **pnpm** 9.x (xem `packageManager` trong `package.json`)

```bash
pnpm install
```

## Cấu trúc thư mục

| Đường dẫn | Mô tả |
|-----------|--------|
| `apps/api` | REST API NestJS, RBAC, MikroORM — cổng mặc định **3002**, prefix `/api` |
| `apps/backend` | Trang quản trị (admin) Next.js — thường **3001** |
| `apps/frontend` | Cửa hàng (storefront) Next.js — thường **3000** |
| `packages/api-client` | SDK HTTP + kiểu dùng cho frontend/backend |
| `packages/ui` | Component UI dùng chung (shadcn) |
| `packages/promo-codes` | Tiện ích mã khuyến mãi |
| `docker-compose.yml` | Postgres + build API/backend/frontend (tuỳ chọn) |

## Biến môi trường

1. Sao chép `apps/api/.env.example` → `apps/api/.env` (và/hoặc `.env` ở **gốc repo**).
2. Nest `ConfigModule` và CLI MikroORM đều đọc **cả hai**; `apps/api/.env` ghi đè biến trùng tên.
3. Ứng dụng Next cần `NEXT_PUBLIC_API_URL` (ví dụ `http://localhost:3002/api`) — xem `apps/backend/.env.example`, `apps/frontend/.env.example`.

Biến quan trọng cho DB:

- `DATABASE_URL` — chuỗi kết nối (PostgreSQL, MySQL, SQLite, …).
- `DB_CLIENT` — tuỳ chọn nếu URL không suy ra được driver.
- `NODE_ENV` — `development` bật log SQL mặc định (có thể tắt bằng `DB_DEBUG=false`).

## Chạy phát triển

```bash
# Toàn bộ app qua Turbo (API + backend + frontend)
pnpm dev
```

Script `predev` có thể giải phóng cổng (xem `package.json`). Giải phóng tay:

```bash
pnpm kill
```

Chạy riêng một package:

```bash
pnpm --filter @api dev
pnpm --filter @backend dev
pnpm --filter @frontend dev
```

## Lệnh cơ sở dữ liệu và migration (MikroORM)

Mọi lệnh CLI MikroORM nên chạy **trong ngữ cảnh package `@api`** để đúng `mikro-orm.config.ts` và `DATABASE_URL`.

### Cách gọi nhanh từ gốc repo

```bash
pnpm db -- <lệnh mikro-orm và tham số>
```

Ví dụ:

```bash
pnpm db -- migration:list
pnpm db -- migration:up
pnpm db -- seeder:run
```

Tương đương:

```bash
pnpm --filter @api exec mikro-orm migration:up
```

### Hai hướng làm schema (cần phân biệt)

| Cách | Lệnh (trong `apps/api` hoặc qua `pnpm db --`) | Khi nào dùng |
|------|-----------------------------------------------|--------------|
| **Schema từ entity** | `schema:fresh --run --seed` (script: `pnpm db:fresh` trong `@api`) | Local: xóa DB, tạo lại bảng theo **entity**, chạy **seeder**. **Không** chạy file migration `.ts` trong `src/migrations/`. |
| **Chuỗi migration** | `migration:up` / `migration:list` / `migration:down` | Môi trường có lịch sử thay đổi qua file migration; CI/production. |

**Lưu ý quan trọng**

- Sau `schema:fresh --seed`, dữ liệu RBAC (roles, permissions) được **bổ sung trong `DatabaseSeeder.ensureRbacBaseline()`**. Nếu chỉ tạo bảng mà không chạy seeder, bảng role có thể trống → đăng nhập không có quyền.
- `migration:fresh --seed` (script `db:migration:fresh`) xóa DB và chạy lại **toàn bộ migration** rồi seed — phù hợp khi bạn duy trì đủ file migration từ đầu project.
- Trên **MySQL**, tránh gom nhiều câu lệnh SQL không tương thích trong một lần `addSql` nếu driver không hỗ trợ multi-statement; trong repo các migration đã tách từng câu khi cần.
- Nếu `migration:fresh` báo **`users` doesn’t exist** ở bước thêm `cartJson`: chuỗi migration đã có bản **`Migration20260508180500`** tạo bảng `users` trước — kéo code mới rồi chạy lại `migration:fresh` (hoặc dùng `pnpm --filter @api run db:fresh` nếu không cần đúng từng file migration).
- Nếu seed báo **`products` doesn’t exist**: chuỗi migration gồm **`Migration20260508204000`** tạo `products` và `orders` (FK `customerId` → `users`) trước khi seeder chèn catalog/đơn mẫu.

### Các lệnh migration thường dùng

```bash
# Liệt kê migration đã/ chưa chạy
pnpm db -- migration:list

# Áp dụng batch migration tiếp theo
pnpm db -- migration:up

# Hoàn tác một bước (cẩn thận dữ liệu)
pnpm db -- migration:down

# Tạo file migration mới từ diff schema (sau khi sửa entity)
pnpm db -- migration:create

# Snapshot / migration khởi tạo (ít dùng khi đã có lịch sử)
pnpm db -- migration:create --initial
```

Sau khi thêm migration mới: commit file trong `apps/api/src/migrations/`, trên môi trường khác chạy `migration:up` (hoặc pipeline deploy tương đương).

### Seeder

```bash
pnpm db -- seeder:run
```

Seeder mặc định: `DatabaseSeeder` (cấu hình trong `mikro-orm.config.ts`). Có thể bật log chi tiết bằng `DB_SEED_VERBOSE=1`.

Tài khoản demo (sau seed): ví dụ `super@storesync.local` / `demo` (siêu quản trị), `admin@storesync.local`, … — xem `apps/api/src/seeders/database.seeder.ts`.

### Schema không qua migration (chỉ dev)

```bash
pnpm --filter @api run db:update    # schema:update --run --safe
pnpm --filter @api run db:create     # schema:create --run
pnpm --filter @api run db:drop       # schema:drop --run
```

Chỉ dùng khi bạn hiểu rõ: có thể lệch so với chuỗi migration trên môi trường khác.

## Docker

```bash
docker compose up -d
```

API mặc định nối Postgres trong compose. Điều chỉnh biến môi trường trong `docker-compose.yml` hoặc file `.env` bên cạnh compose.

## Build production

```bash
pnpm build
```

Từng app có `Dockerfile` riêng (multi-stage) nếu cần đóng gói image.

## Gói `@workspace/api-client`

- Cấu hình `baseUrl` trỏ tới API (có prefix `/api`).
- Admin gửi header `X-User-Id` sau đăng nhập (lấy từ session).
- Ở `NODE_ENV=development` có thể bật log request/response (xem tùy chọn SDK trong code).

## Tài liệu thêm

- Chi tiết env API: `apps/api/.env.example`
- Entity & registry: `apps/api/src/entities/`
- RBAC: `apps/api/src/auth/`, permissions: `apps/api/src/auth/permissions.constants.ts`
