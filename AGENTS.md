# AGENTS Quick Guide (hub-parent-template)

Tài liệu này là **entry point ngắn gọn** cho agent. Chi tiết đầy đủ nằm trong `docs/hub-parent/`.

## Đọc trước khi sửa

1. `docs/hub-parent/README.md`
2. `docs/hub-parent/MICROSERVICE_SYSTEM_MAP.md`
3. `docs/hub-parent/AGENTS_GUIDE.md`
4. `docs/hub-parent/FRONTEND_UX.md` (khi chỉnh `apps/frontend`)
5. `apps/frontend/.graphify/SUMMARY_FOR_AI.md`
6. `apps/backend/.graphify/SUMMARY_FOR_AI.md`
7. `apps/api/.graphify/SUMMARY_FOR_AI.md`

Lưu ý: chỉ mở `apps/*/.graphify/context.json` khi cần trích đoạn cụ thể (file lớn, nhúng full source).

## Lệnh chuẩn bắt buộc

```bash
pnpm check
```

Nếu có thay đổi kiến trúc/module/routes và đã cập nhật `context.json`:

```bash
pnpm check:full
```

## Nguyên tắc microservice

- Không import chéo source giữa các app trong `apps/*`.
- Frontend/Backend giao tiếp với API qua HTTP + `@workspace/api-client`.
- Logic dùng chung đặt ở `packages/*` khi thật sự còn được sử dụng.
- Ranh giới được kiểm soát bởi:
  - `packages/eslint-config/service-boundaries.js`
  - `scripts/verify-service-boundaries.mjs`
