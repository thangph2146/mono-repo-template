# Step 3: Hub Parent Docs

Đây là bước đọc các tài liệu `docs/hub-parent/` để nắm quy trình và ranh giới microservice.

## Các file cần đọc
1. `docs/hub-parent/README.md`
   - Giới thiệu mục đích của thư mục `docs/hub-parent/`.
   - Làm rõ đây là bộ tài liệu cho AI/agent.
2. `docs/hub-parent/PRE_CODE_PROTOCOL.md`
   - Quy trình bắt buộc trước khi sửa code.
   - Thứ tự đọc docs và mapping feature docs.
3. `docs/hub-parent/MICROSERVICE_SYSTEM_MAP.md`
   - Bản đồ kiến trúc dịch vụ.
   - Ranh giới giữa `apps/api`, `apps/frontend`, `apps/backend`, và `packages/*`.
4. `docs/hub-parent/AGENTS_GUIDE.md`
   - Hướng dẫn agent vận hành.
   - Quy trình đọc, code, kiểm tra, và tự điều chỉnh.
5. `docs/hub-parent/FRONTEND_UX.md`
   - Chỉ cần đọc khi nhiệm vụ liên quan `apps/frontend`.
   - UX, a11y, và quy tắc UI storefront.

## Mục tiêu bước này
- Xác định đúng phạm vi của task: app, package, feature.
- Hiểu rõ ranh giới không import chéo giữa `apps/*`.
- Hiểu các quy tắc agent phải tuân thủ khi đọc, sửa và kiểm tra.
- Xác định nếu cần đọc tài liệu feature cụ thể trong `docs/pages/`.

## Gợi ý
- Nếu ta sửa `apps/frontend`, hãy đọc thêm `FRONTEND_UX.md`.
- Nếu task là admin page/backend, ta cần tìm docs feature tương ứng trong `docs/pages/`.
- Không sửa code trước khi đã đọc ít nhất `PRE_CODE_PROTOCOL.md` và `MICROSERVICE_SYSTEM_MAP.md`.
