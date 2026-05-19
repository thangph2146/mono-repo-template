# Step 8: Architecture Maintenance and System Updates

Đây là bước dành cho bảo trì kiến trúc, cập nhật docs, và giữ hệ thống sạch lâu dài.

## Mục tiêu
- Duy trì kiến trúc hệ thống sau khi hoàn thành task.
- Cập nhật tài liệu nội bộ khi hệ thống thay đổi.
- Kiểm tra và giữ clean các ranh giới service.

## Những việc cần làm
1. Kiểm tra lại các thay đổi kiến trúc sau khi merge:
   - route mới
   - module mới
   - package workspace mới
   - thay đổi import boundaries
2. Cập nhật `docs/pages/` nếu feature mới cần hướng dẫn implementation thêm.
3. Cập nhật `docs/hub-parent/MICROSERVICE_SYSTEM_MAP.md` nếu kiến trúc service đã thay đổi.
4. Cập nhật `packages/eslint-config/service-boundaries.js` khi boundary rules cần mở rộng hoặc siết chặt.
5. Nếu có thay đổi dependency workspace, chạy `pnpm graphify:ai-summary`.

## Khi cần bảo trì Graphify
- Sau khi thêm hoặc di chuyển module/route: chạy

```bash
node scripts/graphify-update.cjs apps/<app>
pnpm graphify:ai-summary
```

- Nếu thêm package workspace: chạy lại `pnpm graphify:ai-summary`.
- Nếu chỉ sửa code nội bộ nhỏ không thay đổi module/route: `pnpm check` vẫn đủ.

## Ghi nhớ thay đổi hệ thống
- Ghi lại trong PR hoặc commit message nếu:
  - đổi ranh giới `apps/*`
  - thêm package workspace mới
  - thay đổi API contract
  - thêm route/public page mới
- Khi task xong, cập nhật checklist hệ thống như sau:
  - `pnpm check` pass
  - `pnpm check:full` pass nếu đã chạy Graphify
  - docs liên quan đã được cập nhật
  - reviewer đã xác nhận không sai boundary

## Kết luận
Step 8 là bước dành cho việc giữ nhịp hệ thống sau khi thay đổi đã được thực hiện, để duy trì tính sạch, nhất quán và dễ đọc cho agent AI.
