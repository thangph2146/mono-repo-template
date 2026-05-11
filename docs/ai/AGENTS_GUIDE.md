# Hướng dẫn cho AI / agent (store-sync)

Tài liệu này giúp **hiểu nhanh hệ thống**, **sửa đúng chỗ**, **chạy kiểm tra**, và **lặp lại cho đến khi sạch lỗi**.

Tài liệu tổng quan kiến trúc microservice: `docs/ai/MICROSERVICE_SYSTEM_MAP.md`.

## 1. Đọc theo thứ tự (bản đồ trước, chi tiết sau)

| Thứ tự | Nội dung | Mục đích |
|--------|----------|----------|
| 1 | `apps/frontend/.graphify/SUMMARY_FOR_AI.md` | Storefront Next, route, import |
| 2 | `apps/backend/.graphify/SUMMARY_FOR_AI.md` | Admin Next |
| 3 | `apps/api/.graphify/SUMMARY_FOR_AI.md` | Nest API: module, controller, entity |
| 4 | `packages/eslint-config/service-boundaries.js` | Ranh giới import giữa service |
| 5 | Source cụ thể (`*.ts`, `*.tsx`) | Chỉ mở khi đã biết file/module liên quan |

**Tránh** đọc toàn bộ `context.json` (rất dài, nhúng full source). Chỉ tra theo path khi cần đoạn code.

## 2. Sau khi chỉnh sửa code — lệnh bắt buộc

Từ **thư mục gốc repo**:

```bash
pnpm check
```

Gồm: `verify:bounds` (package.json) + `lint` + `typecheck`.

Nếu đổi **cấu trúc file/route/module** nhiều và đã cập nhật `apps/*/.graphify/context.json`:

```bash
pnpm graphify:ai-summary
```

Hoặc gộp kiểm tra + làm mới bản tóm tắt cho AI:

```bash
pnpm check:full
```
