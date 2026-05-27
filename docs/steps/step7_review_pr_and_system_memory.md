# Step 7: Review, PR, and System Memory

Đây là bước cuối cùng: review thay đổi, chuẩn bị PR, và ghi nhớ trạng thái hệ thống.

## Mục tiêu
- Đảm bảo code mới tuân thủ quy trình từ step 1–6.
- Viết PR rõ ràng và ghi nhớ các thay đổi hệ thống.
- Đảm bảo reviewer có đủ context để đánh giá.

## Checklist review
1. Đọc lại các bước đã thực hiện ở `docs/steps/step1...step6`.
2. Xác nhận các file thay đổi phù hợp scope.
3. Kiểm tra:
   - không import chéo giữa `apps/*`
   - API gọi qua HTTP / `@workspace/api-client`
   - shared logic nằm trong `packages/*` nếu cần
4. Chạy lại `pnpm check`.
5. Nếu có thay đổi cấu trúc lớn, xác nhận `pnpm check:full` pass.

## Ghi nhớ hệ thống hiện tại
- Ghi note các module mới, route mới, hoặc API mới.
- Ghi note nếu thay đổi đã ảnh hưởng đến `apps/frontend`, `apps/backend`, `apps/api`, hoặc `packages/*`.
- Ghi note nếu cần cập nhật docs feature trong `docs/pages/`.

## Viết PR
1. Tiêu đề ngắn gọn và rõ ràng.
2. Mô tả:
   - Mục tiêu của thay đổi.
   - Scope: app/package/module ảnh hưởng.
   - Các bước test đã chạy.
3. Danh sách file chính đã thay đổi.
4. Nếu cần, đề xuất reviewer chuyên môn cho `apps/api`, `apps/backend`, `apps/frontend`, hoặc `packages/*`.

## Ghi nhớ hệ thống cho reviewer
- Nếu task là feature mới: trỏ tới `docs/pages/<feature>-implementation.md`.
- Nếu task là thay đổi kiến trúc: trỏ tới `docs/hub-parent/MICROSERVICE_SYSTEM_MAP.md`.
- Nếu task là thay đổi boundary: trỏ tới `packages/eslint-config/service-boundaries.js` và `scripts/verify-service-boundaries.mjs`.

## Hoàn thành bước này
- PR đã sẵn sàng với context rõ ràng.
- Không còn lỗi `pnpm check`.
- Nếu cần, đã chạy `pnpm check:full`.
- Tài liệu nội bộ/guide được cập nhật nếu thay đổi hệ thống có tính chất tái sử dụng.
