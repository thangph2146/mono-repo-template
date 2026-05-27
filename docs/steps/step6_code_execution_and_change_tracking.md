# Step 6: Code Execution and Change Tracking

Đây là bước thực thi thay đổi code và ghi nhớ các thay đổi của hệ thống hiện tại.

## Mục tiêu
- Kiểm tra thay đổi code bằng các công cụ chuẩn.
- Ghi lại các file đã thay đổi và scope ảnh hưởng.
- Cập nhật Graphify nếu cần.

## Trước khi thực thi
1. Xác nhận scope thay đổi: `apps/frontend`, `apps/backend`, `apps/api`, hoặc `packages/*`.
2. Thống kê file thay đổi chính bằng `git status --short`.
3. Ghi lại các điểm thay đổi quan trọng:
   - module mới / route mới
   - import mới giữa service
   - package workspace mới

## Các lệnh kiểm tra
1. Chạy từ root repo:

```bash
pnpm check
```

2. Nếu thay đổi cấu trúc module/route đáng kể, chạy:

```bash
node scripts/graphify-update.cjs apps/<app>
pnpm graphify:ai-summary
pnpm check:full
```

3. Nếu chỉ thay đổi package workspace hoặc docs, `pnpm check` vẫn là tối thiểu.

## Ghi nhớ thay đổi
- Nếu thay đổi liên quan `apps/api`, kiểm tra import mới có vi phạm boundary không.
- Nếu thay đổi liên quan `apps/frontend` hoặc `apps/backend`, xác nhận rằng API vẫn gọi qua HTTP / `@workspace/api-client`.
- Nếu thêm package hoặc share logic, ghi chú `packages/*` và chạy `pnpm graphify:ai-summary` nếu cần.

## Nếu kiểm tra không pass
1. Đọc lỗi `pnpm check` trả về.
2. Chia lỗi theo nhóm:
   - `verify:bounds` → boundary/import sai
   - `lint` → style/import/cấu trúc
   - `typecheck` → kiểu dữ liệu
3. Sửa theo nhóm lỗi, rồi chạy lại `pnpm check`.

## Nếu cần cập nhật docs
- Nếu thay đổi cấu trúc hoặc feature mới: thêm/chỉnh `docs/pages/<feature>-implementation.md` hoặc `docs/steps/*.md` tương ứng.
- Nếu thay đổi ranh giới service: cập nhật `docs/hub-parent/MICROSERVICE_SYSTEM_MAP.md` hoặc `packages/eslint-config/service-boundaries.js` nếu có.

## Kết luận bước này
- `pnpm check` pass.
- Nếu cần, `pnpm check:full` pass.
- Giữ note thay đổi rõ ràng và theo scope.
