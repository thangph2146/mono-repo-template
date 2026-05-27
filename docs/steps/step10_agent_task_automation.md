# Step 10: Agent Task Automation and Final Checklist

Đây là bước dành cho việc tự động hóa task của agent và đóng vòng hoàn chỉnh trước khi dừng.

## Mục tiêu
- Giúp agent đi theo quy trình đã định một cách có hệ thống.
- Tự động hóa các bước lặp lại khi đọc và sửa code.
- Hoàn tất vòng kiểm tra cuối cùng.

## Agent task automation
1. Nhận task và xác định scope.
2. Đọc các bước step 1–9 theo thứ tự:
   - `step1_system_overview`
   - `step2_clean_code_guidelines`
   - `step3_hub_parent_docs`
   - `step4_graphify_reading`
   - `step5_feature_implementation_guides`
   - `step6_code_execution_and_change_tracking`
   - `step7_review_pr_and_system_memory`
   - `step8_architecture_maintenance`
   - `step9_follow_up_rollback_legacy_tracking`
3. Ghi lại trạng thái hệ thống và các thay đổi đã thực hiện.
4. Nếu task cần code, mở file source mục tiêu sau khi đã đọc đủ docs và Graphify.

## Final checklist
- [ ] Đã xác nhận scope task.
- [ ] Đã đọc `docs/hub-parent/PRE_CODE_PROTOCOL.md`.
- [ ] Đã đọc docs feature tương ứng nếu cần.
- [ ] Đã dùng Graphify để định vị file.
- [ ] Đã sửa code theo boundary rules.
- [ ] Đã chạy `pnpm check`.
- [ ] Nếu cần, đã chạy `pnpm graphify:ai-summary` và `pnpm check:full`.
- [ ] Đã ghi chú thay đổi và PR context.
- [ ] Đã cập nhật docs nếu hệ thống thay đổi.

## Kết luận
Bước 10 là bước tổng kết để đảm bảo agent không bỏ sót bước nào và có thể dừng lại sau khi hoàn thành task theo quy trình.
