# Step 9: Follow-Up, Rollback, and Legacy Issue Tracking

Đây là bước sau cùng để quản lý các trường hợp cần theo dõi, rollback hoặc issue legacy.

## Mục tiêu
- Giữ kiểm soát khi phát hiện vấn đề sau merge.
- Thực hiện rollback an toàn khi cần.
- Ghi lại issue legacy và follow-up tasks rõ ràng.

## Khi phát hiện lỗi sau merge
1. Xác minh lỗi:
   - lỗi production hay lỗi local/test?
   - phạm vi ảnh hưởng (app/package/doc)?
2. Nếu cần rollback nhanh:
   - revert commit hoặc branch thay đổi
   - nhưng vẫn giữ note vấn đề để tái làm lại đúng cách
3. Nếu không rollback ngay:
   - tạo issue follow-up với các bước reproduce
   - gắn nhãn `bug`, `follow-up`, hoặc `tech-debt`

## Ghi lại issue legacy
- Mô tả rõ:
  - thay đổi gây ra issue
  - nguyên nhân và phạm vi
  - tác động đến `apps/frontend`, `apps/backend`, `apps/api`, hoặc `packages/*`
- Đính kèm file logs / output `pnpm check` nếu liên quan.
- Đề xuất bước sửa tiếp theo.

## Quy trình follow-up tasks
1. Tạo issue mới hoặc assigned task rõ ràng.
2. Đặt priority dựa trên mức độ ảnh hưởng.
3. Nếu issue liên quan boundary hoặc Graphify, thêm note:
   - `verify:bounds`
   - `pnpm graphify:ai-summary`
4. Ghi lại documentation update cần làm.

## Rollback an toàn
- Nếu rollback, đảm bảo:
  - `pnpm check` pass trên branch rollback
  - issue follow-up vẫn được tạo để xử lý lại sau
- Tránh rollback hoàn toàn nếu lỗi có thể fix nhanh và cần giữ lịch sử.

## Kết luận
Step 9 giúp agent xử lý hậu trường khi có vấn đề trong hệ thống, đảm bảo các thay đổi legacy được tracking rõ ràng và rollback/ follow-up được thực hiện an toàn.
