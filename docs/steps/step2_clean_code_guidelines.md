# Step 2: Clean Code Guide Line

Mục tiêu: các nguyên tắc để giữ code sạch, đúng ranh giới, và dễ review trong monorepo.

## Nguyên tắc chung
- Viết code rõ ràng, có tên biến/method mô tả mục đích.
- Tránh thay đổi ngoài phạm vi task; không sửa file unrelated.
- Viết test nhỏ cho logic quan trọng khi có thể.

## Ranh giới service
- Không import trực tiếp giữa `apps/*`.
- Nếu cần chia sẻ logic, đưa vào `packages/*` và cập nhật `WORKSPACE_DEPS.md` bằng `pnpm graphify:ai-summary`.

## Lint / Type / Tests
- Trước khi PR: chạy từ root:

```bash
pnpm check
```

- `pnpm check` = `verify:bounds` + `lint` + `typecheck`.
- Nếu thay đổi nhiều về cấu trúc: chạy `pnpm check:full` sau cập nhật `.graphify` snapshot.

## Commit / PR
- Giữ commit nhỏ, rõ ràng, theo chức năng.
- Mọi PR nên: mô tả ngắn, liệt kê file đã thay đổi, và lệnh reproduce `pnpm check`.

## Khi refactor/di chuyển module
- Cập nhật Graphify snapshot nếu thay đổi file/route/module đáng kể:

```bash
node apps/<app>/.graphify/update.cjs
pnpm graphify:ai-summary
pnpm check:full
```

## Kiểm tra boundary và phụ thuộc
- Kiểm tra `packages/eslint-config/service-boundaries.js` trước khi thêm import mới.
- Dùng `pnpm verify:bounds` để phát hiện import cấm.

## Ghi chú cho agents / reviewers
- Trước khi sửa: xác định scope, đọc `docs/hub-parent/PRE_CODE_PROTOCOL.md`.
- Triệt để chạy `pnpm check` và sửa theo lỗi lint/type.
- Nếu không tìm thấy docs feature: báo và tiếp tục bằng Graphify → source.

----
File này là checklist nhanh; chỉnh sửa khi cần phù hợp quy trình team.
